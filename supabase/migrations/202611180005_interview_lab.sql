-- Operlynt Phase 5: curated interview questions and private practice history.
alter table public.interview_questions add column role text not null default 'Data Analyst';
alter table public.interview_questions add column topic text not null default 'General';
alter table public.interview_questions add column question_type text not null default 'Technical';
alter table public.interview_questions add column sample_answer text not null default '';
alter table public.interview_questions add column concept_explanation text not null default '';
alter table public.interview_questions add column tags text[] not null default '{}';
alter table public.interview_questions add column evaluation_rubric jsonb not null default '{"accuracy":"Correctness and depth","structure":"Logical sequence","clarity":"Clear explanation","evidence":"Specific example or reasoning"}'::jsonb;
alter table public.interview_questions add constraint interview_question_role_check check(role in ('Data Analyst','Data Scientist','Python Developer','SQL Developer','AI/ML Engineer','Web Developer','Software Developer','Business Analyst'));
alter table public.interview_questions add constraint interview_question_type_check check(question_type in ('Technical','HR','Scenario-based','Project-based','Conceptual','Coding-related'));
create index interview_questions_role_filter_idx on public.interview_questions(is_published,role,topic,difficulty,question_type);
drop policy "published interview questions read" on public.interview_questions;
create policy "published interview questions read" on public.interview_questions for select to anon,authenticated using (is_published);

create table public.interview_question_bookmarks (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 question_id uuid not null references public.interview_questions(id) on delete cascade,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,question_id)
);
create table public.interview_question_progress (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 question_id uuid not null references public.interview_questions(id) on delete cascade,
 is_completed boolean not null default false, latest_attempt_at timestamptz, completed_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,question_id)
);
create table public.interview_sessions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check(role in ('Data Analyst','Data Scientist','Python Developer','SQL Developer','AI/ML Engineer','Web Developer','Software Developer','Business Analyst')),
 session_type text not null check(session_type in ('timed','mock')), duration_minutes smallint not null check(duration_minutes between 5 and 60),
 question_ids uuid[] not null default '{}', status text not null default 'active' check(status in ('active','completed','expired','cancelled')),
 started_at timestamptz not null default now(), expires_at timestamptz not null, finished_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,id)
);
create unique index interview_one_active_session_idx on public.interview_sessions(user_id) where status='active';
create table public.interview_attempts (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 question_id uuid not null references public.interview_questions(id) on delete cascade,
 session_id uuid references public.interview_sessions(id) on delete set null,
 request_key uuid not null, answer_text text not null, reflection text not null default '',
 rubric_scores jsonb not null, overall_rating numeric(2,1) not null check(overall_rating between 1 and 5),
 created_at timestamptz not null default now(), unique(user_id,request_key)
);
create index interview_bookmarks_user_idx on public.interview_question_bookmarks(user_id,created_at desc);
create index interview_progress_user_idx on public.interview_question_progress(user_id,is_completed,updated_at desc);
create index interview_attempts_user_idx on public.interview_attempts(user_id,created_at desc);
create index interview_sessions_user_idx on public.interview_sessions(user_id,status,created_at desc);

alter table public.interview_question_bookmarks enable row level security;
alter table public.interview_question_progress enable row level security;
alter table public.interview_sessions enable row level security;
alter table public.interview_attempts enable row level security;
create trigger interview_question_bookmarks_updated_at before update on public.interview_question_bookmarks for each row execute function private.set_updated_at();
create trigger interview_question_progress_updated_at before update on public.interview_question_progress for each row execute function private.set_updated_at();
create trigger interview_sessions_updated_at before update on public.interview_sessions for each row execute function private.set_updated_at();
create policy "interview bookmark owner" on public.interview_question_bookmarks for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "interview progress owner read" on public.interview_question_progress for select to authenticated using ((select auth.uid())=user_id);
create policy "interview session owner all" on public.interview_sessions for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "interview attempt owner read" on public.interview_attempts for select to authenticated using ((select auth.uid())=user_id);
revoke all on public.interview_question_bookmarks,public.interview_question_progress,public.interview_sessions,public.interview_attempts from anon,authenticated;
grant select,insert,delete on public.interview_question_bookmarks to authenticated;
grant select on public.interview_question_progress,public.interview_attempts to authenticated;
grant select,insert,update on public.interview_sessions to authenticated;

