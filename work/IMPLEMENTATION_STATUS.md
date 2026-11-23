# Implementation status (preview build, NOT deployed, form DISABLED)

## Built and tested locally (Chromium; 1366px and 360px)
- 16 routes: no JS errors, no overflow, no empty pages. Budget field unchanged: "Project budget (optional)" / "Enter your budget".
- Contact form stays disabled by default (site-config.js: FORM_ENABLED=false, no keys). Enabled path was tested ONLY against mocks (fake Turnstile + fake endpoint).
- /admin/index.html: Supabase Auth email+password sign-in, admin-role check, enquiry list/status update, private insights create/list/delete. All data rendered as text (no XSS). Tested only in its "not configured" and "library offline" states.
- Migrations 1-3, Edge Function (fails closed), rls_test.sql written.

## NOT done / NOT verified (needs your accounts or tooling I do not have)
- No Supabase project exists: migrations not applied, function not deployed, RLS NOT tested (rls_test.sql is ready to run; no Postgres here).
- Admin login, enquiry reading and private insights NOT tested against a real Supabase project; no team user created.
- Resend: no domain verified, no email sent. WhatsApp Cloud API: no Meta setup, no template, no message sent. Turnstile: no real site/secret keys, no real challenge.
- No real enquiry submitted; no end-to-end delivery test; rate limit and CAPTCHA untested live.
- Recommended before launch: enable MFA for team users, set Supabase Auth to disable public sign-ups.

## Go-live order (owner)
1. Create Supabase project (disable sign-ups); run migrations 1-3, then supabase/tests/rls_test.sql (must print ALL RLS CHECKS PASSED).
2. Create team users in the dashboard, then set app_metadata {"role":"webwaves_admin"} via SQL: update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"webwaves_admin"}' where email='...';
3. Set secrets (see .env.example), deploy submit-enquiry, keep FORM_ENABLED=false.
4. Fill site-config.js (URL, anon key, Turnstile SITE key only). Test email + WhatsApp with FORM_ENABLED=true on the function; confirm both arrive.
5. Only then set FORM_ENABLED true in site-config.js and publish.
