alter table public.career_roadmaps add column if not exists required_skills text[] not null default '{}';

insert into public.career_roadmaps(slug,title,summary,level,is_published,required_skills) values
('data-analyst','Data Analyst','Move from spreadsheet fundamentals to reproducible analysis, clear dashboards and decision-ready insights.','Beginner',true,array['Excel','SQL','Statistics','Data visualization','Communication']),
('data-scientist','Data Scientist','Build a path from statistics and data handling through modeling, evaluation and responsible communication.','Beginner',true,array['Python','SQL','Statistics','Machine learning','Model evaluation']),
('ai-ml-engineer','AI/ML Engineer','Connect software engineering with model training, deployment, monitoring and responsible operations.','Beginner',true,array['Python','Machine learning','Software design','APIs','Model operations']),
('python-developer','Python Developer','Progress from language fundamentals to tested applications, APIs and portfolio-ready software.','Beginner',true,array['Python','Data structures','Testing','APIs','SQL']),
('sql-developer','SQL Developer','Develop from query fundamentals through relational design, advanced queries and reliable data workflows.','Beginner',true,array['SQL','Relational databases','Joins','Query design','Testing']),
('full-stack-developer','Full Stack Developer','Learn browser interfaces, backend APIs, persistence, testing and deployment as one connected system.','Beginner',true,array['JavaScript','HTML/CSS','React','APIs','SQL','Testing']),
('software-developer','Software Developer','Build programming fluency, thoughtful software design, testing habits and a complete portfolio project.','Beginner',true,array['Programming','Data structures','Testing','APIs','SQL','Git']),
('business-analyst','Business Analyst','Connect stakeholder questions to requirements, structured analysis, useful measures and clear communication.','Beginner',true,array['Requirements','Excel','SQL','Process analysis','Communication'])
on conflict(slug) do update set title=excluded.title,summary=excluded.summary,is_published=true,required_skills=excluded.required_skills,updated_at=now();

insert into public.roadmap_skills(roadmap_id,skill,position)
select r.id,skills.skill,(skills.position-1)::integer
from public.career_roadmaps r
cross join lateral unnest(r.required_skills) with ordinality as skills(skill,position)
where r.slug in ('data-analyst','data-scientist','ai-ml-engineer','python-developer','sql-developer','full-stack-developer','software-developer','business-analyst')
on conflict(roadmap_id,skill) do update set position=excluded.position,updated_at=now();

create table if not exists public.roadmap_milestone_progress (
 user_id uuid not null references auth.users(id) on delete cascade,
 roadmap_key text not null,
 milestone_id text not null,
 completed boolean not null default true,
 completed_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,roadmap_key,milestone_id)
);
alter table public.roadmap_milestone_progress enable row level security;
create policy "roadmap progress owner all" on public.roadmap_milestone_progress for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create trigger roadmap_milestone_progress_set_updated_at before update on public.roadmap_milestone_progress for each row execute function private.set_updated_at();
revoke all on public.roadmap_milestone_progress from anon,authenticated;
grant select,insert,update,delete on public.roadmap_milestone_progress to authenticated;

create table if not exists public.recommendation_events (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 event_type text not null check(event_type in ('impression','click','dismiss','course_search','personalize')),
 recommendation_key text not null default '',
 surface text not null check(surface in ('dashboard','roadmap','courses','resume_analyzer','interview','practice')),
 signal_value text,
 created_at timestamptz not null default now()
);
create index if not exists recommendation_events_owner_recent on public.recommendation_events(user_id,created_at desc);
create index if not exists recommendation_events_search_signal on public.recommendation_events(user_id,signal_value,created_at desc) where event_type='course_search';
alter table public.recommendation_events enable row level security;
create policy "recommendation event owner read" on public.recommendation_events for select to authenticated using ((select auth.uid())=user_id);
create policy "recommendation event owner insert" on public.recommendation_events for insert to authenticated with check ((select auth.uid())=user_id);
revoke all on public.recommendation_events from anon,authenticated;
grant select,insert on public.recommendation_events to authenticated;

create table if not exists public.dismissed_recommendations (
 user_id uuid not null references auth.users(id) on delete cascade,
 recommendation_key text not null,
 dismissed_at timestamptz not null default now(),
 primary key(user_id,recommendation_key)
);
alter table public.dismissed_recommendations enable row level security;
create policy "dismissed recommendations owner all" on public.dismissed_recommendations for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
revoke all on public.dismissed_recommendations from anon,authenticated;
grant select,insert,update,delete on public.dismissed_recommendations to authenticated;
