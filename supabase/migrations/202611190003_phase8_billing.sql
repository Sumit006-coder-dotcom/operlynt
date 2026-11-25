-- Phase 8 billing catalog and server-verified subscription lifecycle.
alter table public.plans add column if not exists amount_minor bigint not null default 0 check (amount_minor >= 0);
alter table public.plans add column if not exists currency text not null default 'INR';
alter table public.plans add column if not exists billing_period text check (billing_period in ('monthly','yearly'));
alter table public.plans add column if not exists interval_count integer not null default 1 check (interval_count > 0);
alter table public.plans add column if not exists features jsonb not null default '[]'::jsonb;
alter table public.plans add column if not exists razorpay_plan_id text;
alter table public.plans add column if not exists sort_order integer not null default 0;

update public.plans set usage_limits='{"resume_builder_export":{"daily":2,"monthly":5},"resume_analyzer":{"daily":2,"monthly":5},"interview_question":{"daily":20,"monthly":100},"aptitude_test":{"daily":2,"monthly":10},"coding_sql_question":{"daily":10,"monthly":50},"ai_request":{"daily":2,"monthly":10}}',amount_minor=0,billing_period=null,sort_order=0 where slug='free';
update public.plans set slug='pro_monthly',name='Pro Monthly',amount_minor=19900,currency='INR',billing_period='monthly',interval_count=1,sort_order=1,
 usage_limits='{"resume_builder_export":{"daily":20,"monthly":300},"resume_analyzer":{"daily":10,"monthly":100},"interview_question":{"daily":100,"monthly":1500},"aptitude_test":{"daily":10,"monthly":100},"coding_sql_question":{"daily":100,"monthly":1500},"ai_request":{"daily":20,"monthly":300}}'
 where slug='premium';
insert into public.plans(slug,name,amount_minor,currency,billing_period,interval_count,sort_order,features,usage_limits) values
 ('pro_annual','Pro Annual',149900,'INR','yearly',1,2,'["Everything in Pro Monthly","Additional AI assisted requests","Advanced personalized recommendations"]',
 '{"resume_builder_export":{"daily":20,"monthly":300},"resume_analyzer":{"daily":10,"monthly":100},"interview_question":{"daily":100,"monthly":1500},"aptitude_test":{"daily":10,"monthly":100},"coding_sql_question":{"daily":100,"monthly":1500},"ai_request":{"daily":20,"monthly":300}}')
on conflict(slug) do update set name=excluded.name,amount_minor=excluded.amount_minor,currency=excluded.currency,billing_period=excluded.billing_period,interval_count=excluded.interval_count,sort_order=excluded.sort_order,features=excluded.features,usage_limits=excluded.usage_limits,updated_at=now();
update public.plans set features='["Basic resume tools and analysis","Course discovery and roadmaps","Limited interview and practice sessions","Contextual recommendations"]' where slug='free';
update public.plans set features='["Higher resume export and analysis limits","Premium resume templates","More interviews, aptitude and coding practice","Detailed learning analytics and recommendations"]' where slug='pro_monthly';

alter table public.subscriptions drop constraint if exists subscriptions_status_check;
alter table public.subscriptions add constraint subscriptions_status_check check(status in ('trialing','created','authenticated','active','pending','past_due','halted','canceled','cancelled','completed','expired'));
alter table public.subscriptions add column if not exists provider text;
alter table public.subscriptions add column if not exists provider_subscription_id text;
alter table public.subscriptions add column if not exists cancel_at_period_end boolean not null default false;
alter table public.subscriptions add column if not exists request_key uuid;
alter table public.subscriptions add column if not exists checkout_url text;
create unique index if not exists subscriptions_provider_id_unique on public.subscriptions(provider,provider_subscription_id) where provider_subscription_id is not null;
create unique index if not exists subscriptions_request_unique on public.subscriptions(user_id,request_key) where request_key is not null;
alter table public.payments add column if not exists provider_order_id text;
alter table public.payments add column if not exists receipt text;
alter table public.payments add column if not exists invoice_url text;
alter table public.payments add column if not exists refunded_amount_minor bigint not null default 0 check(refunded_amount_minor >= 0);
alter table public.payments add column if not exists metadata jsonb not null default '{}'::jsonb;
create unique index if not exists payments_order_unique on public.payments(provider,provider_order_id) where provider_order_id is not null;
alter table public.payment_webhooks add column if not exists signature_verified boolean not null default false;
alter table public.payment_webhooks add column if not exists processing_status text not null default 'pending' check(processing_status in ('pending','processed','failed'));
alter table public.payment_webhooks add column if not exists attempts integer not null default 0;
alter table public.payment_webhooks add column if not exists last_error text;

create table if not exists public.billing_checkout_requests (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 request_key uuid not null, plan_id uuid not null references public.plans(id), subscription_id uuid references public.subscriptions(id),
 status text not null default 'creating' check(status in ('creating','ready','failed')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,request_key)
);
alter table public.billing_checkout_requests enable row level security;
revoke all on public.billing_checkout_requests from anon,authenticated;

