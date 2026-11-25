update public.plans set usage_limits = usage_limits || jsonb_build_object(
  'aptitude_test', coalesce(usage_limits->'aptitude_test', '{"daily":2,"monthly":10}'::jsonb),
  'coding_sql_question', coalesce(usage_limits->'coding_sql_question', '{"daily":10,"monthly":50}'::jsonb)
);

create table if not exists private.practice_arena_answer_keys (
  question_key text primary key,
  correct_index smallint not null check (correct_index between 0 and 20)
);
revoke all on private.practice_arena_answer_keys from public,anon,authenticated;
insert into private.practice_arena_answer_keys(question_key,correct_index) values
 ('quant-percent-1',0),('quant-prob-1',1),('quant-ratio-1',1),('logic-sequence-1',2),('logic-deduction-1',2),
 ('verbal-analogy-1',1),('verbal-grammar-1',1),('di-table-1',1),('py-fund-output-1',1),('py-fund-error-1',1),
 ('py-program-loop-1',1),('logic-code-1',2),('sql-basics-select-1',0),('sql-join-1',1),('sql-join-2',1),
 ('sql-subquery-1',1),('sql-cte-1',0),('sql-window-1',0)
on conflict(question_key) do update set correct_index=excluded.correct_index;

create table if not exists public.practice_arena_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_key text not null,
  category text not null,
  topic text not null,
  difficulty text not null check (difficulty in ('beginner','intermediate','advanced')),
  selected_index smallint not null check (selected_index between 0 and 20),
  is_correct boolean not null,
  duration_seconds integer not null check (duration_seconds between 0 and 86400),
  request_key uuid not null,
  created_at timestamptz not null default now(),
  unique(user_id,request_key)
);
create index if not exists practice_arena_attempts_owner_date on public.practice_arena_attempts(user_id,created_at desc);
alter table public.practice_arena_attempts enable row level security;
drop policy if exists "practice arena attempts owner read" on public.practice_arena_attempts;
create policy "practice arena attempts owner read" on public.practice_arena_attempts for select to authenticated using ((select auth.uid())=user_id);
revoke all on public.practice_arena_attempts from anon,authenticated;
grant select on public.practice_arena_attempts to authenticated;

create or replace function public.commit_practice_arena_attempt(
 p_question_key text,p_category text,p_topic text,p_difficulty text,p_selected_index integer,
 p_duration_seconds integer,p_request_key uuid,p_feature text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid:=auth.uid(); v_old public.practice_arena_attempts%rowtype; v_res jsonb; v_final jsonb; v_id uuid; v_correct_index smallint; v_is_correct boolean;
begin
 if v_uid is null then return jsonb_build_object('ok',false,'reason','unauthenticated'); end if;
 if p_question_key is null or length(p_question_key)>100 or p_category is null or length(p_category)>80 or p_topic is null or length(p_topic)>120 or p_difficulty not in ('beginner','intermediate','advanced') or p_selected_index not between 0 and 20 or p_duration_seconds not between 0 and 86400 or p_request_key is null or p_feature not in ('aptitude_test','coding_sql_question') then return jsonb_build_object('ok',false,'reason','invalid_attempt'); end if;
 select correct_index into v_correct_index from private.practice_arena_answer_keys where question_key=p_question_key;
 if not found then return jsonb_build_object('ok',false,'reason','question_unavailable'); end if;
 v_is_correct:=p_selected_index=v_correct_index;
 perform pg_advisory_xact_lock(hashtextextended(v_uid::text || ':practice:' || p_request_key::text,0));
 select * into v_old from public.practice_arena_attempts where user_id=v_uid and request_key=p_request_key;
 if found then return jsonb_build_object('ok',true,'duplicate',true,'attempt_id',v_old.id,'is_correct',v_old.is_correct); end if;
 v_res:=private.reserve_usage_internal(p_feature,p_request_key);
 if coalesce((v_res->>'allowed')::boolean,false)=false then return v_res || jsonb_build_object('ok',false); end if;
 insert into public.practice_arena_attempts(user_id,question_key,category,topic,difficulty,selected_index,is_correct,duration_seconds,request_key)
 values(v_uid,p_question_key,p_category,p_topic,p_difficulty,p_selected_index,v_is_correct,p_duration_seconds,p_request_key) returning id into v_id;
 v_final:=private.finalize_usage_internal((v_res->>'event_id')::uuid,true,null);
 if coalesce((v_final->>'ok')::boolean,false)=false then raise exception 'Could not finalize practice quota'; end if;
 return jsonb_build_object('ok',true,'attempt_id',v_id,'is_correct',v_is_correct,'daily_remaining',v_res->'daily_remaining','monthly_remaining',v_res->'monthly_remaining');
end; $$;
revoke all on function public.commit_practice_arena_attempt(text,text,text,text,integer,integer,uuid,text) from public,anon;
grant execute on function public.commit_practice_arena_attempt(text,text,text,text,integer,integer,uuid,text) to authenticated;
