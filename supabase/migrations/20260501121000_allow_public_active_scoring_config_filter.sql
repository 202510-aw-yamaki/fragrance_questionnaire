grant select (config_json, version, updated_at, is_active) on public.scoring_configs to anon;

notify pgrst, 'reload schema';
