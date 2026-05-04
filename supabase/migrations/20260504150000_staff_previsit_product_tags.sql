alter table public.workshop_sessions
add column if not exists previsit_recipe_items jsonb not null default '[]'::jsonb;

alter table public.workshop_sessions
add column if not exists previsit_recipe_axes jsonb;

alter table public.fragrance_products
add column if not exists product_tags jsonb not null default '[]'::jsonb;

insert into public.admin_settings (setting_key, setting_value, is_public)
values (
  'qr_product_public_settings',
  jsonb_build_object(
    'price_10ml', 1000,
    'price_30ml', 2860,
    'max_volume_ml', 100,
    'shop_phone', '03-1234-5678',
    'business_hours', '11:00〜19:00',
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
  setting_value = case
    when public.admin_settings.setting_value ? 'product_tags'
      then public.admin_settings.setting_value
    else public.admin_settings.setting_value || jsonb_build_object('product_tags', excluded.setting_value->'product_tags')
  end,
  is_public = true,
  updated_at = now();

grant select (id, product_name, product_tags) on public.fragrance_products to anon;
