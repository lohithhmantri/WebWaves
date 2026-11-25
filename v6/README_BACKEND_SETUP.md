# Web Waves backend setup

## Resend
The owner has added `RESEND_API_KEY`, `RESEND_FROM_EMAIL` and `ENQUIRY_NOTIFY_EMAIL` in Supabase Edge Function Secrets and confirmed the sending domain `web-waves.in` is verified. Do not copy any secret value into this repository.

The deployed `submit-enquiry` Edge Function reads these variables server-side, submits an email with the visitor's address as `reply_to`, and records `email_status` as `sent`, `failed` or `not_configured`.

## WhatsApp (optional)
Add these server-side secrets only after completing Meta WhatsApp Cloud API setup and approving the matching template:
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_NOTIFY_TO` (private recipient, server-side only)
- `WHATSAPP_TEMPLATE_NAME` (default `webwaves_new_enquiry`)
- `WHATSAPP_TEMPLATE_LANG` (must match the approved template)
- `WHATSAPP_API_VERSION`

The approved body template must have five text parameters in this order: name, service, email, budget, submission ID.

## Team access
Create an Auth user and set `app_metadata.role = webwaves_admin` through a trusted admin process. Disable public sign-ups and enable MFA. Do not let users set their own admin role.
