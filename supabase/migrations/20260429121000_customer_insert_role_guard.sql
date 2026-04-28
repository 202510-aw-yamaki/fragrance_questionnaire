drop policy if exists "customer insert own profile" on public.customers;
create policy "customer insert own profile"
on public.customers for insert
to authenticated
with check (
  auth_user_id = auth.uid()
  and coalesce(public.portal_role_from_session(), 'customer') in ('customer', 'member')
);
