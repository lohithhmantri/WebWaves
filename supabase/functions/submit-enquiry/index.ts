import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const allowed = (Deno.env.get("ALLOWED_ORIGINS") ?? "https://web-waves.in").split(",").map((s) => s.trim());
const cors = (origin: string) => ({
  "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0],
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const sha256 = async (t: string) =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)))]
    .map((b) => b.toString(16).padStart(2, "0")).join("");

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
  const headers = { ...cors(origin), "Content-Type": "application/json" };
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers });
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  // Fail closed until the owner has completed and tested the full setup.
  if (Deno.env.get("FORM_ENABLED") !== "true") return json({ error: "Enquiries are not open yet." }, 503);
  if (!allowed.includes(origin)) return json({ error: "Origin not allowed" }, 403);

  try {
    const raw = await req.text();
    if (raw.length > 20000) return json({ error: "Request too large" }, 413);
    const body = JSON.parse(raw);
    if (clean(body.website, 200)) return json({ ok: true }); // honeypot

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const turnstile = Deno.env.get("TURNSTILE_SECRET_KEY");
    const salt = Deno.env.get("IP_HASH_SALT");
    if (!supabaseUrl || !serviceKey || !turnstile || !salt) throw new Error("Server not fully configured");

    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
    const ipHash = await sha256(salt + ip);

    // CAPTCHA (Cloudflare Turnstile), verified server-side.
    const token = clean(body.turnstileToken, 2048);
    if (!token) return json({ error: "Please complete the verification." }, 400);
    const tv = await (await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret: turnstile, response: token, remoteip: ip }),
    })).json();
    if (!tv.success) return json({ error: "Verification failed. Please try again." }, 400);

    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: okRate, error: rlErr } = await supabase.rpc("webwaves_check_rate_limit", { p_key: ipHash, p_max: 5, p_window: "1 hour" });
    if (rlErr) throw rlErr;
    if (!okRate) return json({ error: "Too many enquiries. Please try again later." }, 429);

    const name = clean(body.name, 120), email = clean(body.email, 160).toLowerCase();
    const phone = clean(body.phone, 45), company = clean(body.company, 120);
    const service = clean(body.service, 160), budget = clean(body.budget, 80), message = clean(body.message, 4000);
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !service || message.length < 10)
      return json({ error: "Please check the required fields." }, 400);

    const { data, error } = await supabase.from("webwaves_enquiries")
      .insert({ name, email, phone, company, service, budget, message, ip_hash: ipHash })
      .select("id").single();
    if (error) throw error;

    let emailStatus = "not_configured", waStatus = "not_configured";
    const rk = Deno.env.get("RESEND_API_KEY"), from = Deno.env.get("RESEND_FROM_EMAIL");
    if (rk && from) {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST", headers: { Authorization: `Bearer ${rk}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from, to: [Deno.env.get("ENQUIRY_NOTIFY_EMAIL") ?? "webwaves26@gmail.com"], reply_to: email,
          subject: `New Web Waves enquiry: ${service.replace(/[\r\n]/g, " ")}`,
          text: [`Enquiry ID: ${data.id}`, `Name: ${name}`, `Email: ${email}`, `Phone: ${phone || "-"}`,
            `Company: ${company || "-"}`, `Service: ${service}`, `Budget: ${budget || "-"}`, "", message].join("\n"),
        }),
      });
      emailStatus = r.ok ? "sent" : "failed";
      if (!r.ok) console.error("resend_failed", r.status);
    }
    const tk = Deno.env.get("WHATSAPP_ACCESS_TOKEN"), pid = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID"), to = Deno.env.get("WHATSAPP_NOTIFY_TO");
    if (tk && pid && to) {
      const r = await fetch(`https://graph.facebook.com/v22.0/${pid}/messages`, {
        method: "POST", headers: { Authorization: `Bearer ${tk}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp", to, type: "template",
          template: {
            name: Deno.env.get("WHATSAPP_TEMPLATE_NAME") ?? "webwaves_new_enquiry",
            language: { code: Deno.env.get("WHATSAPP_TEMPLATE_LANG") ?? "en" },
            // Parameter order MUST match the approved template body.
            components: [{ type: "body", parameters: [name, service, email, budget || "Not provided", data.id]
              .map((text) => ({ type: "text", text: text.replace(/[\r\n\t]+/g, " ").slice(0, 200) })) }],
          },
        }),
      });
      waStatus = r.ok ? "sent" : "failed";
      if (!r.ok) console.error("whatsapp_failed", r.status);
    }
    await supabase.from("webwaves_enquiries").update({ email_status: emailStatus, whatsapp_status: waStatus }).eq("id", data.id);
    return json({ ok: true }); // never echo internal ids or provider errors
  } catch (e) {
    console.error("submit-enquiry error", (e as Error).message);
    return json({ error: "We could not submit your enquiry right now. Please try again later." }, 500);
  }
});
