# Web Waves website — public enquiry capture

This package connects the website contact form to the Web Waves Supabase project. Enquiries are stored in the private `public.webwaves_enquiries` table. The form requires consent and applies server-side validation, rate limiting, a hidden honeypot, a minimum completion-time check and retry-safe submission IDs.

`site-config.js` contains only the public Supabase URL and publishable key. Never put a service-role/secret key, Resend API key, WhatsApp token or private notification number in browser files.

The active Supabase Edge Function is version 9. The owner has configured the Resend credentials in Supabase Function Secrets and confirmed the sending domain is verified. Email delivery still needs an end-to-end form test after the frontend is published. WhatsApp remains optional and unconfigured until Meta credentials/template are added.

## Publish
Upload/replace `index.html`, `site-config.js`, `supabase/functions/submit-enquiry/index.ts`, `supabase/config.toml`, the new migration, and the documentation files at the root of the existing GitHub Pages repository on `main`. Preserve `assets/`, `favicon.png`, `CNAME`, `admin/` and other existing files.
