create or replace function public.current_customer_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.id
  from public.customers c
  where c.auth_user_id = auth.uid()
    and c.status = 'active'
  limit 1;
$$;

create index if not exists idx_questionnaire_results_customer_id on public.questionnaire_results(customer_id);
create index if not exists idx_fragrance_products_customer_id on public.fragrance_products(customer_id);

create or replace function public.create_questionnaire_result(p_payload jsonb)
returns table(id uuid, result_code text)
language plpgsql
security definer
set search_path = public
as $$
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
    public.current_customer_profile_id(),
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
  on conflict (result_code) do update
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

drop policy if exists "public insert questionnaire results" on public.questionnaire_results;
create policy "public insert questionnaire results"
on public.questionnaire_results for insert
to anon, authenticated
with check (
  customer_id is null
  or customer_id = public.current_customer_profile_id()
);

drop policy if exists "public insert reservations" on public.reservations;
create policy "public insert reservations"
on public.reservations for insert
to anon, authenticated
with check (
  customer_id is null
  or customer_id = public.current_customer_profile_id()
);

grant execute on function public.current_customer_profile_id() to anon, authenticated;
grant execute on function public.create_questionnaire_result(jsonb) to anon, authenticated;
grant execute on function public.create_public_reservation(jsonb) to anon, authenticated;
