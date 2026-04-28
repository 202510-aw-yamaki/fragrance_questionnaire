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