create or replace function public.process_razorpay_webhook(p_event_id text,p_event_type text,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_new integer; v_entity jsonb; v_sub_id text; v_payment_id text; v_sub public.subscriptions%rowtype; v_payment jsonb; v_amount bigint; v_currency text; v_status text;
begin
 insert into public.payment_webhooks(provider,provider_event_id,event_type,payload,signature_verified,processing_status,attempts)
 values('razorpay',p_event_id,p_event_type,p_payload,true,'pending',1) on conflict(provider,provider_event_id) do nothing;
 get diagnostics v_new = row_count;
 if v_new=0 then return jsonb_build_object('ok',true,'duplicate',true); end if;
 v_entity:=coalesce(p_payload#>'{payload,subscription,entity}',p_payload#>'{payload,payment,entity}',p_payload#>'{payload,refund,entity}',p_payload#>'{payload,invoice,entity}','{}'::jsonb);
 if p_event_type like 'subscription.%' then v_sub_id:=coalesce(p_payload#>>'{payload,subscription,entity,id}',p_payload#>>'{payload,payment,entity,subscription_id}');
 else v_sub_id:=p_payload#>>'{payload,payment,entity,subscription_id}'; end if;
 v_payment_id:=coalesce(p_payload#>>'{payload,payment,entity,id}',p_payload#>>'{payload,refund,entity,payment_id}');
 if v_sub_id is null and v_payment_id is not null then select s.provider_subscription_id into v_sub_id from public.payments p join public.subscriptions s on s.id=p.subscription_id where p.provider='razorpay' and p.provider_payment_id=v_payment_id limit 1; end if;
 if v_sub_id is not null then select * into v_sub from public.subscriptions where provider='razorpay' and provider_subscription_id=v_sub_id for update; end if;
 if p_event_type in ('subscription.activated','subscription.authenticated','subscription.pending','subscription.halted','subscription.cancelled','subscription.completed','subscription.paused','subscription.resumed','subscription.charged','payment.captured') and v_sub.id is not null then
   if p_event_type='subscription.activated' and v_entity->>'plan_id' is distinct from (select p.razorpay_plan_id from public.plans p where p.id=v_sub.plan_id) then raise exception 'Razorpay plan id does not match configured plan'; end if;
   v_status:=case p_event_type when 'subscription.activated' then 'authenticated' when 'subscription.authenticated' then 'authenticated' when 'subscription.pending' then 'pending' when 'subscription.halted' then 'halted' when 'subscription.cancelled' then 'canceled' when 'subscription.completed' then 'completed' when 'subscription.paused' then 'pending' when 'subscription.resumed' then 'active' when 'subscription.charged' then 'active' when 'payment.captured' then 'active' end;
   if p_event_type in ('subscription.charged','payment.captured') and coalesce(nullif(p_payload#>>'{payload,payment,entity,amount}','')::bigint,0)<>(select p.amount_minor from public.plans p where p.id=v_sub.plan_id) then raise exception 'Razorpay payment amount does not match configured plan'; end if;
   if p_event_type in ('subscription.charged','payment.captured') and coalesce(p_payload#>>'{payload,payment,entity,currency}','')<>(select p.currency from public.plans p where p.id=v_sub.plan_id) then raise exception 'Razorpay payment currency does not match configured plan'; end if;
   update public.subscriptions set status=v_status,current_period_start=case when nullif(p_payload#>>'{payload,subscription,entity,current_start}','') is not null then to_timestamp((p_payload#>>'{payload,subscription,entity,current_start}')::bigint) else current_period_start end,
     current_period_end=case when nullif(p_payload#>>'{payload,subscription,entity,current_end}','') is not null then to_timestamp((p_payload#>>'{payload,subscription,entity,current_end}')::bigint) else current_period_end end,
     cancel_at_period_end=coalesce((v_entity->>'cancel_at_cycle_end')::boolean,cancel_at_period_end),updated_at=now() where id=v_sub.id;
 end if;
 if p_event_type in ('subscription.charged','payment.authorized','payment.captured','payment.failed','refund.created','refund.processed') and v_payment_id is not null and v_sub.id is not null then
   v_payment:=p_payload#>'{payload,payment,entity}';
   v_amount:=coalesce(nullif(v_payment->>'amount','')::bigint,nullif(p_payload#>>'{payload,refund,entity,amount}','')::bigint,0);
   v_currency:=coalesce(v_payment->>'currency','INR');
   v_status:=case when p_event_type='refund.created' then 'refund_pending' when p_event_type='refund.processed' then 'refunded' when p_event_type='payment.failed' then 'failed' when p_event_type='payment.authorized' then 'authorized' else 'paid' end;
   insert into public.payments(user_id,subscription_id,provider,provider_payment_id,amount_minor,currency,status,invoice_url,metadata,refunded_amount_minor)
   values(v_sub.user_id,v_sub.id,'razorpay',v_payment_id,v_amount,v_currency,v_status,p_payload#>>'{payload,invoice,entity,short_url}',jsonb_build_object('event_type',p_event_type),case when p_event_type like 'refund.%' then v_amount else 0 end)
   on conflict(provider,provider_payment_id) do update set status=case when public.payments.status='refunded' then 'refunded' when public.payments.status='paid' and excluded.status='failed' then 'paid' else excluded.status end,refunded_amount_minor=greatest(public.payments.refunded_amount_minor,excluded.refunded_amount_minor),invoice_url=coalesce(excluded.invoice_url,public.payments.invoice_url),updated_at=now();
   if p_event_type='refund.processed' and v_sub.id is not null then update public.subscriptions set status='past_due',current_period_end=now(),updated_at=now() where id=v_sub.id; end if;
 end if;
 update public.payment_webhooks set processing_status='processed',processed_at=now(),updated_at=now() where provider='razorpay' and provider_event_id=p_event_id;
 return jsonb_build_object('ok',true,'duplicate',false);
exception when others then
 update public.payment_webhooks set processing_status='failed',last_error=left(sqlerrm,500),attempts=attempts+1,updated_at=now() where provider='razorpay' and provider_event_id=p_event_id;
 raise;
end; $$;
revoke all on function public.process_razorpay_webhook(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.process_razorpay_webhook(text,text,jsonb) to service_role;
