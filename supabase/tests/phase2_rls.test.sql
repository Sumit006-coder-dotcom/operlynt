create extension if not exists pgtap with schema extensions;
begin;
select extensions.plan(8);
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
('10000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase2-owner@example.test','',now(),'{}','{}',now(),now()),
('10000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase2-other@example.test','',now(),'{}','{}',now(),now())
on conflict(id) do nothing;
insert into public.resumes(user_id,title) values
('10000000-0000-4000-8000-000000000001','Owner resume'),('10000000-0000-4000-8000-000000000002','Other resume');
insert into public.courses(slug,title,is_published) values('phase2-public-course','Public course',true),('phase2-hidden-course','Hidden course',false) on conflict(slug) do nothing;
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select extensions.is((select count(*)::integer from public.resumes),1,'user sees only their resume');
select extensions.is((select count(*)::integer from public.profiles where id='10000000-0000-4000-8000-000000000001'),1,'auth trigger creates and exposes own profile');
select extensions.is((select count(*)::integer from public.profiles where id='10000000-0000-4000-8000-000000000002'),0,'user cannot read another profile');
select extensions.ok(not has_table_privilege('authenticated','public.usage_counters','INSERT'),'usage counters cannot be directly inserted');
select extensions.ok(not has_table_privilege('authenticated','public.usage_counters','UPDATE'),'usage counters cannot be directly changed');
select extensions.ok(not has_table_privilege('authenticated','public.usage_events','INSERT'),'usage events can only be created through RPC');
set local role anon;
select extensions.is((select count(*)::integer from public.courses),1,'anonymous users see only published courses');
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
select extensions.is((select count(*)::integer from public.resumes where title='Owner resume'),0,'second user cannot read first user resume');
reset role;
select * from extensions.finish();
rollback;
