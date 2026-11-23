# Web Waves website update package

This package contains the original Web Waves static website and an implementation starting point for the approved corrections.

## What has been changed in the website source

- Preserved the existing single-page website, styles, brand assets and overall visual direction.
- Updated visible ORM terminology to CRM and added Bulk Calling as a distinct service with the requested scope.
- Added a dedicated `#/platform` page and connected the homepage Platform call-to-action and navigation to it.
- Replaced the project-budget dropdown with a free-text field whose exact placeholder is **Enter your budget**. No preset ranges or examples.
- Removed the browser-local enquiry demo and public Admin Demo link. The contact form is visibly disabled until secure server-side processing is completed.
- Replaced the local-demo privacy copy with an honest pre-launch privacy explanation.
- Replaced the informal 404 message with a professional not-found message.
- Updated the footer tagline and added Platform navigation.
- Close the services mega-menu after scrolling.

## Important deployment status

This is **not yet a fully live backend**. The website's enquiry form is deliberately disabled. Do not enable it until Supabase, Resend, WhatsApp Cloud API, team authentication, abuse protection and end-to-end tests are configured.

The files in `supabase/` are a backend scaffold:
- `migrations/202611230001_create_webwaves_enquiries.sql` creates a private enquiries table with RLS enabled and no public policies.
- `functions/submit-enquiry/index.ts` is a server-side Edge Function starting point. It stores enquiries with the service-role key and attempts Resend and WhatsApp template notifications when configured.
- `.env.example` lists secret names only; it contains no credentials.

The Edge Function needs a production security review before launch. Add rate limiting and a CAPTCHA/Turnstile verification, verify the exact allowed origin(s), configure and test approved WhatsApp template parameters, and ensure notification failures are monitored. A successful response means the record is stored; notification delivery must be monitored separately.

## Backend setup (Claude should complete with the owner)

1. Create a Supabase production project in Mumbai if available.
2. Apply the SQL migration.
3. Deploy the `submit-enquiry` Edge Function.
4. Set secrets using Supabase Edge Function secrets, never in browser JavaScript:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `ENQUIRY_NOTIFY_EMAIL`
   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_NOTIFY_TO`
   - `WHATSAPP_TEMPLATE_NAME`
5. Verify `web-waves.in` in Resend and configure a sender address on that domain.
6. Complete Meta Business verification/WhatsApp Cloud API setup as required, register a sending number, and create/approve a WhatsApp template named `webwaves_new_enquiry` with five body text parameters in this order: visitor name, service, email, budget, enquiry ID. Adjust the function to match the actual approved template and language.
7. Create the team admin user(s). Assign `app_metadata.role = webwaves_admin` only from a trusted server/admin process. Never let a user set their own admin role.
8. Build a real authenticated admin interface. Use Supabase Auth and RLS; never expose service-role credentials.
9. Add CAPTCHA/Turnstile and rate limiting before enabling public form submissions.
10. Enable the website form only after successful end-to-end tests on desktop and mobile.

## Existing site

- Domain: https://web-waves.in/
- GitHub repository: https://github.com/lohithhmantri/WebWaves
- Entry file: `index.html`
- Public business email: `webwaves26@gmail.com`
- Public phone: `7675063399`
- The internal WhatsApp notification destination is intentionally not printed in this package. Enter it directly into the secure Supabase secret `WHATSAPP_NOTIFY_TO` during setup. Do not expose it in frontend source, public docs or page content.

## Claude handoff

Read `CLAUDE_IMPLEMENTATION_PROMPT.md` and the whole repository before making further edits. Preserve all assets. Do not publish to production without explicit owner approval.
