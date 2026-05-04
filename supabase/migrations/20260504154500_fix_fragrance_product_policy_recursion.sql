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

drop policy if exists "public select published fragrance products" on public.fragrance_products;
create policy "public select published fragrance products"
on public.fragrance_products for select
to anon, authenticated
using (
  status = 'published'
  and public.has_active_public_product_qr(id)
);

drop policy if exists "staff product qr codes own" on public.product_qr_codes;
create policy "staff product qr codes own"
on public.product_qr_codes for all
to authenticated
using (
  public.can_current_staff_access_fragrance_product(fragrance_product_id)
)
with check (
  public.can_current_staff_access_fragrance_product(fragrance_product_id)
);

grant execute on function public.has_active_public_product_qr(uuid) to anon, authenticated;
grant execute on function public.can_current_staff_access_fragrance_product(uuid) to authenticated;
