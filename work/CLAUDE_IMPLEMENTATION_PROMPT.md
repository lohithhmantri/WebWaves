# Claude implementation instructions — Web Waves

You are working in the existing Web Waves website repository. Read `README_BACKEND_SETUP.md`, inspect all existing source and assets, then continue implementation.

## Owner-approved requirements

1. Preserve the existing premium visual identity, content and working assets. Do not redesign from scratch.
2. Keep the business name exactly **Web Waves**.
3. Use this tagline: **Tailored Solutions. Trusted Scalable Software. Smarter Business Operations.**
4. CRM replaces ORM terminology. Bulk Calling must be a separate CRM service and cover:
   - Bulk automated voice calls
   - AI-powered voice calling
   - Lead follow-up and reminder calls
   - Campaign calling with call reports
5. Repair navigation and mobile menus, keep Browse service categories nested under All Services, and close the desktop services mega-menu on scroll.
6. The homepage Explore Platform action must open the dedicated Platform page.
7. Preserve the existing promotional film URL `https://www.ozor.ai/share/elb3iu4`, present it with a clear play control and professional caption.
8. Fix Concept Study links and clearly label all sample/fictitious data as simulated.
9. Contact form Project budget must be a free-text input with the exact placeholder **Enter your budget**. No dropdown, preset ranges, examples or extra budget helper text.
10. Enquiry data must never be displayed publicly. The internal WhatsApp notification destination must never appear in frontend code or public pages.
11. Admin access is for authenticated Web Waves team members only. No public admin demo, fake login or browser-local storage.
12. Fix FAQ, Insights, Privacy and footer navigation.
13. Replace the informal 404 copy with a professional not-found page.
14. Do not publish without explicit owner approval.

## Backend architecture selected by owner

- Supabase: database, authentication, Edge Functions
- Resend: private enquiry email notifications to `webwaves26@gmail.com`
- Official Meta WhatsApp Business Platform / Cloud API: private notifications to the owner's internal notification destination, supplied directly in secure Supabase secrets by the owner.

## Required backend work

- Review the SQL migration and Edge Function scaffold under `supabase/`.
- Complete and test Supabase RLS. Public users must not be able to select, update or delete enquiry rows. Inserts should only occur through the validated Edge Function using the service-role key.
- Implement Supabase Auth team login. Admin role must be assigned only through trusted admin tooling using `app_metadata`; never allow self-assignment.
- Build the team dashboard with protected reads and updates.
- Complete the Resend and WhatsApp Cloud API integrations. Match the actual approved WhatsApp template's language and parameter order; do not assume the template exists.
- Add rate limiting and CAPTCHA/Turnstile verification, server-side input validation, safe error handling and monitoring.
- Keep all secrets in Supabase Edge Function secrets or other server-side environment variables. Never expose a service-role key, Resend key or WhatsApp token in browser JavaScript, HTML, Git history or public files.
- The form must remain disabled until backend setup, notification configuration, abuse controls, authentication and end-to-end tests all pass. A visual form is not proof of backend functionality.
- Never hardcode the owner's private WhatsApp number into code or docs. Ask the owner to enter it directly into `WHATSAPP_NOTIFY_TO` in Supabase secrets.

## Validation checklist

- Check all routes and links.
- Check mobile menu and service menu behavior.
- Check budget field placeholder exactly.
- Check no localStorage demo lead storage remains.
- Check no public Admin Demo link or exposed customer records remain.
- Check platform page and video action.
- Check FAQ/Insights/Privacy links.
- Test anonymous attempts to read/write enquiries are denied.
- Test authorised team login and dashboard access.
- Test email and WhatsApp delivery using test enquiries.
- Test rate limiting and CAPTCHA.
- Test desktop and Android mobile layouts.
- Report any requirement not completed; do not claim success without evidence.

Start by auditing the current files and produce a concise implementation checklist. Then implement the remaining work, run tests, and provide a preview. Do not publish until the owner explicitly approves.
