create or replace function public.add_business_days(p_start timestamptz, p_days integer)
returns timestamptz
language plpgsql
stable
as $$
declare
  v_result timestamptz := p_start;
  v_added integer := 0;
begin
  while v_added < greatest(p_days, 0) loop
    v_result := v_result + interval '1 day';
    if extract(isodow from v_result) between 1 and 5 then
      v_added := v_added + 1;
    end if;
  end loop;
  return v_result;
end;
$$;

create or replace function public.set_qr_product_request_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.availability_due_at is null then
    new.availability_due_at := public.add_business_days(now(), 3);
  end if;
  if new.email_retention_until is null then
    new.email_retention_until := (new.availability_due_at::date + interval '6 months')::date;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_set_qr_product_request_defaults on public.qr_product_requests;
create trigger trg_set_qr_product_request_defaults
before insert on public.qr_product_requests
for each row execute function public.set_qr_product_request_defaults();

create or replace function public.create_qr_product_request_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staff_id uuid;
  v_product_name text;
begin
  select fp.created_by_staff_id, fp.product_name
  into v_staff_id, v_product_name
  from public.fragrance_products fp
  where fp.id = new.fragrance_product_id;

  insert into public.notification_events (
    event_type,
    target_role,
    target_staff_id,
    related_table,
    related_id,
    payload
  )
  values (
    'qr_product_requested',
    'staff',
    v_staff_id,
    'qr_product_requests',
    new.id,
    jsonb_build_object(
      'request_code', new.request_code,
      'fragrance_product_id', new.fragrance_product_id,
      'product_qr_code_id', new.product_qr_code_id,
      'product_name', v_product_name,
      'quantity_10ml', new.quantity_10ml,
      'quantity_30ml', new.quantity_30ml,
      'total_volume_ml', new.total_volume_ml,
      'availability_due_at', new.availability_due_at
    )
  );
  return new;
end;
$$;

drop trigger if exists trg_create_qr_product_request_notification on public.qr_product_requests;
create trigger trg_create_qr_product_request_notification
after insert on public.qr_product_requests
for each row execute function public.create_qr_product_request_notification();

insert into public.admin_settings (setting_key, setting_value, is_public)
values (
  'qr_product_public_settings',
  jsonb_build_object(
    'price_10ml', 1000,
    'price_30ml', 2860,
    'max_volume_ml', 100,
    'shop_phone', '03-1234-5678',
    'business_hours', '11:00〜19:00'
  ),
  true
)
on conflict (setting_key) do nothing;
