# Publish the Web Waves enquiry form

The GitHub integration can read `lohithhmantri/WebWaves` but writes are blocked with HTTP 403. Publish manually using a GitHub account with repository write access:

1. Open https://github.com/lohithhmantri/WebWaves and select branch `main`.
2. Upload/replace `index.html` and `site-config.js` from this package.
3. Upload/replace `supabase/functions/submit-enquiry/index.ts` and `supabase/config.toml`; add migration `supabase/migrations/202611250001_enable_public_enquiry_submissions.sql`.
4. Preserve existing `assets/`, `favicon.png`, `CNAME`, `admin/` and other repository files.
5. Commit and wait for GitHub Pages to publish.
6. Visit https://web-waves.in/#/contact and submit one test enquiry. Check `public.webwaves_enquiries` in Supabase and verify the email in Resend > Emails and in `webwaves26@gmail.com`.

Do not upload `.env`, service-role keys, Resend API keys, WhatsApp access tokens or the private WhatsApp recipient number. The current site remains on its previous disabled contact form until this publication step is complete.
