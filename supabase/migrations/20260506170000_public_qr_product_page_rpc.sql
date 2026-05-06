create or replace function public.fetch_qr_product_public_page(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_qr record;
  v_product_id uuid;
  v_product_name text;
  v_product_tags jsonb;
begin
  select *
  into v_qr
  from public.record_qr_product_access(p_token)
  limit 1;

  if not found then
    return null;
  end if;

  if coalesce(v_qr.is_available, false) then
    select
      fp.id,
      fp.product_name,
      fp.product_tags
    into
      v_product_id,
      v_product_name,
      v_product_tags
    from public.fragrance_products fp
    where fp.id = v_qr.fragrance_product_id
      and fp.status = 'published'
    limit 1;
  end if;

  return jsonb_build_object(
    'qrCode', jsonb_build_object(
      'id', v_qr.id,
      'fragrance_product_id', v_qr.fragrance_product_id,
      'qr_code', v_qr.qr_code,
      'public_token', v_qr.public_token,
      'status', v_qr.status,
      'expires_at', v_qr.expires_at,
      'inactive_reason', v_qr.inactive_reason,
      'is_available', v_qr.is_available
    ),
    'product', case
      when v_product_id is null then null
      else jsonb_build_object(
        'id', v_product_id,
        'product_name', v_product_name,
        'product_tags', coalesce(v_product_tags, '[]'::jsonb)
      )
    end
  );
end;
$$;

revoke all on function public.fetch_qr_product_public_page(text) from public;
grant execute on function public.fetch_qr_product_public_page(text) to anon, authenticated;
