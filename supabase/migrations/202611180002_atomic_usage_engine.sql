-- Usage RPCs run elevated only inside a private schema; the public invoker wrappers expose only their constrained operations.
create or replace function private.reserve_usage_internal(p_feature text,p_request_key uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid(); v_day date := (now() at time zone 'Asia/Kolkata')::date;
  v_month date := date_trunc('month', (now() at time zone 'Asia/Kolkata'))::date;
  v_plan jsonb; v_feature jsonb; v_daily integer; v_monthly integer; v_old record; v_existing public.usage_events%rowtype; v_event_id uuid;
  v_day_used integer; v_month_used integer;
begin
  if v_uid is null then return jsonb_build_object('allowed',false,'reason','unauthenticated'); end if;
  if p_feature is null or length(p_feature) not between 1 and 80 or p_request_key is null then return jsonb_build_object('allowed',false,'reason','invalid_request'); end if;
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text || ':' || p_feature, 0));
  select e.* into v_existing from public.usage_events e where e.user_id=v_uid and e.feature=p_feature and e.request_key=p_request_key;
  if found then return jsonb_build_object('allowed',false,'reason',case when v_existing.status='reserved' then 'in_progress' when v_existing.status='consumed' then 'already_consumed' else 'request_finalized' end,'event_id',v_existing.id,'status',v_existing.status); end if;
  for v_old in select e.id,e.day_start,e.month_start from public.usage_events e where e.user_id=v_uid and e.feature=p_feature and e.status='reserved' and e.created_at < now()-interval '15 minutes' for update loop
    update public.usage_events set status='expired',finalized_at=now(),failure_code='reservation_expired' where id=v_old.id;
    update public.usage_counters set reserved_count=greatest(0,reserved_count-1),updated_at=now() where user_id=v_uid and feature=p_feature and period_type='day' and period_start=v_old.day_start;
    update public.usage_counters set reserved_count=greatest(0,reserved_count-1),updated_at=now() where user_id=v_uid and feature=p_feature and period_type='month' and period_start=v_old.month_start;
  end loop;
  select p.usage_limits into v_plan from public.plans p where p.slug='free' and p.is_active;
  select p.usage_limits into v_plan from public.subscriptions s join public.plans p on p.id=s.plan_id where s.user_id=v_uid and s.status in ('active','trialing') and (s.current_period_end is null or s.current_period_end>now()) and p.is_active order by s.current_period_end desc nulls last limit 1;
  if v_plan is null then select p.usage_limits into v_plan from public.plans p where p.slug='free' and p.is_active; end if;
  v_feature := v_plan -> p_feature;
  if v_feature is null then return jsonb_build_object('allowed',false,'reason','feature_not_configured'); end if;
  if v_feature->>'daily' is not null then v_daily := nullif(v_feature->>'daily','unlimited')::integer; end if;
  if v_feature->>'monthly' is not null then v_monthly := nullif(v_feature->>'monthly','unlimited')::integer; end if;
  insert into public.usage_counters(user_id,feature,period_type,period_start) values(v_uid,p_feature,'day',v_day),(v_uid,p_feature,'month',v_month) on conflict(user_id,feature,period_type,period_start) do nothing;
  select consumed_count+reserved_count into v_day_used from public.usage_counters where user_id=v_uid and feature=p_feature and period_type='day' and period_start=v_day for update;
  select consumed_count+reserved_count into v_month_used from public.usage_counters where user_id=v_uid and feature=p_feature and period_type='month' and period_start=v_month for update;
  if v_daily is not null and v_day_used>=v_daily then return jsonb_build_object('allowed',false,'reason','daily_limit','limit',v_daily); end if;
  if v_monthly is not null and v_month_used>=v_monthly then return jsonb_build_object('allowed',false,'reason','monthly_limit','limit',v_monthly); end if;
  insert into public.usage_events(user_id,feature,request_key,status,day_start,month_start) values(v_uid,p_feature,p_request_key,'reserved',v_day,v_month) returning id into v_event_id;
  update public.usage_counters set reserved_count=reserved_count+1,updated_at=now() where user_id=v_uid and feature=p_feature and ((period_type='day' and period_start=v_day) or (period_type='month' and period_start=v_month));
  return jsonb_build_object('allowed',true,'event_id',v_event_id,'status','reserved','daily_remaining',case when v_daily is null then null else greatest(0,v_daily-v_day_used-1) end,'monthly_remaining',case when v_monthly is null then null else greatest(0,v_monthly-v_month_used-1) end);
end;
$$;
create or replace function private.finalize_usage_internal(p_event_id uuid,p_succeeded boolean,p_failure_code text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid:=auth.uid(); v_event public.usage_events%rowtype; v_status text;
begin
  if v_uid is null then return jsonb_build_object('ok',false,'reason','unauthenticated'); end if;
  select * into v_event from public.usage_events where id=p_event_id and user_id=v_uid for update;
  if not found then return jsonb_build_object('ok',false,'reason','not_found'); end if;
  if v_event.status='consumed' then return jsonb_build_object('ok',true,'status','consumed','duplicate',true); end if;
  if v_event.status<>'reserved' then return jsonb_build_object('ok',false,'reason','already_finalized','status',v_event.status); end if;
  v_status:=case when p_succeeded then 'consumed' else 'failed' end;
  update public.usage_events set status=v_status,failure_code=case when p_succeeded then null else left(coalesce(p_failure_code,'operation_failed'),80) end,finalized_at=now(),updated_at=now() where id=p_event_id;
  update public.usage_counters set reserved_count=greatest(0,reserved_count-1),consumed_count=consumed_count+case when p_succeeded then 1 else 0 end,updated_at=now() where user_id=v_uid and feature=v_event.feature and ((period_type='day' and period_start=v_event.day_start) or (period_type='month' and period_start=v_event.month_start));
  return jsonb_build_object('ok',true,'status',v_status);
end;
$$;
revoke all on function private.reserve_usage_internal(text,uuid),private.finalize_usage_internal(uuid,boolean,text) from public,anon;
grant execute on function private.reserve_usage_internal(text,uuid),private.finalize_usage_internal(uuid,boolean,text) to authenticated;
create or replace function public.reserve_usage(p_feature text,p_request_key uuid)
returns jsonb language sql security invoker set search_path = '' as $$ select private.reserve_usage_internal(p_feature,p_request_key); $$;
create or replace function public.finalize_usage(p_event_id uuid,p_succeeded boolean,p_failure_code text default null)
returns jsonb language sql security invoker set search_path = '' as $$ select private.finalize_usage_internal(p_event_id,p_succeeded,p_failure_code); $$;
revoke all on function public.reserve_usage(text,uuid),public.finalize_usage(uuid,boolean,text) from public,anon;
grant execute on function public.reserve_usage(text,uuid),public.finalize_usage(uuid,boolean,text) to authenticated;
