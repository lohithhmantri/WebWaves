# Web Waves enquiry activation — 25 November 2026

## Backend state verified
- Supabase project `Web Waves` is active.
- Edge Function `submit-enquiry` is ACTIVE, version 9, with JWT verification disabled for the public form.
- The deployed function reads the private `RESEND_API_KEY`, `RESEND_FROM_EMAIL` and `ENQUIRY_NOTIFY_EMAIL` secrets; these are never placed in frontend code.
- The owner confirmed the new Resend API key, destination email secret and sender address have been saved in Supabase Function Secrets. The owner also confirmed `web-waves.in` is verified in Resend.
- Public enquiry table, private insights table and rate-limit table exist with RLS enabled. Earlier RLS checks passed.
- The deployed endpoint validates origin, request size, name/email/service/message, consent, honeypot and minimum form completion time; applies a server-side rate limit; uses a unique submission ID; stores consent timestamp and privacy version; and updates email/WhatsApp delivery states.

## Frontend state in this package
- Contact form posts directly to the Supabase Edge Function.
- Required consent, hidden honeypot, form start time and UUID submission ID are sent.
- The frontend does not require Turnstile; the deployed function uses the interim honeypot, timing and database rate-limit controls.
- The form reports full, partial or pending notification status instead of claiming unverified alerts.
- `site-config.js` contains only the Supabase URL and public publishable key, with `FORM_ENABLED: true`.

## Important publication and test state
- The repository `main` branch was checked after the user saved the secrets. Its `site-config.js` still has empty Supabase URL/key and `FORM_ENABLED: false`; `index.html` still contains the old Turnstile-only disabled form.
- The connected GitHub integration returned HTTP 403 on repository writes. Therefore the public website is not yet updated by this session.
- A direct live POST test could not be run from this execution environment because outbound DNS/network access is unavailable. No test enquiry was inserted and no test email has been claimed as delivered.
- After publishing this package, submit one test enquiry from `https://web-waves.in/#/contact`, confirm a row in Supabase `webwaves_enquiries`, and verify the actual email in Resend > Emails and in the receiving inbox.
- WhatsApp notification remains pending until Meta Cloud API credentials and an approved template are configured.

## Publishing
Upload the updated `index.html`, `site-config.js`, `supabase/functions/submit-enquiry/index.ts`, `supabase/config.toml`, the new migration, and README/status files to `main`. Preserve existing `assets/`, `favicon.png`, `CNAME`, `admin/` and other site files. Do not upload any private secret or API key.
