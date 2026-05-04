insert into public.admin_settings (setting_key, setting_value, is_public)
values (
  'qr_product_public_settings',
  jsonb_build_object(
    'price_10ml', 1000,
    'price_30ml', 2860,
    'max_volume_ml', 100,
    'shop_phone', '03-1234-5678',
    'business_hours', '11:00〜19:00',
    'availability_due_business_days', 3,
    'available_reminder_after_days', 3,
    'available_expires_after_days', 7,
    'unavailable_reinvite_window_days', 14,
    'inactive_access_window_days', 7,
    'inactive_access_threshold', 10,
    'show_overdue_admin_notification', true,
    'show_qr_notification_badge', true,
    'product_tags', jsonb_build_array(
      'フローラル',
      'フレッシュ',
      'ウッディ',
      'スパイシー',
      'スウィート',
      'シトラス',
      'ハーバル',
      'パウダリー',
      'ムスク',
      'グリーン',
      'ティー',
      'アンバー'
    )
  ),
  true
)
on conflict (setting_key) do update
set
  setting_value = excluded.setting_value || coalesce(public.admin_settings.setting_value, '{}'::jsonb),
  is_public = true,
  updated_at = now();

insert into public.admin_settings (setting_key, setting_value, is_public)
values (
  'store_public_info',
  jsonb_build_object(
    'store_name', 'Fragrance Atelier',
    'store_phone', '03-1234-5678',
    'shop_phone', '03-1234-5678',
    'open_time', '10:00',
    'close_time', '19:00',
    'business_hours', '10:00〜19:00',
    'closed_days', '毎週水曜日',
    'lp_url', 'https://fragrance-atelier.jp'
  ),
  true
)
on conflict (setting_key) do update
set
  setting_value = excluded.setting_value || coalesce(public.admin_settings.setting_value, '{}'::jsonb),
  is_public = true,
  updated_at = now();

create table if not exists public.qr_access_logs (
  id uuid primary key default gen_random_uuid(),
  product_qr_code_id uuid references public.product_qr_codes(id) on delete set null,
  fragrance_product_id uuid references public.fragrance_products(id) on delete set null,
  public_token text,
  qr_code text,
  access_status text,
  is_available boolean not null default false,
  accessed_at timestamptz not null default now()
);

create index if not exists idx_qr_access_logs_qr_id_accessed_at
on public.qr_access_logs(product_qr_code_id, accessed_at desc);

create or replace function public.qr_product_public_setting_integer(p_key text, p_default integer)
returns integer
language sql
stable
set search_path = public
as $$
  select coalesce(
    (
      select greatest((setting_value ->> p_key)::integer, 1)
      from public.admin_settings
      where setting_key = 'qr_product_public_settings'
        and is_public = true
        and (setting_value ->> p_key) ~ '^[0-9]+$'
      order by updated_at desc
      limit 1
    ),
    greatest(coalesce(p_default, 1), 1)
  );
$$;

create or replace function public.qr_product_public_max_volume_ml()
returns integer
language sql
stable
set search_path = public
as $$
  select public.qr_product_public_setting_integer('max_volume_ml', 100);
$$;

create or replace function public.set_qr_product_request_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_due_business_days integer := public.qr_product_public_setting_integer('availability_due_business_days', 3);
begin
  if new.availability_due_at is null then
    new.availability_due_at := public.add_business_days(now(), v_due_business_days);
  end if;
  if new.email_retention_until is null then
    new.email_retention_until := (new.availability_due_at::date + interval '6 months')::date;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_set_qr_product_request_defaults on public.qr_product_requests;
create trigger trg_set_qr_product_request_defaults
before insert on public.qr_product_requests
for each row execute function public.set_qr_product_request_defaults();

