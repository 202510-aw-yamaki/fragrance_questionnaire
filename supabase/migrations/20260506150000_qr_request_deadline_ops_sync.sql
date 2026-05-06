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
  if public.current_portal_role() <> 'staff' then
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
  if public.current_portal_role() <> 'staff' then
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
  if public.current_portal_role() <> 'staff' then
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

    update public.notification_events
    set status = 'handled', handled_at = p_now, updated_at = p_now
    where related_table = 'qr_product_requests'
      and related_id = v_row.id
      and target_role = 'staff'
      and status = 'open';

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
    set status = 'expired', updated_at = p_now
    where qpr.status in ('available_email_sent', 'reminder_email_sent')
      and qpr.expires_at is not null
      and qpr.expires_at < p_now
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
      'qr_request_expired',
      'qr_request_expired_v1',
      v_row.requester_email,
      'qr_product_requests',
      v_row.id,
      'queued',
      '香水作成依頼の受付期限について',
      jsonb_build_object('request_code', v_row.request_code, 'expires_at', v_row.expires_at),
      v_row.email_retention_until
    );

    request_id := v_row.id;
    next_status := 'expired';
    event_key := 'expired';
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
      and (qpr.expires_at is null or qpr.expires_at >= p_now)
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

grant execute on function public.mark_qr_request_available(uuid) to authenticated;
grant execute on function public.mark_qr_request_unavailable(uuid, text) to authenticated;
grant execute on function public.mark_qr_request_shipped(uuid) to authenticated;
grant execute on function public.process_qr_request_deadlines(timestamptz) to authenticated;
