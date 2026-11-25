-- Operlynt Phase 2: schema, ownership policies, plans, and atomic usage accounting.
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function private.create_profile_for_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function private.create_profile_for_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
for each row execute function private.create_profile_for_user();

create table public.resumes (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,id)
);
create table public.resume_analyses (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  resume_id uuid, input_hash text,
  result jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(user_id,resume_id) references public.resumes(user_id,id) on delete cascade
);
create table public.courses (
  id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null, description text not null default '',
  provider text, url text, level text, is_published boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.course_skills (
  id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses(id) on delete cascade,
  skill text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(course_id, skill)
);
create table public.course_bookmarks (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id, course_id)
);
create table public.learning_progress (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null, status text not null default 'started' check(status in ('started','in_progress','completed','paused')),
  progress_percent smallint not null default 0 check(progress_percent between 0 and 100), last_activity_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id, course_id)
);
create table public.interview_questions (
  id uuid primary key default gen_random_uuid(), category text not null, prompt text not null,
  difficulty text not null default 'beginner' check(difficulty in ('beginner','intermediate','advanced')),
  is_published boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.practice_questions (
  id uuid primary key default gen_random_uuid(), category text not null, topic text not null, prompt text not null,
  difficulty text not null default 'beginner' check(difficulty in ('beginner','intermediate','advanced')),
  answer_data jsonb not null default '{}'::jsonb, is_published boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.practice_attempts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid references public.practice_questions(id) on delete set null,
  answer jsonb not null default '{}'::jsonb, is_correct boolean, duration_seconds integer check(duration_seconds is null or duration_seconds >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.career_roadmaps (
  id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null, summary text not null default '',
  level text, is_published boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.roadmap_skills (
  id uuid primary key default gen_random_uuid(), roadmap_id uuid not null references public.career_roadmaps(id) on delete cascade,
  skill text not null, position integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(roadmap_id, skill)
);
create table public.recommendations (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null, entity_id uuid, reason text not null default '', dismissed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.usage_counters (
  user_id uuid not null references auth.users(id) on delete cascade, feature text not null,
  period_type text not null check(period_type in ('day','month')), period_start date not null,
  consumed_count integer not null default 0 check(consumed_count >= 0), reserved_count integer not null default 0 check(reserved_count >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key(user_id, feature, period_type, period_start)
);
create table public.usage_events (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null, request_key uuid not null, status text not null check(status in ('reserved','consumed','failed','expired')),
  day_start date not null, month_start date not null, failure_code text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), finalized_at timestamptz,
  unique(user_id, feature, request_key)
);
create table public.plans (
  id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null,
  usage_limits jsonb not null default '{}'::jsonb, is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id), status text not null check(status in ('trialing','active','past_due','canceled','expired')),
  current_period_start timestamptz, current_period_end timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.payments (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null, provider text, provider_payment_id text,
  amount_minor bigint not null default 0 check(amount_minor >= 0), currency text not null default 'INR', status text not null default 'pending',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(provider, provider_payment_id)
);
create table public.credit_balances (
  user_id uuid primary key references auth.users(id) on delete cascade, balance integer not null default 0 check(balance >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.payment_webhooks (
  id uuid primary key default gen_random_uuid(), provider text not null, provider_event_id text not null,
  event_type text not null, payload jsonb not null default '{}'::jsonb, processed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(provider, provider_event_id)
);

create index resumes_user_updated_idx on public.resumes(user_id, updated_at desc);
create index analyses_user_created_idx on public.resume_analyses(user_id, created_at desc);
create index bookmarks_user_idx on public.course_bookmarks(user_id, created_at desc);
create index learning_user_idx on public.learning_progress(user_id, updated_at desc);
create index attempts_user_idx on public.practice_attempts(user_id, created_at desc);
create index recommendations_user_idx on public.recommendations(user_id, created_at desc);
create index usage_events_user_feature_created_idx on public.usage_events(user_id, feature, created_at desc);
create index subscriptions_user_status_idx on public.subscriptions(user_id, status);
create index payments_user_created_idx on public.payments(user_id, created_at desc);
create index courses_published_idx on public.courses(is_published, title);
create index interview_questions_published_idx on public.interview_questions(is_published, category);
create index practice_questions_published_idx on public.practice_questions(is_published, category, topic);
create index roadmaps_published_idx on public.career_roadmaps(is_published, title);

insert into public.plans(slug,name,usage_limits) values
('free','Free','{"resume_builder_export":{"daily":2,"monthly":5},"resume_analyzer":{"daily":2,"monthly":5},"interview_question":{"daily":20,"monthly":100},"aptitude_test":{"daily":2,"monthly":10},"coding_sql_question":{"daily":10,"monthly":50},"ai_request":{"daily":2,"monthly":10}}'),
('premium','Premium','{"resume_builder_export":{"daily":null,"monthly":null},"resume_analyzer":{"daily":null,"monthly":null},"interview_question":{"daily":null,"monthly":null},"aptitude_test":{"daily":null,"monthly":null},"coding_sql_question":{"daily":null,"monthly":null},"ai_request":{"daily":null,"monthly":null}}')
on conflict(slug) do update set name=excluded.name, usage_limits=excluded.usage_limits, updated_at=now();

-- Every table has RLS. Published catalog content is readable; writes remain server/admin controlled.
do $$
declare t text;
begin
  foreach t in array array['profiles','resumes','resume_analyses','courses','course_skills','course_bookmarks','learning_progress','interview_questions','practice_questions','practice_attempts','career_roadmaps','roadmap_skills','recommendations','usage_counters','usage_events','plans','subscriptions','payments','credit_balances','payment_webhooks'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create trigger %I before update on public.%I for each row execute function private.set_updated_at()', t||'_set_updated_at', t);
  end loop;
end $$;

create policy "profile owner read" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profile owner update" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "resume owner all" on public.resumes for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "analysis owner all" on public.resume_analyses for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "published courses read" on public.courses for select to anon, authenticated using (is_published);
create policy "published course skills read" on public.course_skills for select to anon, authenticated using (exists(select 1 from public.courses c where c.id=course_id and c.is_published));
create policy "bookmark owner all" on public.course_bookmarks for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "learning owner all" on public.learning_progress for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "published interview questions read" on public.interview_questions for select to anon, authenticated using (is_published);
create policy "published practice questions read" on public.practice_questions for select to anon, authenticated using (is_published);
create policy "practice attempt owner all" on public.practice_attempts for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "published roadmaps read" on public.career_roadmaps for select to anon, authenticated using (is_published);
create policy "published roadmap skills read" on public.roadmap_skills for select to anon, authenticated using (exists(select 1 from public.career_roadmaps r where r.id=roadmap_id and r.is_published));
create policy "recommendation owner all" on public.recommendations for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "usage counter owner read" on public.usage_counters for select to authenticated using ((select auth.uid()) = user_id);
create policy "usage event owner read" on public.usage_events for select to authenticated using ((select auth.uid()) = user_id);
create policy "plans read" on public.plans for select to anon, authenticated using (is_active);
create policy "subscription owner read" on public.subscriptions for select to authenticated using ((select auth.uid()) = user_id);
create policy "payment owner read" on public.payments for select to authenticated using ((select auth.uid()) = user_id);
create policy "credit balance owner read" on public.credit_balances for select to authenticated using ((select auth.uid()) = user_id);
-- payment_webhooks deliberately has no browser-facing policies.

revoke all on all tables in schema public from anon, authenticated;
grant select on public.courses, public.course_skills, public.interview_questions, public.practice_questions, public.career_roadmaps, public.roadmap_skills, public.plans to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.resumes, public.resume_analyses, public.course_bookmarks, public.learning_progress, public.practice_attempts, public.recommendations to authenticated;
grant select on public.usage_counters, public.usage_events, public.subscriptions, public.payments, public.credit_balances to authenticated;
revoke all on public.payment_webhooks from anon, authenticated;

-- Atomic quota procedures are defined in the following migration.
