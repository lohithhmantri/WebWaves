-- Team-only private insights + shared admin check. Admin role lives in app_metadata (not user-editable).
create or replace function public.is_webwaves_admin() returns boolean
language sql stable as $$ select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'webwaves_admin', false) $$;

create table if not exists public.webwaves_private_insights (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  author uuid default auth.uid(),
  title text not null check (char_length(title) between 1 and 200),
  body text not null check (char_length(body) between 1 and 20000)
);
alter table public.webwaves_private_insights enable row level security;
revoke all on public.webwaves_private_insights from anon;
grant select, insert, update, delete on public.webwaves_private_insights to authenticated;

create policy "team select insights" on public.webwaves_private_insights for select to authenticated using (public.is_webwaves_admin());
create policy "team insert insights" on public.webwaves_private_insights for insert to authenticated with check (public.is_webwaves_admin());
create policy "team update insights" on public.webwaves_private_insights for update to authenticated using (public.is_webwaves_admin()) with check (public.is_webwaves_admin());
create policy "team delete insights" on public.webwaves_private_insights for delete to authenticated using (public.is_webwaves_admin());

create or replace function public.webwaves_touch() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists webwaves_insights_touch on public.webwaves_private_insights;
create trigger webwaves_insights_touch before update on public.webwaves_private_insights for each row execute function public.webwaves_touch();
