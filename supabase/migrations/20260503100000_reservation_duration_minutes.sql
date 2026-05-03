alter table public.reservations
add column if not exists duration_minutes integer;

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
begin
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
    public.current_customer_profile_id(),
    coalesce(nullif(p_payload ->> 'questionnaire_flow_status', ''), 'skipped'),
    p_payload ->> 'questionnaire_sync_error',
    nullif(p_payload ->> 'slot_id', '')::uuid,
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
    coalesce(nullif(p_payload ->> 'status', ''), 'confirmed'),
    coalesce(nullif(p_payload ->> 'updated_at', '')::timestamptz, now())
  )
  returning public.reservations.id, public.reservations.reservation_code;
end;
$$;

create or replace function public.fetch_reservation_by_code(p_reservation_code text)
returns table(
  id uuid,
  reservation_code text,
  customer_name text,
  customer_email text,
  slot_label text,
  duration_minutes integer,
  visit_type text,
  guest_count text,
  staff_memo text,
  summary_headline text,
  summary_body text,
  profile_key text,
  axes jsonb,
  status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id,
    r.reservation_code,
    r.customer_name,
    r.customer_email,
    r.slot_label,
    r.duration_minutes,
    r.visit_type,
    r.guest_count,
    r.staff_memo,
    r.summary_headline,
    r.summary_body,
    r.profile_key,
    r.axes,
    r.status,
    r.created_at
  from public.reservations r
  where r.reservation_code = p_reservation_code
  limit 1;
$$;

grant insert (duration_minutes) on public.reservations to anon;
