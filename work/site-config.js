/* Public, non-secret configuration. The Supabase anon key and Turnstile SITE key are designed to be public.
   NEVER put the service-role key, Resend key, WhatsApp token, Turnstile secret or any phone number here. */
window.WW_CONFIG = {
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",
  TURNSTILE_SITE_KEY: "",
  FORM_ENABLED: false   // keep false until all backend tests have passed
};
