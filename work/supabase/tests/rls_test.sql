-- Run in a Supabase SQL editor (or psql) AFTER applying all migrations. Everything is rolled back.
begin;
insert into public.webwaves_enquiries(name,email,service,message) values ('RLS Test','t@example.com','General enquiry','rls test message');
insert into public.webwaves_private_insights(title,body) values ('t','t');

set local role anon;
do $$ begin
  begin perform 1 from public.webwaves_enquiries; raise exception 'FAIL anon can read enquiries'; exception when insufficient_privilege then null; end;
  begin insert into public.webwaves_enquiries(name,email,service,message) values ('x','x@x.co','s','1234567890'); raise exception 'FAIL anon insert'; exception when insufficient_privilege then null; end;
  begin perform 1 from public.webwaves_private_insights; raise exception 'FAIL anon read insights'; exception when insufficient_privilege then null; end;
end $$;

-- Authenticated but NOT admin: must see zero rows and write none.
reset role; set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{},"user_metadata":{"role":"webwaves_admin"}}',true);
do $$ declare n int; begin
  select count(*) into n from public.webwaves_enquiries; if n<>0 then raise exception 'FAIL non-admin sees enquiries'; end if;
  select count(*) into n from public.webwaves_private_insights; if n<>0 then raise exception 'FAIL non-admin sees insights'; end if;
  begin insert into public.webwaves_private_insights(title,body) values ('a','b'); raise exception 'FAIL non-admin insert insights'; exception when others then if sqlerrm like 'FAIL%' then raise; end; end;
  begin delete from public.webwaves_enquiries; if found then raise exception 'FAIL delete'; end if; exception when insufficient_privilege then null; end;
end $$;

-- Admin (app_metadata.role) can read.
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated","app_metadata":{"role":"webwaves_admin"}}',true);
do $$ declare n int; begin
  select count(*) into n from public.webwaves_enquiries; if n<1 then raise exception 'FAIL admin cannot read enquiries'; end if;
  select count(*) into n from public.webwaves_private_insights; if n<1 then raise exception 'FAIL admin cannot read insights'; end if;
end $$;
rollback;
select 'ALL RLS CHECKS PASSED' as result;
