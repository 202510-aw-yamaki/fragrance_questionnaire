alter table public.material_points
  add column if not exists tags jsonb not null default '[]'::jsonb;

grant select (id, material_code, material_name, category, point_axes, tags, note, is_active, sort_order, updated_at)
on public.material_points to anon;
