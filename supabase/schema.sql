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

alter table public.questionnaire_results enable row level security;
alter table public.reservation_slots enable row level security;
alter table public.reservations enable row level security;
alter table public.scoring_configs enable row level security;
alter table public.material_points enable row level security;
alter table public.admin_settings enable row level security;

drop policy if exists "public select active scoring config" on public.scoring_configs;
create policy "public select active scoring config"
on public.scoring_configs for select
to anon, authenticated
using (is_active = true);

drop policy if exists "public select open reservation slots" on public.reservation_slots;
create policy "public select open reservation slots"
on public.reservation_slots for select
to anon, authenticated
using (is_active = true and status in ('open', 'recommended'));

drop policy if exists "public select active material points" on public.material_points;
create policy "public select active material points"
on public.material_points for select
to anon, authenticated
using (is_active = true);

drop policy if exists "public insert questionnaire results" on public.questionnaire_results;
create policy "public insert questionnaire results"
on public.questionnaire_results for insert
to anon, authenticated
with check (true);

drop policy if exists "public update questionnaire results" on public.questionnaire_results;
create policy "public update questionnaire results"
on public.questionnaire_results for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "public insert reservations" on public.reservations;
create policy "public insert reservations"
on public.reservations for insert
to anon, authenticated
with check (true);

drop policy if exists "public select reservations by code" on public.reservations;
create policy "public select reservations by code"
on public.reservations for select
to anon, authenticated
using (reservation_code is not null);

drop policy if exists "admin reservation slots all" on public.reservation_slots;
create policy "admin reservation slots all"
on public.reservation_slots for all
to authenticated
using (true)
with check (true);

drop policy if exists "admin reservations all" on public.reservations;
create policy "admin reservations all"
on public.reservations for all
to authenticated
using (true)
with check (true);

drop policy if exists "admin scoring configs all" on public.scoring_configs;
create policy "admin scoring configs all"
on public.scoring_configs for all
to authenticated
using (true)
with check (true);

drop policy if exists "admin material points all" on public.material_points;
create policy "admin material points all"
on public.material_points for all
to authenticated
using (true)
with check (true);

drop policy if exists "admin settings all" on public.admin_settings;
create policy "admin settings all"
on public.admin_settings for all
to authenticated
using (true)
with check (true);
