-- Hardening: abuse controls, notification status, locked-down grants.
alter table public.webwaves_enquiries
  add column if not exists email_status text not null default 'pending',
  add column if not exists whatsapp_status text not null default 'pending',
  add column if not exists ip_hash text;

-- Table privileges: browser roles get nothing except what RLS policies allow.
revoke all on public.webwaves_enquiries from anon;
revoke insert, delete on public.webwaves_enquiries from authenticated;
grant select, update on public.webwaves_enquiries to authenticated;
drop policy if exists "Web Waves team can delete enquiries" on public.webwaves_enquiries;

create table if not exists public.webwaves_rate_limits (
  key text not null, hit_at timestamptz not null default now()
);
create index if not exists webwaves_rate_limits_key_idx on public.webwaves_rate_limits (key, hit_at);
alter table public.webwaves_rate_limits enable row level security;
revoke all on public.webwaves_rate_limits from anon, authenticated;

create or replace function public.webwaves_check_rate_limit(p_key text, p_max int, p_window interval)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  delete from webwaves_rate_limits where hit_at < now() - interval '1 day';
  select count(*) into n from webwaves_rate_limits where key = p_key and hit_at > now() - p_window;
  if n >= p_max then return false; end if;
  insert into webwaves_rate_limits(key) values (p_key);
  return true;
end $$;
revoke all on function public.webwaves_check_rate_limit(text,int,interval) from public, anon, authenticated;
grant execute on function public.webwaves_check_rate_limit(text,int,interval) to service_role;