create or replace function public.record_qr_product_access(p_token text)
returns table(
  id uuid,
  fragrance_product_id uuid,
  qr_code text,
  public_token text,
  status text,
  expires_at timestamptz,
  inactive_reason text,
  is_available boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text := btrim(coalesce(p_token, ''));
  v_id uuid;
  v_fragrance_product_id uuid;
  v_qr_code text;
  v_public_token text;
  v_status text;
  v_expires_at timestamptz;
  v_inactive_reason text;
  v_is_available boolean := false;
  v_window_days integer;
  v_threshold integer;
  v_recent_access_count integer;
begin
  if v_token = '' then
    return;
  end if;

  select
    pq.id,
    pq.fragrance_product_id,
    pq.qr_code,
    pq.public_token,
    pq.status,
    pq.expires_at,
    pq.inactive_reason
  into
    v_id,
    v_fragrance_product_id,
    v_qr_code,
    v_public_token,
    v_status,
    v_expires_at,
    v_inactive_reason
  from public.product_qr_codes pq
  where pq.is_public = true
    and (pq.public_token = v_token or pq.qr_code = v_token)
  order by pq.updated_at desc nulls last, pq.created_at desc nulls last
  limit 1;

  if v_id is null then
    return;
  end if;

  update public.product_qr_codes pq
  set
    access_count = pq.access_count + 1,
    last_accessed_at = now(),
    updated_at = now()
  where pq.id = v_id;

  v_is_available := v_status = 'active' and (v_expires_at is null or v_expires_at > now());

  insert into public.qr_access_logs (
    product_qr_code_id,
    fragrance_product_id,
    public_token,
    qr_code,
    access_status,
    is_available
  )
  values (
    v_id,
    v_fragrance_product_id,
    v_public_token,
    v_qr_code,
    v_status,
    v_is_available
  );

  if not v_is_available then
    v_window_days := public.qr_product_public_setting_integer('inactive_access_window_days', 7);
    v_threshold := public.qr_product_public_setting_integer('inactive_access_threshold', 10);

    select count(*)::integer
    into v_recent_access_count
    from public.qr_access_logs
    where product_qr_code_id = v_id
      and accessed_at >= now() - make_interval(days => v_window_days);

    if v_recent_access_count >= v_threshold and not exists (
      select 1
      from public.notification_events ne
      where ne.event_type = 'qr_inactive_access_spike'
        and ne.related_table = 'product_qr_codes'
        and ne.related_id = v_id
        and ne.status = 'open'
    ) then
      insert into public.notification_events (
        event_type,
        target_role,
        related_table,
        related_id,
        payload
      )
      values (
        'qr_inactive_access_spike',
        'manager',
        'product_qr_codes',
        v_id,
        jsonb_build_object(
          'fragrance_product_id', v_fragrance_product_id,
          'public_token', v_public_token,
          'qr_code', v_qr_code,
          'recent_access_count', v_recent_access_count,
          'window_days', v_window_days
        )
      );
    end if;
  end if;

  return query select
    v_id,
    v_fragrance_product_id,
    v_qr_code,
    v_public_token,
    v_status,
    v_expires_at,
    v_inactive_reason,
    v_is_available;
end;
$$;

create or replace function public.mark_qr_request_available(p_request_id uuid)
returns public.qr_product_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.qr_product_requests;
  v_product_name text;
  v_expire_days integer := public.qr_product_public_setting_integer('available_expires_after_days', 7);
begin
  if not public.is_staff_member() then
    raise exception 'QR request update is allowed for staff only.';
  end if;

  update public.qr_product_requests qpr
  set
    status = 'available_email_sent',
    available_email_sent_at = coalesce(qpr.available_email_sent_at, now()),
    expires_at = coalesce(qpr.expires_at, now() + make_interval(days => v_expire_days)),
    handled_by_staff_id = coalesce(qpr.handled_by_staff_id, public.current_staff_profile_id()),
    updated_at = now()
  where qpr.id = p_request_id
    and qpr.status = 'requested'
  returning *
  into v_request;

  if v_request.id is null then
    raise exception 'QR request is not found or not in requested status.';
  end if;

  select fp.product_name
  into v_product_name
  from public.fragrance_products fp
  where fp.id = v_request.fragrance_product_id;

  insert into public.email_events (
    event_type,
    template_key,
    recipient_email,
    related_table,
    related_id,
    status,
    subject,
    payload,
    retention_until
  )
  values (
    'qr_request_available',
    'qr_request_available_v1',
    v_request.requester_email,
    'qr_product_requests',
    v_request.id,
    'queued',
    '香水を作成できます',
    jsonb_build_object(
      'request_code', v_request.request_code,
      'product_name', v_product_name,
      'expires_at', v_request.expires_at
    ),
    v_request.email_retention_until
  );

  update public.notification_events
  set status = 'handled', handled_at = now(), updated_at = now()
  where related_table = 'qr_product_requests'
    and related_id = v_request.id
    and status = 'open';

  return v_request;
end;
$$;

create or replace function public.mark_qr_request_unavailable(p_request_id uuid, p_reason text default null)
returns public.qr_product_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.qr_product_requests;
  v_product_name text;
begin
  if not public.is_staff_member() then
    raise exception 'QR request update is allowed for staff only.';
  end if;

  update public.qr_product_requests qpr
  set
    status = 'unavailable',
    handled_by_staff_id = coalesce(qpr.handled_by_staff_id, public.current_staff_profile_id()),
    updated_at = now()
  where qpr.id = p_request_id
    and qpr.status in ('requested', 'available_email_sent', 'reminder_email_sent')
  returning *
  into v_request;

  if v_request.id is null then
    raise exception 'QR request is not found or cannot be marked unavailable.';
  end if;

  select fp.product_name
  into v_product_name
  from public.fragrance_products fp
  where fp.id = v_request.fragrance_product_id;

  insert into public.email_events (
    event_type,
    template_key,
    recipient_email,
    related_table,
    related_id,
    status,
    subject,
    payload,
    retention_until
  )
  values (
    'qr_request_unavailable',
    'qr_request_unavailable_v1',
    v_request.requester_email,
    'qr_product_requests',
    v_request.id,
    'queued',
    '香水の作成可否について',
    jsonb_build_object(
      'request_code', v_request.request_code,
      'product_name', v_product_name,
      'reason', p_reason
    ),
    v_request.email_retention_until
  );

  update public.notification_events
  set status = 'handled', handled_at = now(), updated_at = now()
  where related_table = 'qr_product_requests'
    and related_id = v_request.id
    and status = 'open';

  return v_request;
end;
$$;

create or replace function public.mark_qr_request_shipped(p_request_id uuid)
returns public.qr_product_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.qr_product_requests;
begin
  if not public.is_staff_member() then
    raise exception 'QR request update is allowed for staff only.';
  end if;

  update public.qr_product_requests qpr
  set
    status = 'shipped',
    shipped_at = coalesce(qpr.shipped_at, now()),
    handled_by_staff_id = coalesce(qpr.handled_by_staff_id, public.current_staff_profile_id()),
    updated_at = now()
  where qpr.id = p_request_id
    and qpr.status = 'shipping_pending'
  returning *
  into v_request;

  if v_request.id is null then
    raise exception 'QR request is not found or not in shipping pending status.';
  end if;

  update public.product_qr_codes pq
  set
    last_shipped_at = v_request.shipped_at,
    status = 'active',
    expires_at = v_request.shipped_at + interval '6 months',
    updated_at = now()
  where pq.id = v_request.product_qr_code_id;

  return v_request;
end;
$$;

create or replace function public.process_qr_request_deadlines(p_now timestamptz default now())
returns table(request_id uuid, next_status text, event_key text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reminder_days integer := public.qr_product_public_setting_integer('available_reminder_after_days', 3);
  v_row public.qr_product_requests;
begin
  if not public.is_manager() then
    raise exception 'QR deadline processing is allowed for managers only.';
  end if;

  for v_row in
    update public.qr_product_requests qpr
    set status = 'auto_unavailable_overdue', updated_at = p_now
    where qpr.status = 'requested'
      and qpr.availability_due_at is not null
      and qpr.availability_due_at < p_now
    returning *
  loop
    insert into public.email_events (
      event_type,
      template_key,
      recipient_email,
      related_table,
      related_id,
      status,
      subject,
      payload,
      retention_until
    )
    values (
      'qr_request_auto_unavailable_overdue',
      'qr_request_auto_unavailable_overdue_v1',
      v_row.requester_email,
      'qr_product_requests',
      v_row.id,
      'queued',
      '香水の作成依頼について',
      jsonb_build_object('request_code', v_row.request_code),
      v_row.email_retention_until
    );

    insert into public.notification_events (
      event_type,
      target_role,
      related_table,
      related_id,
      payload
    )
    values (
      'qr_request_overdue',
      'manager',
      'qr_product_requests',
      v_row.id,
      jsonb_build_object('request_code', v_row.request_code, 'availability_due_at', v_row.availability_due_at)
    );

    request_id := v_row.id;
    next_status := 'auto_unavailable_overdue';
    event_key := 'overdue';
    return next;
  end loop;

  for v_row in
    update public.qr_product_requests qpr
    set
      status = 'reminder_email_sent',
      reminder_email_sent_at = p_now,
      updated_at = p_now
    where qpr.status = 'available_email_sent'
      and qpr.available_email_sent_at is not null
      and qpr.available_email_sent_at + make_interval(days => v_reminder_days) <= p_now
      and qpr.reminder_email_sent_at is null
    returning *
  loop
    insert into public.email_events (
      event_type,
      template_key,
      recipient_email,
      related_table,
      related_id,
      status,
      subject,
      payload,
      retention_until
    )
    values (
      'qr_request_available_reminder',
      'qr_request_available_reminder_v1',
      v_row.requester_email,
      'qr_product_requests',
      v_row.id,
      'queued',
      '香水作成依頼の再案内',
      jsonb_build_object('request_code', v_row.request_code, 'expires_at', v_row.expires_at),
      v_row.email_retention_until
    );

    request_id := v_row.id;
    next_status := 'reminder_email_sent';
    event_key := 'reminder';
    return next;
  end loop;

  for v_row in
    update public.qr_product_requests qpr
    set status = 'expired', updated_at = p_now
    where qpr.status in ('available_email_sent', 'reminder_email_sent')
      and qpr.expires_at is not null
      and qpr.expires_at < p_now
    returning *
  loop
    request_id := v_row.id;
    next_status := 'expired';
    event_key := 'expired';
    return next;
  end loop;

  update public.product_qr_codes pq
  set
    status = 'inactive',
    inactive_reason = coalesce(pq.inactive_reason, '最後の発送完了から6か月注文がないため無効化しました。'),
    updated_at = p_now
  where pq.status = 'active'
    and pq.last_shipped_at is not null
    and pq.last_shipped_at + interval '6 months' < p_now;
end;
$$;

alter table public.qr_access_logs enable row level security;

drop policy if exists "manager qr access logs all" on public.qr_access_logs;
drop policy if exists "staff qr access logs own" on public.qr_access_logs;

create policy "manager qr access logs all"
on public.qr_access_logs for all
to authenticated
using (public.is_manager())
with check (public.is_manager());

create policy "staff qr access logs own"
on public.qr_access_logs for select
to authenticated
using (
  public.is_staff_member()
  and public.can_current_staff_access_fragrance_product(fragrance_product_id)
);

revoke all on table public.qr_access_logs from anon;
grant select on public.qr_access_logs to authenticated;
grant execute on function public.qr_product_public_setting_integer(text, integer) to anon, authenticated;
grant execute on function public.qr_product_public_max_volume_ml() to anon, authenticated;
grant execute on function public.record_qr_product_access(text) to anon, authenticated;
grant execute on function public.mark_qr_request_available(uuid) to authenticated;
grant execute on function public.mark_qr_request_unavailable(uuid, text) to authenticated;
grant execute on function public.mark_qr_request_shipped(uuid) to authenticated;
grant execute on function public.process_qr_request_deadlines(timestamptz) to authenticated;
