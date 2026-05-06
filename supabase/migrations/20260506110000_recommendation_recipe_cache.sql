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

alter table public.recommendation_recipe_cache enable row level security;

drop policy if exists "staff select recommendation recipe cache" on public.recommendation_recipe_cache;
drop policy if exists "staff insert recommendation recipe cache" on public.recommendation_recipe_cache;
drop policy if exists "staff update recommendation recipe cache" on public.recommendation_recipe_cache;
drop policy if exists "manager recommendation recipe cache all" on public.recommendation_recipe_cache;

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

revoke all on table public.recommendation_recipe_cache from anon;
grant select, insert, update, delete on public.recommendation_recipe_cache to authenticated;
