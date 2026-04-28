create extension if not exists pgcrypto;

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
  note text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

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

create index if not exists idx_customers_auth_user_id on public.customers(auth_user_id);
create index if not exists idx_staff_profiles_auth_user_id on public.staff_profiles(auth_user_id);
create index if not exists idx_reservation_slots_staff_profile_id on public.reservation_slots(staff_profile_id);
create index if not exists idx_reservations_customer_id on public.reservations(customer_id);
create index if not exists idx_workshop_sessions_staff_profile_id on public.workshop_sessions(staff_profile_id);
create index if not exists idx_fragrance_products_staff_id on public.fragrance_products(created_by_staff_id);
create index if not exists idx_fragrance_products_status on public.fragrance_products(status);
create index if not exists idx_product_qr_codes_public_token on public.product_qr_codes(public_token);
create index if not exists idx_product_qr_codes_product_id on public.product_qr_codes(fragrance_product_id);
create index if not exists idx_qr_product_requests_qr_id on public.qr_product_requests(product_qr_code_id);
create index if not exists idx_qr_product_requests_status on public.qr_product_requests(status);
create index if not exists idx_notification_events_status on public.notification_events(status);

create or replace function public.portal_role_from_session()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'portal_role', ''),
    nullif(auth.jwt() -> 'app_metadata' ->> 'role', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'portal_role', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'role', '')
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

create or replace function public.hash_questionnaire_edit_token()
returns trigger
language plpgsql
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
set search_path = public
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
    source = excluded.source,
    edit_token_hash = coalesce(public.questionnaire_results.edit_token_hash, excluded.edit_token_hash),
    updated_at = excluded.updated_at
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

create or replace function public.fetch_reservation_by_code(p_reservation_code text)
returns table(
  id uuid,
  reservation_code text,
  slot_label text,
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
    r.slot_label,
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

create or replace function public.set_qr_product_request_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.availability_due_at is null then
    new.availability_due_at := public.add_business_days(now(), 3);
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

insert into public.admin_settings (setting_key, setting_value, is_public)
values (
  'qr_product_public_settings',
  jsonb_build_object(
    'price_10ml', 1000,
    'price_30ml', 2860,
    'max_volume_ml', 100,
    'shop_phone', '03-1234-5678',
    'business_hours', '11:00〜19:00'
  ),
  true
)
on conflict (setting_key) do nothing;

alter table public.questionnaire_results enable row level security;
alter table public.reservation_slots enable row level security;
alter table public.reservations enable row level security;
alter table public.scoring_configs enable row level security;
alter table public.material_points enable row level security;
alter table public.admin_settings enable row level security;
alter table public.workshop_sessions enable row level security;
alter table public.customers enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.fragrance_products enable row level security;
alter table public.product_qr_codes enable row level security;
alter table public.qr_product_requests enable row level security;
alter table public.notification_events enable row level security;

drop policy if exists "admin reservation slots all" on public.reservation_slots;
drop policy if exists "admin reservations all" on public.reservations;
drop policy if exists "admin scoring configs all" on public.scoring_configs;
drop policy if exists "admin material points all" on public.material_points;
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
with check (true);
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
with check (true);
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
with check (auth_user_id = auth.uid());
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
  and exists (
    select 1
    from public.product_qr_codes pq
    where pq.fragrance_product_id = fragrance_products.id
      and pq.status = 'active'
      and pq.is_public = true
  )
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
using (status = 'active' and is_public = true);
create policy "staff product qr codes own"
on public.product_qr_codes for all
to authenticated
using (
  public.is_staff_member()
  and exists (
    select 1
    from public.fragrance_products fp
    where fp.id = product_qr_codes.fragrance_product_id
      and (fp.created_by_staff_id = public.current_staff_profile_id() or fp.created_by_staff_id is null)
  )
)
with check (
  public.is_staff_member()
  and exists (
    select 1
    from public.fragrance_products fp
    where fp.id = product_qr_codes.fragrance_product_id
      and (fp.created_by_staff_id = public.current_staff_profile_id() or fp.created_by_staff_id is null)
  )
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
  and nullif(requester_email, '') is not null
  and total_volume_ml > 0
  and exists (
    select 1
    from public.product_qr_codes pq
    join public.fragrance_products fp on fp.id = pq.fragrance_product_id
    where pq.id = product_qr_code_id
      and pq.fragrance_product_id = fragrance_product_id
      and pq.status = 'active'
      and pq.is_public = true
      and fp.status = 'published'
  )
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

revoke all on table public.questionnaire_results from anon;
revoke all on table public.reservation_slots from anon;
revoke all on table public.reservations from anon;
revoke all on table public.scoring_configs from anon;
revoke all on table public.material_points from anon;
revoke all on table public.admin_settings from anon;
revoke all on table public.workshop_sessions from anon;
revoke all on table public.customers from anon;
revoke all on table public.staff_profiles from anon;
revoke all on table public.fragrance_products from anon;
revoke all on table public.product_qr_codes from anon;
revoke all on table public.qr_product_requests from anon;
revoke all on table public.notification_events from anon;

grant execute on function public.create_questionnaire_result(jsonb) to anon, authenticated;
grant execute on function public.update_questionnaire_result_by_token(text, text, jsonb) to anon, authenticated;
grant execute on function public.create_public_reservation(jsonb) to anon, authenticated;
grant execute on function public.fetch_reservation_by_code(text) to anon, authenticated;

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
  visit_type,
  guest_count,
  staff_memo,
  summary_headline,
  summary_body,
  profile_key,
  axes,
  updated_at
) on public.reservations to anon;
grant select (config_json, version, updated_at) on public.scoring_configs to anon;
grant select (id, material_code, material_name, category, point_axes, note, is_active, sort_order, updated_at) on public.material_points to anon;
grant select (id, slot_code, slot_date, slot_time, slot_label, instructor_name, status, sort_order, is_active) on public.reservation_slots to anon;
grant select (setting_key, setting_value, updated_at, is_public) on public.admin_settings to anon;
grant select (id, product_name) on public.fragrance_products to anon;
grant select (id, fragrance_product_id, qr_code, public_token, status, expires_at, inactive_reason) on public.product_qr_codes to anon;
grant insert (product_qr_code_id, fragrance_product_id, requester_email, quantity_10ml, quantity_30ml, status) on public.qr_product_requests to anon;

grant select, insert, update, delete on public.questionnaire_results to authenticated;
grant select, insert, update, delete on public.reservation_slots to authenticated;
grant select, insert, update, delete on public.reservations to authenticated;
grant select, insert, update, delete on public.scoring_configs to authenticated;
grant select, insert, update, delete on public.material_points to authenticated;
grant select, insert, update, delete on public.admin_settings to authenticated;
grant select, insert, update, delete on public.workshop_sessions to authenticated;
grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.staff_profiles to authenticated;
grant select, insert, update, delete on public.fragrance_products to authenticated;
grant select, insert, update, delete on public.product_qr_codes to authenticated;
grant select, insert, update, delete on public.qr_product_requests to authenticated;
grant select, insert, update, delete on public.notification_events to authenticated;
