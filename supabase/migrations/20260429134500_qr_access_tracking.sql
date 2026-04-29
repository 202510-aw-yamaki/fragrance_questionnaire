create or replace function public.record_qr_product_access(p_token text)
returns table(
  id uuid,
  fragrance_product_id uuid,
  qr_code text,
  public_token text,
  status text,
  expires_at timestamptz,
  inactive_reason text,
  is_available boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text := btrim(coalesce(p_token, ''));
begin
  if v_token = '' then
    return;
  end if;

  return query
  with target_qr as (
    select pq.id
    from public.product_qr_codes pq
    where pq.is_public = true
      and (pq.public_token = v_token or pq.qr_code = v_token)
    order by pq.updated_at desc nulls last, pq.created_at desc nulls last
    limit 1
  )
  update public.product_qr_codes pq
  set
    access_count = pq.access_count + 1,
    last_accessed_at = now(),
    updated_at = now()
  from target_qr
  where pq.id = target_qr.id
  returning
    pq.id,
    pq.fragrance_product_id,
    pq.qr_code,
    pq.public_token,
    pq.status,
    pq.expires_at,
    pq.inactive_reason,
    (
      pq.status = 'active'
      and (pq.expires_at is null or pq.expires_at > now())
    ) as is_available;
end;
$$;

drop policy if exists "public select published fragrance products" on public.fragrance_products;
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
      and (pq.expires_at is null or pq.expires_at > now())
  )
);

drop policy if exists "public select active product qr codes" on public.product_qr_codes;
create policy "public select active product qr codes"
on public.product_qr_codes for select
to anon, authenticated
using (
  status = 'active'
  and is_public = true
  and (expires_at is null or expires_at > now())
);

grant execute on function public.record_qr_product_access(text) to anon, authenticated;
