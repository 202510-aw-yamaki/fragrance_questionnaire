create index if not exists idx_notification_events_type_status
on public.notification_events(event_type, status, created_at desc);

create index if not exists idx_reservations_slot_active
on public.reservations(slot_id, status)
where status <> 'canceled';

create or replace function public.create_public_reservation(p_payload jsonb)
returns table(id uuid, reservation_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation_code text := coalesce(
    nullif(p_payload ->> 'reservation_code', ''),
    'FR' || to_char(now(), 'YYYYMMDD') || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
  );
  v_slot_id uuid := nullif(p_payload ->> 'slot_id', '')::uuid;
  v_slot public.reservation_slots%rowtype;
  v_reserved_count integer := 0;
  v_status text := coalesce(nullif(p_payload ->> 'status', ''), 'confirmed');
begin
  if v_slot_id is not null then
    select rs.*
    into v_slot
    from public.reservation_slots rs
    where rs.id = v_slot_id
    for update;

    if not found then
      raise exception 'slot_not_found' using errcode = 'P0001';
    end if;

    if coalesce(v_slot.is_active, false) is not true
      or coalesce(v_slot.status, '') not in ('open', 'recommended') then
      raise exception 'slot_closed' using errcode = 'P0001';
    end if;

    if (v_slot.slot_date + v_slot.slot_time) < (now() at time zone 'Asia/Tokyo') then
      raise exception 'slot_past' using errcode = 'P0001';
    end if;

    if v_status <> 'canceled' then
      select count(*)::integer
      into v_reserved_count
      from public.reservations r
      where r.slot_id = v_slot_id
        and r.status <> 'canceled';

      if v_reserved_count >= greatest(coalesce(v_slot.capacity, 1), 0) then
        raise exception 'slot_full' using errcode = 'P0001';
      end if;
    end if;
  end if;

  return query
  insert into public.reservations (
    reservation_code,
    questionnaire_result_id,
    customer_id,
    questionnaire_flow_status,
    questionnaire_sync_error,
    slot_id,
    slot_label,
    customer_name,
    customer_email,
    duration_minutes,
    visit_type,
    guest_count,
    staff_memo,
    summary_headline,
    summary_body,
    profile_key,
    axes,
    status,
    updated_at
  )
  values (
    v_reservation_code,
    nullif(p_payload ->> 'questionnaire_result_id', '')::uuid,
    case
      when public.should_link_current_customer(p_payload) then public.current_customer_profile_id()
      else null
    end,
    coalesce(nullif(p_payload ->> 'questionnaire_flow_status', ''), 'skipped'),
    p_payload ->> 'questionnaire_sync_error',
    v_slot_id,
    p_payload ->> 'slot_label',
    nullif(p_payload ->> 'customer_name', ''),
    nullif(p_payload ->> 'customer_email', ''),
    nullif(p_payload ->> 'duration_minutes', '')::integer,
    p_payload ->> 'visit_type',
    p_payload ->> 'guest_count',
    p_payload ->> 'staff_memo',
    p_payload ->> 'summary_headline',
    p_payload ->> 'summary_body',
    p_payload ->> 'profile_key',
    p_payload -> 'axes',
    v_status,
    coalesce(nullif(p_payload ->> 'updated_at', '')::timestamptz, now())
  )
  returning public.reservations.id, public.reservations.reservation_code;
end;
$$;

create or replace function public.create_reservation_created_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot public.reservation_slots%rowtype;
begin
  if new.status = 'canceled' then
    return new;
  end if;

  if new.slot_id is not null then
    select rs.*
    into v_slot
    from public.reservation_slots rs
    where rs.id = new.slot_id;
  end if;

  insert into public.notification_events (
    event_type,
    target_role,
    target_staff_id,
    related_table,
    related_id,
    payload
  )
  values (
    'reservation_created',
    'staff',
    v_slot.staff_profile_id,
    'reservations',
    new.id,
    jsonb_build_object(
      'reservation_id', new.id,
      'reservation_code', new.reservation_code,
      'slot_id', new.slot_id,
      'slot_date', v_slot.slot_date,
      'slot_time', v_slot.slot_time,
      'slot_label', coalesce(new.slot_label, v_slot.slot_label),
      'customer_name', new.customer_name,
      'summary_headline', new.summary_headline,
      'profile_key', new.profile_key
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_create_reservation_created_notification on public.reservations;
create trigger trg_create_reservation_created_notification
after insert on public.reservations
for each row execute function public.create_reservation_created_notification();

grant execute on function public.create_public_reservation(jsonb) to anon, authenticated;

notify pgrst, 'reload schema';
