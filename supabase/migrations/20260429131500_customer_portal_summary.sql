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
        'summary_headline', r.summary_headline,
        'profile_key', r.profile_key,
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
  where fp.customer_id = v_customer_id;

  return jsonb_build_object(
    'customer', v_customer,
    'reservations', v_reservations,
    'products', v_products
  );
end;
$$;

grant execute on function public.fetch_customer_portal_summary() to authenticated;
