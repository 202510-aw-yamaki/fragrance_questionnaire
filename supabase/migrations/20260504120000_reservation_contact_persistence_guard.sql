alter table public.reservations
add column if not exists customer_name text;

alter table public.reservations
add column if not exists customer_email text;

alter table public.reservations
add column if not exists duration_minutes integer;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create or replace function public.should_link_current_customer(p_payload jsonb)
returns boolean
language sql
immutable
as $$
  select lower(coalesce(p_payload ->> 'link_customer', 'false')) in ('true', '1', 'yes', 'on');
$$;

create or replace function public.create_questionnaire_result(p_payload jsonb)
returns table(id uuid, result_code text)
language plpgsql
security definer
set search_path = public, extensions
as $$
#variable_conflict use_column
declare
  v_result_code text := coalesce(
    nullif(p_payload ->> 'result_code', ''),
    'QR' || to_char(now(), 'YYYYMMDD') || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
  );
begin
  return query
  insert into public.questionnaire_results (
    result_code,
    customer_id,
    step1_answers_json,
    step1_answer_keys_json,
    step2_answers_json,
    step2_answer_keys_json,
    branch_key,
    axes_after_step1,
    axes_after_step2,
    final_axes,
    adjusted_axes,
    reset_axes,
    selected_finish,
    profile_key,
    summary_headline,
    summary_body,
    source,
    edit_token_hash,
    updated_at
  )
  values (
    v_result_code,
    case
      when public.should_link_current_customer(p_payload) then public.current_customer_profile_id()
      else null
    end,
    p_payload -> 'step1_answers_json',
    p_payload -> 'step1_answer_keys_json',
    p_payload -> 'step2_answers_json',
    p_payload -> 'step2_answer_keys_json',
    p_payload ->> 'branch_key',
    p_payload -> 'axes_after_step1',
    p_payload -> 'axes_after_step2',
    p_payload -> 'final_axes',
    p_payload -> 'adjusted_axes',
    p_payload -> 'reset_axes',
    p_payload ->> 'selected_finish',
    p_payload ->> 'profile_key',
    p_payload ->> 'summary_headline',
    p_payload ->> 'summary_body',
    coalesce(nullif(p_payload ->> 'source', ''), 'public_web'),
    p_payload ->> 'edit_token_hash',
    coalesce(nullif(p_payload ->> 'updated_at', '')::timestamptz, now())
  )
  on conflict on constraint questionnaire_results_result_code_key do update
  set
    step1_answers_json = excluded.step1_answers_json,
    step1_answer_keys_json = excluded.step1_answer_keys_json,
    step2_answers_json = excluded.step2_answers_json,
    step2_answer_keys_json = excluded.step2_answer_keys_json,
    branch_key = excluded.branch_key,
    axes_after_step1 = excluded.axes_after_step1,
    axes_after_step2 = excluded.axes_after_step2,
    final_axes = excluded.final_axes,
    adjusted_axes = excluded.adjusted_axes,
    reset_axes = excluded.reset_axes,
    selected_finish = excluded.selected_finish,
    profile_key = excluded.profile_key,
    summary_headline = excluded.summary_headline,
    summary_body = excluded.summary_body,
    customer_id = coalesce(public.questionnaire_results.customer_id, excluded.customer_id),
    source = excluded.source,
    edit_token_hash = coalesce(public.questionnaire_results.edit_token_hash, excluded.edit_token_hash),
    updated_at = excluded.updated_at
  where public.questionnaire_results.edit_token_hash is null
    or (
      nullif(p_payload ->> 'edit_token_hash', '') is not null
      and public.questionnaire_results.edit_token_hash = crypt(
        p_payload ->> 'edit_token_hash',
        public.questionnaire_results.edit_token_hash
      )
    )
  returning public.questionnaire_results.id, public.questionnaire_results.result_code;
end;
$$;

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
    case
      when public.should_link_current_customer(p_payload) then public.current_customer_profile_id()
      else null
    end,
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

drop function if exists public.fetch_reservation_by_code(text);

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

grant execute on function public.create_public_reservation(jsonb) to anon, authenticated;
grant execute on function public.fetch_reservation_by_code(text) to anon, authenticated;
grant execute on function public.create_questionnaire_result(jsonb) to anon, authenticated;
grant execute on function public.should_link_current_customer(jsonb) to anon, authenticated;
grant insert (customer_name, customer_email, duration_minutes) on public.reservations to anon, authenticated;

notify pgrst, 'reload schema';
