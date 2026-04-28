create or replace function public.qr_product_public_max_volume_ml()
returns integer
language sql
stable
set search_path = public
as $$
  select coalesce(
    (
      select greatest((setting_value ->> 'max_volume_ml')::integer, 1)
      from public.admin_settings
      where setting_key = 'qr_product_public_settings'
        and is_public = true
        and (setting_value ->> 'max_volume_ml') ~ '^[0-9]+$'
      order by updated_at desc
      limit 1
    ),
    100
  );
$$;

drop policy if exists "public insert qr product requests" on public.qr_product_requests;
create policy "public insert qr product requests"
on public.qr_product_requests for insert
to anon, authenticated
with check (
  status = 'requested'
  and requester_email = btrim(requester_email)
  and requester_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  and total_volume_ml > 0
  and total_volume_ml <= public.qr_product_public_max_volume_ml()
  and exists (
    select 1
    from public.product_qr_codes pq
    join public.fragrance_products fp on fp.id = pq.fragrance_product_id
    where pq.id = product_qr_code_id
      and pq.fragrance_product_id = fragrance_product_id
      and pq.status = 'active'
      and pq.is_public = true
      and (pq.expires_at is null or pq.expires_at > now())
      and fp.status = 'published'
  )
);

grant execute on function public.qr_product_public_max_volume_ml() to anon, authenticated;
