import { createClient } from "npm:@supabase/supabase-js@2";

const DEFAULT_ALLOWED_ORIGINS = ["https://web-waves.in", "https://www.web-waves.in"];
const configuredOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",").map((value) => value.trim()).filter(Boolean);
const allowedOrigins = [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...configuredOrigins])];

const corsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
});
const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};
const json = (body: unknown, status: number, origin: string) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders(origin), "Content-Type": "application/json", "Cache-Control": "no-store" },
});

async function sendEmail(enquiry: Record<string, string>, submissionId: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL");
  const to = Deno.env.get("ENQUIRY_NOTIFY_EMAIL") ?? "webwaves26@gmail.com";
  if (!apiKey || !from) return "not_configured";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from, to: [to], reply_to: enquiry.email,
      subject: `New Web Waves enquiry: ${enquiry.service.replace(/[\r\n]/g, " ")}`,
      text: [`Submission: ${submissionId}`, `Name: ${enquiry.name}`, `Email: ${enquiry.email}`,
        `Phone: ${enquiry.phone || "-"}`, `Company: ${enquiry.company || "-"}`,
        `Service: ${enquiry.service}`, `Budget: ${enquiry.budget || "-"}`, "", enquiry.message].join("\n"),
    }),
  });
  return response.ok ? "sent" : "failed";
}

async function sendWhatsApp(enquiry: Record<string, string>, submissionId: string) {
  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const recipient = Deno.env.get("WHATSAPP_NOTIFY_TO");
  if (!token || !phoneId || !recipient) return "not_configured";
  const language = Deno.env.get("WHATSAPP_TEMPLATE_LANG") ?? "en_US";
  const template = Deno.env.get("WHATSAPP_TEMPLATE_NAME") ?? "webwaves_new_enquiry";
  const graphVersion = Deno.env.get("WHATSAPP_API_VERSION") ?? "v22.0";
  const values = [enquiry.name, enquiry.service, enquiry.email, enquiry.budget || "Not provided", submissionId];
  const response = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneId}/messages`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: recipient, type: "template",
      template: { name: template, language: { code: language }, components: [{ type: "body",
        parameters: values.map((value) => ({ type: "text", text: value.replace(/[\r\n\t]+/g, " ").slice(0, 200) })) }] } }),
  });
  return response.ok ? "sent" : "failed";
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin") ?? "";
  if (request.method === "OPTIONS") {
    if (!allowedOrigins.includes(origin)) return new Response("forbidden", { status: 403 });
    return new Response("ok", { status: 204, headers: corsHeaders(origin) });
  }
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405, origin);
  if (!allowedOrigins.includes(origin)) return json({ ok: false, error: "Origin not allowed." }, 403, origin);

  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 20000) return json({ ok: false, error: "Request too large." }, 413, origin);
    const rawBody = await request.text();
    if (rawBody.length > 20000) return json({ ok: false, error: "Request too large." }, 413, origin);
    const body = JSON.parse(rawBody);
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ ok: false, error: "Invalid request." }, 400, origin);
    if (clean(body.website, 200)) return json({ ok: true, notificationStatus: "pending" }, 200, origin);

    const formStartedAt = Number(body.formStartedAt);
    const elapsed = Date.now() - formStartedAt;
    if (!Number.isFinite(formStartedAt) || elapsed < 1500 || elapsed > 6 * 60 * 60 * 1000)
      return json({ ok: false, error: "Please refresh the form and try again." }, 400, origin);

    const name = clean(body.name, 120);
    const email = clean(body.email, 160).toLowerCase();
    const phone = clean(body.phone, 45);
    const company = clean(body.company, 120);
    const service = clean(body.service, 160);
    const budget = clean(body.budget, 80);
    const message = clean(body.message, 4000);
    const consent = body.consent === "yes";
    const submissionId = clean(body.submissionId, 64);
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !service || message.length < 10 || !consent ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId))
      return json({ ok: false, error: "Please check the required fields and consent." }, 400, origin);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    let serviceKey = "";
    const secretKeysJson = Deno.env.get("SUPABASE_SECRET_KEYS");
    if (secretKeysJson) {
      try { const secretKeys = JSON.parse(secretKeysJson); serviceKey = typeof secretKeys.default === "string" ? secretKeys.default : ""; }
      catch { console.error("Supabase secret-key environment could not be parsed."); }
    }
    serviceKey ||= Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) return json({ ok: false, error: "The enquiry service is temporarily unavailable." }, 503, origin);
    const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    const ip = (request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0] ?? "").trim();
    if (ip) {
      const ipHash = await sha256(`webwaves-rate-limit:${ip}`);
      const { data: allowed, error: rateError } = await admin.rpc("webwaves_check_rate_limit", { p_key: ipHash, p_max: 5, p_window: "1 hour" });
      if (rateError) { console.error("Enquiry rate-limit check failed:", rateError.message); return json({ ok: false, error: "The enquiry service is temporarily unavailable." }, 503, origin); }
      if (!allowed) return json({ ok: false, error: "Too many enquiries. Please try again later." }, 429, origin);
    }

    const enquiry = { name, email, phone, company, service, budget, message };
    let { data: saved, error: lookupError } = await admin.from("webwaves_enquiries")
      .select("id,email_status,whatsapp_status").eq("submission_id", submissionId).maybeSingle();
    if (lookupError) throw lookupError;
    if (!saved) {
      const { data, error } = await admin.from("webwaves_enquiries").insert({
        submission_id: submissionId, ...enquiry, consented_at: new Date().toISOString(), privacy_version: "2026-11-25",
      }).select("id,email_status,whatsapp_status").single();
      if (error) {
        const retry = await admin.from("webwaves_enquiries").select("id,email_status,whatsapp_status").eq("submission_id", submissionId).maybeSingle();
        if (retry.error || !retry.data) throw error;
        saved = retry.data;
      } else saved = data;
    }
    const [emailResult, whatsappResult] = await Promise.all([
      saved.email_status === "sent" ? Promise.resolve("sent") : sendEmail(enquiry, submissionId).catch(() => "failed"),
      saved.whatsapp_status === "sent" ? Promise.resolve("sent") : sendWhatsApp(enquiry, submissionId).catch(() => "failed"),
    ]);
    const emailStatus = emailResult;
    const whatsappStatus = whatsappResult;
    const { error: updateError } = await admin.from("webwaves_enquiries").update({ email_status: emailStatus, whatsapp_status: whatsappStatus }).eq("submission_id", submissionId);
    if (updateError) console.error("Could not update notification status:", updateError.message);
    const notificationStatus = emailStatus === "sent" && whatsappStatus === "sent" ? "both_sent" :
      emailStatus === "sent" || whatsappStatus === "sent" ? "partial" : "pending";
    return json({ ok: true, notificationStatus }, 200, origin);
  } catch (error) {
    console.error("submit-enquiry failed:", error instanceof Error ? error.message : "unknown error");
    return json({ ok: false, error: "We could not submit your enquiry right now. Please try again later." }, 500, origin);
  }
});
