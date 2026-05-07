create or replace function public.can_create_public_qr_product_request(
  p_product_qr_code_id uuid,
  p_fragrance_product_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.product_qr_codes pq
    join public.fragrance_products fp on fp.id = pq.fragrance_product_id
    where pq.id = p_product_qr_code_id
      and pq.fragrance_product_id = p_fragrance_product_id
      and pq.status = 'active'
      and pq.is_public = true
      and (pq.expires_at is null or pq.expires_at > now())
      and fp.status = 'published'
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
  and public.can_create_public_qr_product_request(product_qr_code_id, fragrance_product_id)
);

revoke all on function public.can_create_public_qr_product_request(uuid, uuid) from public;
grant execute on function public.can_create_public_qr_product_request(uuid, uuid) to anon, authenticated;
