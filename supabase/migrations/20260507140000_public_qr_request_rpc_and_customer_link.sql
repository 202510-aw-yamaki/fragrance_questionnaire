create or replace function public.create_public_qr_product_request(p_payload jsonb)
returns public.qr_product_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text := btrim(coalesce(p_payload ->> 'token', p_payload ->> 'public_token', p_payload ->> 'qr_code', ''));
  v_requester_email text := lower(btrim(coalesce(p_payload ->> 'requester_email', '')));
  v_quantity_10ml integer := coalesce(nullif(p_payload ->> 'quantity_10ml', '')::integer, 0);
  v_quantity_30ml integer := coalesce(nullif(p_payload ->> 'quantity_30ml', '')::integer, 0);
  v_total_volume_ml integer := 0;
  v_max_volume_ml integer := public.qr_product_public_max_volume_ml();
  v_qr public.product_qr_codes;
  v_product public.fragrance_products;
  v_request public.qr_product_requests;
begin
  if v_token = '' then
    raise exception 'QR token is required.' using errcode = '22023';
  end if;

  if v_requester_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'A valid requester email is required.' using errcode = '22023';
  end if;

  if v_quantity_10ml < 0 or v_quantity_30ml < 0 then
    raise exception 'QR request quantities must be zero or greater.' using errcode = '22023';
  end if;

  v_total_volume_ml := (v_quantity_10ml * 10) + (v_quantity_30ml * 30);
  if v_total_volume_ml <= 0 then
    raise exception 'QR request quantity is required.' using errcode = '22023';
  end if;

  if v_total_volume_ml > v_max_volume_ml then
    raise exception 'QR request quantity exceeds the maximum volume.' using errcode = '22023';
  end if;

  select pq.*
  into v_qr
  from public.product_qr_codes pq
  where pq.public_token = v_token
     or pq.qr_code = v_token
  limit 1;

  if v_qr.id is null
    or not public.can_create_public_qr_product_request(v_qr.id, v_qr.fragrance_product_id) then
    raise exception 'QR product page is not available.' using errcode = 'P0002';
  end if;

  select fp.*
  into v_product
  from public.fragrance_products fp
  where fp.id = v_qr.fragrance_product_id
  limit 1;

  if v_product.id is null or v_product.status <> 'published' then
    raise exception 'QR product is not available.' using errcode = 'P0002';
  end if;

  insert into public.qr_product_requests (
    product_qr_code_id,
    fragrance_product_id,
    requester_email,
    quantity_10ml,
    quantity_30ml,
    status
  )
  values (
    v_qr.id,
    v_product.id,
    v_requester_email,
    v_quantity_10ml,
    v_quantity_30ml,
    'requested'
  )
  returning *
  into v_request;

  return v_request;
end;
$$;

create or replace function public.fetch_customer_portal_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_customer_id uuid := public.current_customer_profile_id();
  v_customer jsonb := null;
  v_reservations jsonb := '[]'::jsonb;
  v_products jsonb := '[]'::jsonb;
begin
  if v_customer_id is null then
    return jsonb_build_object(
      'customer', null,
      'reservations', v_reservations,
      'products', v_products
    );
  end if;

  select jsonb_build_object(
    'id', c.id,
    'customer_code', c.customer_code,
    'email', c.email,
    'display_name', c.display_name,
    'status', c.status
  )
  into v_customer
  from public.customers c
  where c.id = v_customer_id
  limit 1;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'reservation_code', r.reservation_code,
        'slot_label', r.slot_label,
        'visit_type', r.visit_type,
        'guest_count', r.guest_count,
        'summary_headline', r.summary_headline,
        'profile_key', r.profile_key,
        'status', r.status,
        'created_at', r.created_at,
        'updated_at', r.updated_at
      )
      order by coalesce(r.updated_at, r.created_at) desc
    ),
    '[]'::jsonb
  )
  into v_reservations
  from public.reservations r
  where r.customer_id = v_customer_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', fp.id,
        'product_name', fp.product_name,
        'status', fp.status,
        'reservation_id', fp.reservation_id,
        'questionnaire_result_id', fp.questionnaire_result_id,
        'final_axes', fp.final_axes,
        'visit_date', rs.slot_date,
        'slot_label', coalesce(rs.slot_label, r.slot_label),
        'staff_name', coalesce(sp.display_name, sp.staff_name, rs.instructor_name),
        'summary_headline', r.summary_headline,
        'profile_key', r.profile_key,
        'qr_public_token', active_qr.public_token,
        'created_at', fp.created_at,
        'updated_at', fp.updated_at
      )
      order by coalesce(fp.updated_at, fp.created_at) desc
    ),
    '[]'::jsonb
  )
  into v_products
  from public.fragrance_products fp
  left join public.reservations r on r.id = fp.reservation_id
  left join public.reservation_slots rs on rs.id = r.slot_id
  left join public.staff_profiles sp on sp.id = fp.created_by_staff_id
  left join lateral (
    select pq.public_token
    from public.product_qr_codes pq
    where pq.fragrance_product_id = fp.id
      and pq.status = 'active'
      and pq.is_public = true
      and (pq.expires_at is null or pq.expires_at > now())
    order by coalesce(pq.issued_at, pq.created_at) desc
    limit 1
  ) active_qr on true
  where fp.customer_id = v_customer_id;

  return jsonb_build_object(
    'customer', v_customer,
    'reservations', v_reservations,
    'products', v_products
  );
end;
$$;

revoke all on function public.create_public_qr_product_request(jsonb) from public;
grant execute on function public.create_public_qr_product_request(jsonb) to anon, authenticated;

revoke select on public.fragrance_products from anon;
revoke select (id, product_name, product_tags) on public.fragrance_products from anon;
revoke select on public.product_qr_codes from anon;
revoke select (id, fragrance_product_id, qr_code, public_token, status, expires_at, inactive_reason) on public.product_qr_codes from anon;
revoke insert on public.qr_product_requests from anon;
revoke insert (product_qr_code_id, fragrance_product_id, requester_email, quantity_10ml, quantity_30ml, status) on public.qr_product_requests from anon;
