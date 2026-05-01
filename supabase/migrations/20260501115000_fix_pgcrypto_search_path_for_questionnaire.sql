create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create or replace function public.hash_questionnaire_edit_token()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  if new.edit_token_hash is not null and new.edit_token_hash !~ '^\$2[aby]\$' then
    new.edit_token_hash := crypt(new.edit_token_hash, gen_salt('bf'));
  end if;
  return new;
end;
$$;

create or replace function public.update_questionnaire_result_by_token(
  p_result_code text,
  p_edit_token text,
  p_patch jsonb
)
returns table(id uuid, result_code text)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if nullif(p_result_code, '') is null or nullif(p_edit_token, '') is null then
    return;
  end if;

  return query
  update public.questionnaire_results qr
  set
    adjusted_axes = case when p_patch ? 'adjusted_axes' then p_patch -> 'adjusted_axes' else qr.adjusted_axes end,
    profile_key = case when p_patch ? 'profile_key' then p_patch ->> 'profile_key' else qr.profile_key end,
    summary_headline = case when p_patch ? 'summary_headline' then p_patch ->> 'summary_headline' else qr.summary_headline end,
    summary_body = case when p_patch ? 'summary_body' then p_patch ->> 'summary_body' else qr.summary_body end,
    updated_at = coalesce(nullif(p_patch ->> 'updated_at', '')::timestamptz, now())
  where qr.result_code = p_result_code
    and qr.edit_token_hash is not null
    and qr.edit_token_hash = crypt(p_edit_token, qr.edit_token_hash)
  returning qr.id, qr.result_code;
end;
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

grant execute on function public.create_questionnaire_result(jsonb) to anon, authenticated;
grant execute on function public.update_questionnaire_result_by_token(text, text, jsonb) to anon, authenticated;

notify pgrst, 'reload schema';
