-- Operlynt Phase 3: analyzer and generated recommendation ownership.
alter table public.recommendations add column source_resume_id uuid;
alter table public.recommendations add column recommendation_key text not null default '';
alter table public.recommendations add column details jsonb not null default '{}'::jsonb;
alter table public.recommendations add constraint recommendations_resume_owner_fk foreign key(user_id,source_resume_id) references public.resumes(user_id,id) on delete cascade;
create unique index recommendations_resume_key_unique on public.recommendations(user_id,source_resume_id,recommendation_key) where source_resume_id is not null;
create index resume_analyses_user_resume_idx on public.resume_analyses(user_id,resume_id,created_at desc);

-- Replace role guidance atomically for the caller's own resume. No caller-supplied user ID is accepted.
create or replace function private.replace_resume_recommendations_internal(p_resume_id uuid,p_recommendations jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid:=auth.uid(); v_rec record; v_count integer;
begin
  if v_uid is null or not exists(select 1 from public.resumes r where r.id=p_resume_id and r.user_id=v_uid) then
    return jsonb_build_object('ok',false,'reason','resume_not_found');
  end if;
  if p_recommendations is null or pg_catalog.jsonb_typeof(p_recommendations)<>'array' or pg_catalog.jsonb_array_length(p_recommendations)>12 then
    return jsonb_build_object('ok',false,'reason','invalid_recommendations');
  end if;
  for v_rec in select * from pg_catalog.jsonb_to_recordset(p_recommendations) as x(recommendation_key text,entity_type text,title text,description text,href text,reason text) loop
    if v_rec.recommendation_key is null or length(v_rec.recommendation_key) not between 1 and 100
      or v_rec.entity_type is null or v_rec.entity_type not in ('course_topic','interview_track','practice_track','roadmap')
      or v_rec.title is null or length(v_rec.title) not between 1 and 160
      or v_rec.description is null or length(v_rec.description)>1000
      or v_rec.reason is null or length(v_rec.reason)>300
      or v_rec.href is null or left(v_rec.href,1)<>'/' or left(v_rec.href,2)='//' then
      return jsonb_build_object('ok',false,'reason','invalid_recommendation');
    end if;
  end loop;

  delete from public.recommendations where user_id=v_uid and source_resume_id=p_resume_id;
  insert into public.recommendations(user_id,entity_type,reason,source_resume_id,recommendation_key,details)
  select v_uid,x.entity_type,x.reason,p_resume_id,x.recommendation_key,
    pg_catalog.jsonb_build_object('title',x.title,'description',x.description,'href',x.href)
  from pg_catalog.jsonb_to_recordset(p_recommendations) as x(recommendation_key text,entity_type text,title text,description text,href text,reason text);
  get diagnostics v_count=row_count;
  return jsonb_build_object('ok',true,'count',v_count);
end;
$$;
revoke all on function private.replace_resume_recommendations_internal(uuid,jsonb) from public,anon;
grant execute on function private.replace_resume_recommendations_internal(uuid,jsonb) to authenticated;
create or replace function public.replace_resume_recommendations(p_resume_id uuid,p_recommendations jsonb)
returns jsonb language sql security invoker set search_path = '' as $$ select private.replace_resume_recommendations_internal(p_resume_id,p_recommendations); $$;
revoke all on function public.replace_resume_recommendations(uuid,jsonb) from public,anon;
grant execute on function public.replace_resume_recommendations(uuid,jsonb) to authenticated;
-- Analysis persistence and quota consumption commit or roll back together. No user_id is accepted from the caller.
create or replace function private.commit_resume_analysis_internal(p_resume_id uuid,p_request_key uuid,p_result jsonb,p_recommendations jsonb,p_input_hash text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid:=auth.uid(); v_reservation jsonb; v_event_id uuid; v_analysis_id uuid; v_rec record; v_finish jsonb;
begin
  if v_uid is null then return jsonb_build_object('ok',false,'reason','unauthenticated'); end if;
  if p_result is null or pg_catalog.jsonb_typeof(p_result)<>'object' or pg_catalog.pg_column_size(p_result)>30000 then
    return jsonb_build_object('ok',false,'reason','invalid_analysis');
  end if;
  if p_recommendations is null or pg_catalog.jsonb_typeof(p_recommendations)<>'array' or pg_catalog.jsonb_array_length(p_recommendations)>12 then
    return jsonb_build_object('ok',false,'reason','invalid_recommendations');
  end if;
  if not exists(select 1 from public.resumes r where r.id=p_resume_id and r.user_id=v_uid) then
    return jsonb_build_object('ok',false,'reason','resume_not_found');
  end if;
  for v_rec in select * from pg_catalog.jsonb_to_recordset(p_recommendations) as x(recommendation_key text,entity_type text,title text,description text,href text,reason text) loop
    if v_rec.recommendation_key is null or length(v_rec.recommendation_key) not between 1 and 100
      or v_rec.entity_type not in ('course_topic','interview_track','practice_track','roadmap')
      or v_rec.title is null or length(v_rec.title) not between 1 and 160
      or v_rec.description is null or length(v_rec.description)>1000
      or v_rec.reason is null or length(v_rec.reason)>300
      or v_rec.href is null or left(v_rec.href,1)<>'/' or left(v_rec.href,2)='//' then
      return jsonb_build_object('ok',false,'reason','invalid_recommendation');
    end if;
  end loop;
  v_reservation:=private.reserve_usage_internal('resume_analyzer',p_request_key);
  if coalesce((v_reservation->>'allowed')::boolean,false)=false then return v_reservation; end if;
  v_event_id:=(v_reservation->>'event_id')::uuid;
  insert into public.resume_analyses(user_id,resume_id,input_hash,result)
    values(v_uid,p_resume_id,left(coalesce(p_input_hash,''),128),p_result) returning id into v_analysis_id;

  perform private.replace_resume_recommendations_internal(p_resume_id,p_recommendations);

  v_finish:=private.finalize_usage_internal(v_event_id,true,null);
  if coalesce((v_finish->>'ok')::boolean,false)=false then raise exception 'Could not finalize analyzer usage'; end if;
  return jsonb_build_object('ok',true,'analysis_id',v_analysis_id,'usage',v_finish);
end;
$$;
revoke all on function private.commit_resume_analysis_internal(uuid,uuid,jsonb,jsonb,text) from public,anon;
grant execute on function private.commit_resume_analysis_internal(uuid,uuid,jsonb,jsonb,text) to authenticated;
create or replace function public.commit_resume_analysis(p_resume_id uuid,p_request_key uuid,p_result jsonb,p_recommendations jsonb,p_input_hash text default null)
returns jsonb language sql security invoker set search_path = '' as $$ select private.commit_resume_analysis_internal(p_resume_id,p_request_key,p_result,p_recommendations,p_input_hash); $$;
revoke all on function public.commit_resume_analysis(uuid,uuid,jsonb,jsonb,text) from public,anon;
grant execute on function public.commit_resume_analysis(uuid,uuid,jsonb,jsonb,text) to authenticated;

-- Analysis rows may be read by their owner, but creation is only available through the quota-aware commit RPC.
revoke insert,update,delete on public.resume_analyses from authenticated;
grant select on public.resume_analyses to authenticated;