-- Analysis, completion state, and quota consumption commit or roll back together.
create or replace function private.commit_interview_attempt_internal(p_question_id uuid,p_session_id uuid,p_request_key uuid,p_answer_text text,p_reflection text,p_scores jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid:=auth.uid();v_session public.interview_sessions%rowtype;v_reservation jsonb;v_event_id uuid;v_attempt_id uuid;v_finish jsonb;v_rating numeric(2,1);
begin
 if v_uid is null then return jsonb_build_object('ok',false,'reason','unauthenticated');end if;
 if p_request_key is null or p_question_id is null or p_answer_text is null or pg_catalog.length(pg_catalog.btrim(p_answer_text)) not between 20 and 8000 or pg_catalog.length(coalesce(p_reflection,''))>2000 then return jsonb_build_object('ok',false,'reason','invalid_attempt');end if;
 if p_scores is null or pg_catalog.jsonb_typeof(p_scores)<>'object' then return jsonb_build_object('ok',false,'reason','invalid_scores');end if;
 if exists(select 1 from (values('accuracy'),('structure'),('clarity'),('evidence')) as expected(k) where pg_catalog.jsonb_typeof(p_scores->k) is distinct from 'number' or (p_scores->>k) !~ '^[1-5]$') then return jsonb_build_object('ok',false,'reason','invalid_scores');end if;
 if not exists(select 1 from public.interview_questions q where q.id=p_question_id and q.is_published) then return jsonb_build_object('ok',false,'reason','question_unavailable');end if;
 if p_session_id is not null then
   select * into v_session from public.interview_sessions s where s.id=p_session_id and s.user_id=v_uid for update;
   if not found or v_session.status<>'active' or v_session.expires_at<=now() or not (p_question_id=any(v_session.question_ids)) then return jsonb_build_object('ok',false,'reason','session_unavailable');end if;
 end if;
 v_rating:=round(((p_scores->>'accuracy')::numeric+(p_scores->>'structure')::numeric+(p_scores->>'clarity')::numeric+(p_scores->>'evidence')::numeric)/4,1);
 v_reservation:=private.reserve_usage_internal('interview_question',p_request_key);
 if coalesce((v_reservation->>'allowed')::boolean,false)=false then return v_reservation;end if;
 v_event_id:=(v_reservation->>'event_id')::uuid;
 insert into public.interview_attempts(user_id,question_id,session_id,request_key,answer_text,reflection,rubric_scores,overall_rating)
 values(v_uid,p_question_id,p_session_id,p_request_key,p_answer_text,p_reflection,pg_catalog.jsonb_build_object('accuracy',(p_scores->>'accuracy')::integer,'structure',(p_scores->>'structure')::integer,'clarity',(p_scores->>'clarity')::integer,'evidence',(p_scores->>'evidence')::integer),v_rating) returning id into v_attempt_id;
 insert into public.interview_question_progress(user_id,question_id,is_completed,latest_attempt_at,completed_at)
 values(v_uid,p_question_id,true,now(),now()) on conflict(user_id,question_id) do update set is_completed=true,latest_attempt_at=excluded.latest_attempt_at,completed_at=coalesce(public.interview_question_progress.completed_at,excluded.completed_at),updated_at=now();
 v_finish:=private.finalize_usage_internal(v_event_id,true,null);
 if coalesce((v_finish->>'ok')::boolean,false)=false then raise exception 'Could not finalize interview usage';end if;
 return pg_catalog.jsonb_build_object('ok',true,'attempt_id',v_attempt_id,'rating',v_rating,'daily_remaining',v_reservation->'daily_remaining','monthly_remaining',v_reservation->'monthly_remaining');
end;
$$;
revoke all on function private.commit_interview_attempt_internal(uuid,uuid,uuid,text,text,jsonb) from public,anon;
grant execute on function private.commit_interview_attempt_internal(uuid,uuid,uuid,text,text,jsonb) to authenticated;
create or replace function public.commit_interview_attempt(p_question_id uuid,p_session_id uuid,p_request_key uuid,p_answer_text text,p_reflection text,p_scores jsonb)
returns jsonb language sql security invoker set search_path = '' as $$ select private.commit_interview_attempt_internal(p_question_id,p_session_id,p_request_key,p_answer_text,p_reflection,p_scores); $$;
revoke all on function public.commit_interview_attempt(uuid,uuid,uuid,text,text,jsonb) from public,anon;
grant execute on function public.commit_interview_attempt(uuid,uuid,uuid,text,text,jsonb) to authenticated;
revoke insert,update,delete on public.interview_question_progress,public.interview_attempts from authenticated;
