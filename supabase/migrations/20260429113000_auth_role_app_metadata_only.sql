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
