-- Public enquiry fields for idempotency and recorded consent.
alter table public.webwaves_enquiries
  add column if not exists submission_id uuid default gen_random_uuid(),
  add column if not exists consented_at timestamptz default now(),
  add column if not exists privacy_version text default '2026-11-25';

update public.webwaves_enquiries set submission_id=gen_random_uuid() where submission_id is null;
alter table public.webwaves_enquiries
  alter column submission_id set not null,
  alter column consented_at set default now(), alter column consented_at set not null,
  alter column privacy_version set default '2026-11-25', alter column privacy_version set not null;
create unique index if not exists webwaves_enquiries_submission_id_uidx on public.webwaves_enquiries(submission_id);

create or replace function public.webwaves_check_rate_limit(p_key text,p_max integer,p_window interval)
returns boolean language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  delete from public.webwaves_rate_limits where hit_at < now()-interval '1 day';
  select count(*) into n from public.webwaves_rate_limits where key=p_key and hit_at>now()-p_window;
  if n>=p_max then return false; end if;
  insert into public.webwaves_rate_limits(key) values(p_key); return true;
end $$;
revoke all on function public.webwaves_check_rate_limit(text,integer,interval) from public,anon,authenticated;
grant execute on function public.webwaves_check_rate_limit(text,integer,interval) to service_role;
