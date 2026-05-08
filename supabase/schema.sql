create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.questionnaire_results (
  id uuid primary key default gen_random_uuid(),
  result_code text unique not null,
  step1_answers_json jsonb,
  step1_answer_keys_json jsonb,
  step2_answers_json jsonb,
  step2_answer_keys_json jsonb,
  branch_key text,
  axes_after_step1 jsonb,
  axes_after_step2 jsonb,
  final_axes jsonb,
  adjusted_axes jsonb,
  reset_axes jsonb,
  selected_finish text,
  profile_key text,
  summary_headline text,
  summary_body text,
  source text default 'public_web',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.reservation_slots (
  id uuid primary key default gen_random_uuid(),
  slot_code text unique not null,
  slot_date date not null,
  slot_time time not null,
  slot_label text not null,
  instructor_name text,
  instructor_gender text,
  status text not null default 'open',
  capacity integer not null default 1,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  reservation_code text unique not null,
  questionnaire_result_id uuid references public.questionnaire_results(id) on delete set null,
  questionnaire_flow_status text not null default 'skipped',
  questionnaire_sync_error text,
  slot_id uuid references public.reservation_slots(id) on delete set null,
  slot_label text,
  customer_name text,
  customer_email text,
  duration_minutes integer,
  visit_type text,
  guest_count text,
  staff_memo text,
  summary_headline text,
  summary_body text,
  profile_key text,
  axes jsonb,
  status text not null default 'confirmed',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.reservations
add column if not exists questionnaire_flow_status text not null default 'skipped';

alter table public.reservations
add column if not exists questionnaire_sync_error text;

create table if not exists public.scoring_configs (
  id uuid primary key default gen_random_uuid(),
  config_key text unique not null,
  version integer not null default 1,
  is_active boolean not null default false,
  config_json jsonb not null,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

with ranked_active_scoring_configs as (
  select
    id,
    row_number() over (order by version desc, updated_at desc, created_at desc) as rn
  from public.scoring_configs
  where is_active = true
)
update public.scoring_configs
set is_active = false,
    updated_at = now()
where id in (
  select id
  from ranked_active_scoring_configs
  where rn > 1
);

create unique index if not exists idx_scoring_configs_single_active
on public.scoring_configs (is_active)
where is_active = true;

create table if not exists public.material_points (
  id uuid primary key default gen_random_uuid(),
  material_code text unique not null,
  material_name text not null,
  category text,
  point_axes jsonb not null,
  tags jsonb not null default '[]'::jsonb,
  note text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.recommendation_recipe_cache (
  id uuid primary key default gen_random_uuid(),
  question_signature text not null,
  questionnaire_axes jsonb not null,
  questionnaire_comparable_axes jsonb not null default '{}'::jsonb,
  recipe_items jsonb not null,
  raw_recipe_axes jsonb not null,
  recipe_comparable_axes jsonb not null default '{}'::jsonb,
  distance_score numeric not null,
  scoring_config_version text not null,
  material_points_version text not null,
  algorithm_version text not null default 'recipe-l1-profile-v1',
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (question_signature, scoring_config_version, material_points_version, algorithm_version)
);

create index if not exists idx_recommendation_recipe_cache_lookup
on public.recommendation_recipe_cache (question_signature, scoring_config_version, material_points_version, algorithm_version)
where is_active = true;

create table if not exists public.admin_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text unique not null,
  setting_value jsonb not null,
  updated_at timestamptz default now()
);

create table if not exists public.workshop_sessions (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid unique references public.reservations(id) on delete cascade,
  questionnaire_result_id uuid references public.questionnaire_results(id) on delete set null,
  preparation_note text,
  staff_summary text,
  pre_visit_axes jsonb,
  reservation_axes jsonb,
  previsit_recipe_items jsonb not null default '[]'::jsonb,
  previsit_recipe_axes jsonb,
  final_axes jsonb,
  recipe_items jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  customer_code text unique not null default ('CUS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  email text,
  display_name text,
  phone text,
  status text not null default 'active' check (status in ('active', 'inactive', 'deleted')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.staff_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  login_id text unique,
  email text,
  staff_name text not null,
  display_name text,
  role text not null default 'staff' check (role in ('manager', 'staff')),
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.questionnaire_results
add column if not exists customer_id uuid references public.customers(id) on delete set null;

alter table public.questionnaire_results
add column if not exists edit_token_hash text;

alter table public.reservation_slots
add column if not exists staff_profile_id uuid references public.staff_profiles(id) on delete set null;

alter table public.reservations
add column if not exists customer_id uuid references public.customers(id) on delete set null;

alter table public.reservations
add column if not exists customer_name text;

alter table public.reservations
add column if not exists customer_email text;

alter table public.reservations
add column if not exists duration_minutes integer;

alter table public.workshop_sessions
add column if not exists staff_profile_id uuid references public.staff_profiles(id) on delete set null;

alter table public.admin_settings
add column if not exists is_public boolean not null default false;

create table if not exists public.fragrance_products (
  id uuid primary key default gen_random_uuid(),
  product_code text unique not null default ('PRD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  workshop_session_id uuid references public.workshop_sessions(id) on delete set null,
  reservation_id uuid references public.reservations(id) on delete set null,
  questionnaire_result_id uuid references public.questionnaire_results(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  product_name text not null,
  product_tags jsonb not null default '[]'::jsonb,
  final_axes jsonb,
  recipe_items jsonb not null default '[]'::jsonb,
  created_by_staff_id uuid references public.staff_profiles(id) on delete set null,
  personal_info_consent boolean not null default false,
  third_party_order_consent boolean not null default false,
  consented_at timestamptz,
  consented_by_staff_id uuid references public.staff_profiles(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.product_qr_codes (
  id uuid primary key default gen_random_uuid(),
  fragrance_product_id uuid not null references public.fragrance_products(id) on delete cascade,
  qr_code text unique not null default ('QR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  public_token text unique not null default lower(replace(gen_random_uuid()::text, '-', '')),
  status text not null default 'draft' check (status in ('draft', 'active', 'inactive', 'expired', 'revoked')),
  is_public boolean not null default false,
  issued_at timestamptz,
  expires_at timestamptz,
  last_shipped_at timestamptz,
  inactive_reason text,
  access_count integer not null default 0,
  last_accessed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.qr_product_requests (
  id uuid primary key default gen_random_uuid(),
  request_code text unique not null default ('QRR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  product_qr_code_id uuid not null references public.product_qr_codes(id) on delete restrict,
  fragrance_product_id uuid not null references public.fragrance_products(id) on delete restrict,
  requester_email text not null,
  quantity_10ml integer not null default 0 check (quantity_10ml >= 0),
  quantity_30ml integer not null default 0 check (quantity_30ml >= 0),
  total_volume_ml integer generated always as ((quantity_10ml * 10) + (quantity_30ml * 30)) stored,
  status text not null default 'requested' check (status in (
    'requested',
    'available_email_sent',
    'reminder_email_sent',
    'expired',
    'unavailable',
    'shipping_pending',
    'shipped',
    'auto_unavailable_overdue'
  )),
  availability_due_at timestamptz,
  available_email_sent_at timestamptz,
  reminder_email_sent_at timestamptz,
  expires_at timestamptz,
  shipping_name text,
  shipping_postal_code text,
  shipping_address text,
  shipping_phone text,
  payment_method text,
  shipping_info_submitted_at timestamptz,
  shipped_at timestamptz,
  email_retention_until date,
  shipping_address_retention_until date,
  pii_anonymized_at timestamptz,
  handled_by_staff_id uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check ((quantity_10ml * 10) + (quantity_30ml * 30) > 0)
);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  target_role text not null default 'staff' check (target_role in ('manager', 'staff', 'customer')),
  target_staff_id uuid references public.staff_profiles(id) on delete set null,
  related_table text,
  related_id uuid,
  status text not null default 'open' check (status in ('open', 'seen', 'handled', 'dismissed')),
  payload jsonb not null default '{}'::jsonb,
  seen_at timestamptz,
  handled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  template_key text not null,
  recipient_email text not null,
  related_table text,
  related_id uuid,
  status text not null default 'queued' check (status in ('queued', 'mocked', 'sent', 'failed', 'cancelled')),
  subject text,
  payload jsonb not null default '{}'::jsonb,
  send_after timestamptz default now(),
  sent_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  retention_until date,
  pii_anonymized_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

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

create index if not exists idx_customers_auth_user_id on public.customers(auth_user_id);
create index if not exists idx_staff_profiles_auth_user_id on public.staff_profiles(auth_user_id);
create index if not exists idx_reservation_slots_staff_profile_id on public.reservation_slots(staff_profile_id);
create index if not exists idx_questionnaire_results_customer_id on public.questionnaire_results(customer_id);
create index if not exists idx_reservations_customer_id on public.reservations(customer_id);
create index if not exists idx_workshop_sessions_staff_profile_id on public.workshop_sessions(staff_profile_id);
create index if not exists idx_fragrance_products_customer_id on public.fragrance_products(customer_id);
create index if not exists idx_fragrance_products_staff_id on public.fragrance_products(created_by_staff_id);
create index if not exists idx_fragrance_products_status on public.fragrance_products(status);
create index if not exists idx_product_qr_codes_public_token on public.product_qr_codes(public_token);
create index if not exists idx_product_qr_codes_product_id on public.product_qr_codes(fragrance_product_id);
create index if not exists idx_qr_product_requests_qr_id on public.qr_product_requests(product_qr_code_id);
create index if not exists idx_qr_product_requests_status on public.qr_product_requests(status);
create index if not exists idx_notification_events_status on public.notification_events(status);
create index if not exists idx_notification_events_type_status on public.notification_events(event_type, status, created_at desc);
create index if not exists idx_email_events_status on public.email_events(status);
create index if not exists idx_email_events_related on public.email_events(related_table, related_id);
create index if not exists idx_qr_access_logs_qr_id_accessed_at
on public.qr_access_logs(product_qr_code_id, accessed_at desc);
create index if not exists idx_reservations_slot_active
on public.reservations(slot_id, status)
where status <> 'canceled';

create or replace function public.portal_role_from_session()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'portal_role', ''),
    nullif(auth.jwt() -> 'app_metadata' ->> 'role', '')
  );
$$;

create or replace function public.current_staff_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select sp.id
  from public.staff_profiles sp
  where sp.auth_user_id = auth.uid()
    and sp.is_active = true
  limit 1;
$$;

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

create or replace function public.should_link_current_customer(p_payload jsonb)
returns boolean
language sql
immutable
as $$
  select lower(coalesce(p_payload ->> 'link_customer', 'false')) in ('true', '1', 'yes', 'on');
$$;

create or replace function public.current_portal_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.portal_role_from_session(),
    (
      select sp.role
      from public.staff_profiles sp
      where sp.auth_user_id = auth.uid()
        and sp.is_active = true
      limit 1
    ),
    (
      select 'customer'
      where exists (
        select 1
        from public.customers c
        where c.auth_user_id = auth.uid()
          and c.status = 'active'
      )
    )
  );
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable
as $$
  select public.current_portal_role() in ('manager', 'admin');
$$;

create or replace function public.is_staff_member()
returns boolean
language sql
stable
as $$
  select public.current_portal_role() in ('staff', 'manager', 'admin');
$$;

create or replace function public.is_customer_member()
returns boolean
language sql
stable
as $$
  select public.current_portal_role() in ('customer', 'member');
$$;

create or replace function public.has_active_public_product_qr(p_fragrance_product_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.product_qr_codes pq
    where pq.fragrance_product_id = p_fragrance_product_id
      and pq.status = 'active'
      and pq.is_public = true
      and (pq.expires_at is null or pq.expires_at > now())
  );
$$;

create or replace function public.can_current_staff_access_fragrance_product(p_fragrance_product_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_staff_member()
    and exists (
      select 1
      from public.fragrance_products fp
      where fp.id = p_fragrance_product_id
        and (fp.created_by_staff_id = public.current_staff_profile_id() or fp.created_by_staff_id is null)
    );
$$;

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

drop trigger if exists trg_hash_questionnaire_edit_token on public.questionnaire_results;
create trigger trg_hash_questionnaire_edit_token
before insert or update of edit_token_hash on public.questionnaire_results
for each row
execute function public.hash_questionnaire_edit_token();

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

create or replace function public.fetch_customer_portal_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_customer_id uuid := public.current_customer_profile_id();
  v_customer jsonb := null;
  v_reservations jsonb := '[]'::jsonb;
  v_products jsonb := '[]'::jsonb;
begin
  if v_customer_id is null then
    return jsonb_build_object(
      'customer', null,
      'reservations', v_reservations,
      'products', v_products
    );
  end if;

  select jsonb_build_object(
    'id', c.id,
    'customer_code', c.customer_code,
    'email', c.email,
    'display_name', c.display_name,
    'status', c.status
  )
  into v_customer
  from public.customers c
  where c.id = v_customer_id
  limit 1;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'reservation_code', r.reservation_code,
        'slot_label', r.slot_label,
        'visit_type', r.visit_type,
        'guest_count', r.guest_count,
        'summary_headline', r.summary_headline,
        'profile_key', r.profile_key,
        'status', r.status,
        'created_at', r.created_at,
        'updated_at', r.updated_at
      )
      order by coalesce(r.updated_at, r.created_at) desc
    ),
    '[]'::jsonb
  )
  into v_reservations
  from public.reservations r
  where r.customer_id = v_customer_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', fp.id,
        'product_name', fp.product_name,
        'status', fp.status,
        'reservation_id', fp.reservation_id,
        'questionnaire_result_id', fp.questionnaire_result_id,
        'final_axes', fp.final_axes,
        'visit_date', rs.slot_date,
        'slot_label', coalesce(rs.slot_label, r.slot_label),
        'staff_name', coalesce(sp.display_name, sp.staff_name, rs.instructor_name),
        'summary_headline', r.summary_headline,
        'profile_key', r.profile_key,
        'qr_public_token', active_qr.public_token,
        'created_at', fp.created_at,
        'updated_at', fp.updated_at
      )
      order by coalesce(fp.updated_at, fp.created_at) desc
    ),
    '[]'::jsonb
  )
  into v_products
  from public.fragrance_products fp
  left join public.reservations r on r.id = fp.reservation_id
  left join public.reservation_slots rs on rs.id = r.slot_id
  left join public.staff_profiles sp on sp.id = fp.created_by_staff_id
  left join lateral (
    select pq.public_token
    from public.product_qr_codes pq
    where pq.fragrance_product_id = fp.id
      and pq.status = 'active'
      and pq.is_public = true
      and (pq.expires_at is null or pq.expires_at > now())
    order by coalesce(pq.issued_at, pq.created_at) desc
    limit 1
  ) active_qr on true
  where fp.customer_id = v_customer_id;

  return jsonb_build_object(
    'customer', v_customer,
    'reservations', v_reservations,
    'products', v_products
  );
end;
$$;

create or replace function public.add_business_days(p_start timestamptz, p_days integer)
returns timestamptz
language plpgsql
stable
as $$
declare
  v_result timestamptz := p_start;
  v_added integer := 0;
begin
  while v_added < greatest(p_days, 0) loop
    v_result := v_result + interval '1 day';
    if extract(isodow from v_result) between 1 and 5 then
      v_added := v_added + 1;
    end if;
  end loop;
  return v_result;
end;
$$;

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

create or replace function public.fetch_qr_product_public_page(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_qr record;
  v_product_id uuid;
  v_product_name text;
  v_product_tags jsonb;
begin
  select *
  into v_qr
  from public.record_qr_product_access(p_token)
  limit 1;

  if not found then
    return null;
  end if;

  if coalesce(v_qr.is_available, false) then
    select
      fp.id,
      fp.product_name,
      fp.product_tags
    into
      v_product_id,
      v_product_name,
      v_product_tags
    from public.fragrance_products fp
    where fp.id = v_qr.fragrance_product_id
      and fp.status = 'published'
    limit 1;
  end if;

  return jsonb_build_object(
    'qrCode', jsonb_build_object(
      'id', v_qr.id,
      'fragrance_product_id', v_qr.fragrance_product_id,
      'qr_code', v_qr.qr_code,
      'public_token', v_qr.public_token,
      'status', v_qr.status,
      'expires_at', v_qr.expires_at,
      'inactive_reason', v_qr.inactive_reason,
      'is_available', v_qr.is_available
    ),
    'product', case
      when v_product_id is null then null
      else jsonb_build_object(
        'id', v_product_id,
        'product_name', v_product_name,
        'product_tags', coalesce(v_product_tags, '[]'::jsonb)
      )
    end
  );
end;
$$;

create or replace function public.can_create_public_qr_product_request(
  p_product_qr_code_id uuid,
  p_fragrance_product_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.product_qr_codes pq
    join public.fragrance_products fp on fp.id = pq.fragrance_product_id
    where pq.id = p_product_qr_code_id
      and pq.fragrance_product_id = p_fragrance_product_id
      and pq.status = 'active'
      and pq.is_public = true
      and (pq.expires_at is null or pq.expires_at > now())
      and fp.status = 'published'
  );
$$;

create or replace function public.create_public_qr_product_request(p_payload jsonb)
returns public.qr_product_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text := btrim(coalesce(p_payload ->> 'token', p_payload ->> 'public_token', p_payload ->> 'qr_code', ''));
  v_requester_email text := lower(btrim(coalesce(p_payload ->> 'requester_email', '')));
  v_quantity_10ml integer := coalesce(nullif(p_payload ->> 'quantity_10ml', '')::integer, 0);
  v_quantity_30ml integer := coalesce(nullif(p_payload ->> 'quantity_30ml', '')::integer, 0);
  v_total_volume_ml integer := 0;
  v_max_volume_ml integer := public.qr_product_public_max_volume_ml();
  v_qr public.product_qr_codes;
  v_product public.fragrance_products;
  v_request public.qr_product_requests;
begin
  if v_token = '' then
    raise exception 'QR token is required.' using errcode = '22023';
  end if;

  if v_requester_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'A valid requester email is required.' using errcode = '22023';
  end if;

  if v_quantity_10ml < 0 or v_quantity_30ml < 0 then
    raise exception 'QR request quantities must be zero or greater.' using errcode = '22023';
  end if;

  v_total_volume_ml := (v_quantity_10ml * 10) + (v_quantity_30ml * 30);
  if v_total_volume_ml <= 0 then
    raise exception 'QR request quantity is required.' using errcode = '22023';
  end if;

  if v_total_volume_ml > v_max_volume_ml then
    raise exception 'QR request quantity exceeds the maximum volume.' using errcode = '22023';
  end if;

  select pq.*
  into v_qr
  from public.product_qr_codes pq
  where pq.public_token = v_token
     or pq.qr_code = v_token
  limit 1;

  if v_qr.id is null
    or not public.can_create_public_qr_product_request(v_qr.id, v_qr.fragrance_product_id) then
    raise exception 'QR product page is not available.' using errcode = 'P0002';
  end if;

  select fp.*
  into v_product
  from public.fragrance_products fp
  where fp.id = v_qr.fragrance_product_id
  limit 1;

  if v_product.id is null or v_product.status <> 'published' then
    raise exception 'QR product is not available.' using errcode = 'P0002';
  end if;

  insert into public.qr_product_requests (
    product_qr_code_id,
    fragrance_product_id,
    requester_email,
    quantity_10ml,
    quantity_30ml,
    status
  )
  values (
    v_qr.id,
    v_product.id,
    v_requester_email,
    v_quantity_10ml,
    v_quantity_30ml,
    'requested'
  )
  returning *
  into v_request;

  return v_request;
end;
$$;

create or replace function public.set_qr_product_request_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.availability_due_at is null then
    new.availability_due_at := public.add_business_days(
      now(),
      public.qr_product_public_setting_integer('availability_due_business_days', 3)
    );
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

create or replace function public.create_qr_product_request_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staff_id uuid;
  v_product_name text;
begin
  select fp.created_by_staff_id, fp.product_name
  into v_staff_id, v_product_name
  from public.fragrance_products fp
  where fp.id = new.fragrance_product_id;

  insert into public.notification_events (
    event_type,
    target_role,
    target_staff_id,
    related_table,
    related_id,
    payload
  )
  values (
    'qr_product_requested',
    'staff',
    v_staff_id,
    'qr_product_requests',
    new.id,
    jsonb_build_object(
      'request_code', new.request_code,
      'fragrance_product_id', new.fragrance_product_id,
      'product_qr_code_id', new.product_qr_code_id,
      'product_name', v_product_name,
      'quantity_10ml', new.quantity_10ml,
      'quantity_30ml', new.quantity_30ml,
      'total_volume_ml', new.total_volume_ml,
      'availability_due_at', new.availability_due_at
    )
  );
  return new;
end;
$$;

drop trigger if exists trg_create_qr_product_request_notification on public.qr_product_requests;
create trigger trg_create_qr_product_request_notification
after insert on public.qr_product_requests
for each row execute function public.create_qr_product_request_notification();

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

create or replace function public.create_qr_product_request_email_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_name text;
begin
  select fp.product_name
  into v_product_name
  from public.fragrance_products fp
  where fp.id = new.fragrance_product_id;

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
    'qr_request_received',
    'qr_request_received_v1',
    new.requester_email,
    'qr_product_requests',
    new.id,
    'queued',
    '香水の作成依頼を受け付けました',
    jsonb_build_object(
      'request_code', new.request_code,
      'fragrance_product_id', new.fragrance_product_id,
      'product_qr_code_id', new.product_qr_code_id,
      'product_name', v_product_name,
      'quantity_10ml', new.quantity_10ml,
      'quantity_30ml', new.quantity_30ml,
      'total_volume_ml', new.total_volume_ml,
      'availability_due_at', new.availability_due_at
    ),
    new.email_retention_until
  );
  return new;
end;
$$;

drop trigger if exists trg_create_qr_product_request_email_event on public.qr_product_requests;
create trigger trg_create_qr_product_request_email_event
after insert on public.qr_product_requests
for each row execute function public.create_qr_product_request_email_event();

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

  update public.notification_events
  set status = 'handled', handled_at = now(), updated_at = now()
  where related_table = 'qr_product_requests'
    and related_id = v_request.id
    and status = 'open';

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
    'lp_url', ''
  ),
  true
)
on conflict (setting_key) do update
set
  setting_value = excluded.setting_value || coalesce(public.admin_settings.setting_value, '{}'::jsonb),
  is_public = true,
  updated_at = now();

alter table public.questionnaire_results enable row level security;
alter table public.reservation_slots enable row level security;
alter table public.reservations enable row level security;
alter table public.scoring_configs enable row level security;
alter table public.material_points enable row level security;
alter table public.recommendation_recipe_cache enable row level security;
alter table public.admin_settings enable row level security;
alter table public.workshop_sessions enable row level security;
alter table public.customers enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.fragrance_products enable row level security;
alter table public.product_qr_codes enable row level security;
alter table public.qr_product_requests enable row level security;
alter table public.notification_events enable row level security;
alter table public.email_events enable row level security;
alter table public.qr_access_logs enable row level security;

drop policy if exists "admin reservation slots all" on public.reservation_slots;
drop policy if exists "admin reservations all" on public.reservations;
drop policy if exists "admin scoring configs all" on public.scoring_configs;
drop policy if exists "admin material points all" on public.material_points;
drop policy if exists "staff select recommendation recipe cache" on public.recommendation_recipe_cache;
drop policy if exists "staff insert recommendation recipe cache" on public.recommendation_recipe_cache;
drop policy if exists "staff update recommendation recipe cache" on public.recommendation_recipe_cache;
drop policy if exists "manager recommendation recipe cache all" on public.recommendation_recipe_cache;
drop policy if exists "admin settings all" on public.admin_settings;
drop policy if exists "admin workshop sessions all" on public.workshop_sessions;

drop policy if exists "public select active scoring config" on public.scoring_configs;
drop policy if exists "manager scoring configs all" on public.scoring_configs;
create policy "public select active scoring config"
on public.scoring_configs for select
to anon, authenticated
using (is_active = true);
create policy "manager scoring configs all"
on public.scoring_configs for all
to authenticated
using (public.is_manager())
with check (public.is_manager());

drop policy if exists "public select active material points" on public.material_points;
drop policy if exists "manager material points all" on public.material_points;
create policy "public select active material points"
on public.material_points for select
to anon, authenticated
using (is_active = true);
create policy "manager material points all"
on public.material_points for all
to authenticated
using (public.is_manager())
with check (public.is_manager());

create policy "staff select recommendation recipe cache"
on public.recommendation_recipe_cache for select
to authenticated
using (public.is_staff_member());
create policy "staff insert recommendation recipe cache"
on public.recommendation_recipe_cache for insert
to authenticated
with check (public.is_staff_member());
create policy "staff update recommendation recipe cache"
on public.recommendation_recipe_cache for update
to authenticated
using (public.is_staff_member())
with check (public.is_staff_member());
create policy "manager recommendation recipe cache all"
on public.recommendation_recipe_cache for all
to authenticated
using (public.is_manager())
with check (public.is_manager());

drop policy if exists "public select open reservation slots" on public.reservation_slots;
drop policy if exists "staff select reservation slots" on public.reservation_slots;
drop policy if exists "staff insert own reservation slots" on public.reservation_slots;
drop policy if exists "staff update own reservation slots" on public.reservation_slots;
drop policy if exists "staff delete own reservation slots" on public.reservation_slots;
drop policy if exists "manager reservation slots all" on public.reservation_slots;
create policy "public select open reservation slots"
on public.reservation_slots for select
to anon, authenticated
using (is_active = true and status in ('open', 'recommended'));
create policy "staff select reservation slots"
on public.reservation_slots for select
to authenticated
using (public.is_staff_member());
create policy "staff insert own reservation slots"
on public.reservation_slots for insert
to authenticated
with check (
  public.is_staff_member()
  and not public.is_manager()
  and (staff_profile_id = public.current_staff_profile_id() or staff_profile_id is null)
);
create policy "staff update own reservation slots"
on public.reservation_slots for update
to authenticated
using (
  public.is_staff_member()
  and not public.is_manager()
  and (staff_profile_id = public.current_staff_profile_id() or staff_profile_id is null)
)
with check (
  public.is_staff_member()
  and not public.is_manager()
  and (staff_profile_id = public.current_staff_profile_id() or staff_profile_id is null)
);
create policy "staff delete own reservation slots"
on public.reservation_slots for delete
to authenticated
using (
  public.is_staff_member()
  and not public.is_manager()
  and (staff_profile_id = public.current_staff_profile_id() or staff_profile_id is null)
);
create policy "manager reservation slots all"
on public.reservation_slots for all
to authenticated
using (public.is_manager())
with check (public.is_manager());

drop policy if exists "public insert questionnaire results" on public.questionnaire_results;
drop policy if exists "public update questionnaire results" on public.questionnaire_results;
drop policy if exists "staff select questionnaire results" on public.questionnaire_results;
drop policy if exists "customer select own questionnaire results" on public.questionnaire_results;
drop policy if exists "manager questionnaire results all" on public.questionnaire_results;
create policy "public insert questionnaire results"
on public.questionnaire_results for insert
to anon, authenticated
with check (
  customer_id is null
  or customer_id = public.current_customer_profile_id()
);
create policy "staff select questionnaire results"
on public.questionnaire_results for select
to authenticated
using (public.is_staff_member());
create policy "customer select own questionnaire results"
on public.questionnaire_results for select
to authenticated
using (public.is_customer_member() and customer_id in (
  select c.id from public.customers c where c.auth_user_id = auth.uid()
));
create policy "manager questionnaire results all"
on public.questionnaire_results for all
to authenticated
using (public.is_manager())
with check (public.is_manager());

drop policy if exists "public insert reservations" on public.reservations;
drop policy if exists "public select reservations by code" on public.reservations;
drop policy if exists "staff select reservations" on public.reservations;
drop policy if exists "staff update reservations" on public.reservations;
drop policy if exists "customer select own reservations" on public.reservations;
drop policy if exists "manager reservations all" on public.reservations;
create policy "public insert reservations"
on public.reservations for insert
to anon, authenticated
with check (
  customer_id is null
  or customer_id = public.current_customer_profile_id()
);
create policy "staff select reservations"
on public.reservations for select
to authenticated
using (
  public.is_staff_member()
  and (
    slot_id is null
    or exists (
      select 1
      from public.reservation_slots rs
      where rs.id = slot_id
        and (rs.staff_profile_id = public.current_staff_profile_id() or rs.staff_profile_id is null)
    )
  )
);
create policy "staff update reservations"
on public.reservations for update
to authenticated
using (
  public.is_staff_member()
  and (
    slot_id is null
    or exists (
      select 1
      from public.reservation_slots rs
      where rs.id = slot_id
        and (rs.staff_profile_id = public.current_staff_profile_id() or rs.staff_profile_id is null)
    )
  )
)
with check (
  public.is_staff_member()
  and (
    slot_id is null
    or exists (
      select 1
      from public.reservation_slots rs
      where rs.id = slot_id
        and (rs.staff_profile_id = public.current_staff_profile_id() or rs.staff_profile_id is null)
    )
  )
);
create policy "customer select own reservations"
on public.reservations for select
to authenticated
using (public.is_customer_member() and customer_id in (
  select c.id from public.customers c where c.auth_user_id = auth.uid()
));
create policy "manager reservations all"
on public.reservations for all
to authenticated
using (public.is_manager())
with check (public.is_manager());

drop policy if exists "public select admin settings" on public.admin_settings;
drop policy if exists "manager settings all" on public.admin_settings;
create policy "public select admin settings"
on public.admin_settings for select
to anon, authenticated
using (is_public = true);
create policy "manager settings all"
on public.admin_settings for all
to authenticated
using (public.is_manager())
with check (public.is_manager());

drop policy if exists "staff select workshop sessions" on public.workshop_sessions;
drop policy if exists "staff insert workshop sessions" on public.workshop_sessions;
drop policy if exists "staff update workshop sessions" on public.workshop_sessions;
drop policy if exists "manager workshop sessions all" on public.workshop_sessions;
create policy "staff select workshop sessions"
on public.workshop_sessions for select
to authenticated
using (
  public.is_staff_member()
  and (staff_profile_id = public.current_staff_profile_id() or staff_profile_id is null)
);
create policy "staff insert workshop sessions"
on public.workshop_sessions for insert
to authenticated
with check (
  public.is_staff_member()
  and (staff_profile_id = public.current_staff_profile_id() or staff_profile_id is null)
);
create policy "staff update workshop sessions"
on public.workshop_sessions for update
to authenticated
using (
  public.is_staff_member()
  and (staff_profile_id = public.current_staff_profile_id() or staff_profile_id is null)
)
with check (
  public.is_staff_member()
  and (staff_profile_id = public.current_staff_profile_id() or staff_profile_id is null)
);
create policy "manager workshop sessions all"
on public.workshop_sessions for all
to authenticated
using (public.is_manager())
with check (public.is_manager());

drop policy if exists "customer own profile" on public.customers;
drop policy if exists "customer insert own profile" on public.customers;
drop policy if exists "manager customers all" on public.customers;
drop policy if exists "staff select customers" on public.customers;
create policy "customer own profile"
on public.customers for select
to authenticated
using (auth_user_id = auth.uid());
create policy "customer insert own profile"
on public.customers for insert
to authenticated
with check (
  auth_user_id = auth.uid()
  and coalesce(public.portal_role_from_session(), 'customer') in ('customer', 'member')
);
create policy "staff select customers"
on public.customers for select
to authenticated
using (public.is_staff_member());
create policy "manager customers all"
on public.customers for all
to authenticated
using (public.is_manager())
with check (public.is_manager());

drop policy if exists "staff select active staff profiles" on public.staff_profiles;
drop policy if exists "staff select own staff profile" on public.staff_profiles;
drop policy if exists "manager staff profiles all" on public.staff_profiles;
create policy "staff select active staff profiles"
on public.staff_profiles for select
to authenticated
using (public.is_staff_member() and is_active = true);
create policy "staff select own staff profile"
on public.staff_profiles for select
to authenticated
using (auth_user_id = auth.uid());
create policy "manager staff profiles all"
on public.staff_profiles for all
to authenticated
using (public.is_manager())
with check (public.is_manager());

drop policy if exists "public select published fragrance products" on public.fragrance_products;
drop policy if exists "staff fragrance products own" on public.fragrance_products;
drop policy if exists "manager fragrance products all" on public.fragrance_products;
create policy "public select published fragrance products"
on public.fragrance_products for select
to anon, authenticated
using (
  status = 'published'
  and public.has_active_public_product_qr(id)
);
create policy "staff fragrance products own"
on public.fragrance_products for all
to authenticated
using (
  public.is_staff_member()
  and (created_by_staff_id = public.current_staff_profile_id() or created_by_staff_id is null)
)
with check (
  public.is_staff_member()
  and (created_by_staff_id = public.current_staff_profile_id() or created_by_staff_id is null)
);
create policy "manager fragrance products all"
on public.fragrance_products for all
to authenticated
using (public.is_manager())
with check (public.is_manager());

drop policy if exists "public select active product qr codes" on public.product_qr_codes;
drop policy if exists "staff product qr codes own" on public.product_qr_codes;
drop policy if exists "manager product qr codes all" on public.product_qr_codes;
create policy "public select active product qr codes"
on public.product_qr_codes for select
to anon, authenticated
using (
  status = 'active'
  and is_public = true
  and (expires_at is null or expires_at > now())
);
create policy "staff product qr codes own"
on public.product_qr_codes for all
to authenticated
using (
  public.can_current_staff_access_fragrance_product(fragrance_product_id)
)
with check (
  public.can_current_staff_access_fragrance_product(fragrance_product_id)
);
create policy "manager product qr codes all"
on public.product_qr_codes for all
to authenticated
using (public.is_manager())
with check (public.is_manager());

drop policy if exists "public insert qr product requests" on public.qr_product_requests;
drop policy if exists "staff qr product requests own" on public.qr_product_requests;
drop policy if exists "manager qr product requests all" on public.qr_product_requests;
create policy "public insert qr product requests"
on public.qr_product_requests for insert
to anon, authenticated
with check (
  status = 'requested'
  and requester_email = btrim(requester_email)
  and requester_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  and total_volume_ml > 0
  and total_volume_ml <= public.qr_product_public_max_volume_ml()
  and public.can_create_public_qr_product_request(product_qr_code_id, fragrance_product_id)
);
create policy "staff qr product requests own"
on public.qr_product_requests for all
to authenticated
using (
  public.is_staff_member()
  and exists (
    select 1
    from public.fragrance_products fp
    where fp.id = qr_product_requests.fragrance_product_id
      and (fp.created_by_staff_id = public.current_staff_profile_id() or handled_by_staff_id = public.current_staff_profile_id())
  )
)
with check (
  public.is_staff_member()
  and exists (
    select 1
    from public.fragrance_products fp
    where fp.id = qr_product_requests.fragrance_product_id
      and (fp.created_by_staff_id = public.current_staff_profile_id() or handled_by_staff_id = public.current_staff_profile_id())
  )
);
create policy "manager qr product requests all"
on public.qr_product_requests for all
to authenticated
using (public.is_manager())
with check (public.is_manager());

drop policy if exists "staff notification events own" on public.notification_events;
drop policy if exists "manager notification events all" on public.notification_events;
create policy "staff notification events own"
on public.notification_events for all
to authenticated
using (
  public.is_staff_member()
  and target_role = 'staff'
  and (target_staff_id = public.current_staff_profile_id() or target_staff_id is null)
)
with check (
  public.is_staff_member()
  and target_role = 'staff'
  and (target_staff_id = public.current_staff_profile_id() or target_staff_id is null)
);
create policy "manager notification events all"
on public.notification_events for all
to authenticated
using (public.is_manager())
with check (public.is_manager());

drop policy if exists "staff select email events own" on public.email_events;
drop policy if exists "manager email events all" on public.email_events;
create policy "staff select email events own"
on public.email_events for select
to authenticated
using (
  public.is_staff_member()
  and related_table = 'qr_product_requests'
  and exists (
    select 1
    from public.qr_product_requests qpr
    join public.fragrance_products fp on fp.id = qpr.fragrance_product_id
    where qpr.id = email_events.related_id
      and fp.created_by_staff_id = public.current_staff_profile_id()
  )
);
create policy "manager email events all"
on public.email_events for all
to authenticated
using (public.is_manager())
with check (public.is_manager());

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

revoke all on table public.questionnaire_results from anon;
revoke all on table public.reservation_slots from anon;
revoke all on table public.reservations from anon;
revoke all on table public.scoring_configs from anon;
revoke all on table public.material_points from anon;
revoke all on table public.recommendation_recipe_cache from anon;
revoke all on table public.admin_settings from anon;
revoke all on table public.workshop_sessions from anon;
revoke all on table public.customers from anon;
revoke all on table public.staff_profiles from anon;
revoke all on table public.fragrance_products from anon;
revoke all on table public.product_qr_codes from anon;
revoke all on table public.qr_product_requests from anon;
revoke all on table public.notification_events from anon;
revoke all on table public.email_events from anon;
revoke all on table public.qr_access_logs from anon;

grant execute on function public.create_questionnaire_result(jsonb) to anon, authenticated;
grant execute on function public.update_questionnaire_result_by_token(text, text, jsonb) to anon, authenticated;
grant execute on function public.create_public_reservation(jsonb) to anon, authenticated;
grant execute on function public.fetch_reservation_by_code(text) to anon, authenticated;
grant execute on function public.qr_product_public_setting_integer(text, integer) to anon, authenticated;
grant execute on function public.qr_product_public_max_volume_ml() to anon, authenticated;
grant execute on function public.current_customer_profile_id() to anon, authenticated;
grant execute on function public.should_link_current_customer(jsonb) to anon, authenticated;
grant execute on function public.fetch_customer_portal_summary() to authenticated;
grant execute on function public.record_qr_product_access(text) to anon, authenticated;
revoke all on function public.fetch_qr_product_public_page(text) from public;
grant execute on function public.fetch_qr_product_public_page(text) to anon, authenticated;
revoke all on function public.can_create_public_qr_product_request(uuid, uuid) from public;
grant execute on function public.can_create_public_qr_product_request(uuid, uuid) to anon, authenticated;
revoke all on function public.create_public_qr_product_request(jsonb) from public;
grant execute on function public.create_public_qr_product_request(jsonb) to anon, authenticated;
grant execute on function public.has_active_public_product_qr(uuid) to anon, authenticated;
grant execute on function public.can_current_staff_access_fragrance_product(uuid) to authenticated;
grant execute on function public.mark_qr_request_available(uuid) to authenticated;
grant execute on function public.mark_qr_request_unavailable(uuid, text) to authenticated;
grant execute on function public.mark_qr_request_shipped(uuid) to authenticated;
grant execute on function public.process_qr_request_deadlines(timestamptz) to authenticated;

grant insert (
  result_code,
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
) on public.questionnaire_results to anon;
grant insert (
  reservation_code,
  questionnaire_result_id,
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
  updated_at
) on public.reservations to anon;
grant select (config_json, version, updated_at, is_active) on public.scoring_configs to anon;
grant select (id, material_code, material_name, category, point_axes, tags, note, is_active, sort_order, updated_at) on public.material_points to anon;
grant select (id, slot_code, slot_date, slot_time, slot_label, instructor_name, status, sort_order, is_active) on public.reservation_slots to anon;
grant select (setting_key, setting_value, updated_at, is_public) on public.admin_settings to anon;
grant select, insert, update, delete on public.questionnaire_results to authenticated;
grant select, insert, update, delete on public.reservation_slots to authenticated;
grant select, insert, update, delete on public.reservations to authenticated;
grant select, insert, update, delete on public.scoring_configs to authenticated;
grant select, insert, update, delete on public.material_points to authenticated;
grant select, insert, update, delete on public.recommendation_recipe_cache to authenticated;
grant select, insert, update, delete on public.admin_settings to authenticated;
grant select, insert, update, delete on public.workshop_sessions to authenticated;
grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.staff_profiles to authenticated;
grant select, insert, update, delete on public.fragrance_products to authenticated;
grant select, insert, update, delete on public.product_qr_codes to authenticated;
grant select, insert, update, delete on public.qr_product_requests to authenticated;
grant select, insert, update, delete on public.notification_events to authenticated;
grant select, insert, update, delete on public.email_events to authenticated;
grant select on public.qr_access_logs to authenticated;
