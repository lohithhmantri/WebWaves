-- Web Waves production enquiry storage
-- Apply this migration in the Supabase SQL editor.
create extension if not exists pgcrypto;

create table if not exists public.webwaves_enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) <= 160),
  phone text,
  company text,
  service text not null,
  budget text,
  message text not null check (char_length(message) between 10 and 4000),
  status text not null default 'new' check (status in ('new','contacted','qualified','closed'))
);

alter table public.webwaves_enquiries enable row level security;

-- No anonymous/public read, insert, update, or delete policies are created.
-- Only authenticated team users with app_metadata.role = 'webwaves_admin'
-- can read and manage enquiry records.
create policy "Web Waves team can read enquiries"
on public.webwaves_enquiries for select
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'webwaves_admin');

create policy "Web Waves team can update enquiries"
on public.webwaves_enquiries for update
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'webwaves_admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'webwaves_admin');

create policy "Web Waves team can delete enquiries"
on public.webwaves_enquiries for delete
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'webwaves_admin');

-- Inserts are performed only by the Edge Function using the service-role key.
-- Never expose the service-role key in the browser.
