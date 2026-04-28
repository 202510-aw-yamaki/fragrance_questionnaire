create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  template_key text not null,
  recipient_email text not null,
  related_table text,
  related_id uuid,
  status text not null default 'queued' check (status in ('queued', 'mocked', 'sent', 'failed', 'cancelled')),
  subject text,
  payload jsonb not null default '{}'::jsonb,
  send_after timestamptz default now(),
  sent_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  retention_until date,
  pii_anonymized_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_email_events_status on public.email_events(status);
create index if not exists idx_email_events_related on public.email_events(related_table, related_id);

create or replace function public.create_qr_product_request_email_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_name text;
begin
  select fp.product_name
  into v_product_name
  from public.fragrance_products fp
  where fp.id = new.fragrance_product_id;

  insert into public.email_events (
    event_type,
    template_key,
    recipient_email,
    related_table,
    related_id,
    status,
    subject,
    payload,
    retention_until
  )
  values (
    'qr_request_received',
    'qr_request_received_v1',
    new.requester_email,
    'qr_product_requests',
    new.id,
    'queued',
    '香水の作成依頼を受け付けました',
    jsonb_build_object(
      'request_code', new.request_code,
      'fragrance_product_id', new.fragrance_product_id,
      'product_qr_code_id', new.product_qr_code_id,
      'product_name', v_product_name,
      'quantity_10ml', new.quantity_10ml,
      'quantity_30ml', new.quantity_30ml,
      'total_volume_ml', new.total_volume_ml,
      'availability_due_at', new.availability_due_at
    ),
    new.email_retention_until
  );
  return new;
end;
$$;

drop trigger if exists trg_create_qr_product_request_email_event on public.qr_product_requests;
create trigger trg_create_qr_product_request_email_event
after insert on public.qr_product_requests
for each row execute function public.create_qr_product_request_email_event();

alter table public.email_events enable row level security;

drop policy if exists "staff select email events own" on public.email_events;
drop policy if exists "manager email events all" on public.email_events;
create policy "staff select email events own"
on public.email_events for select
to authenticated
using (
  public.is_staff_member()
  and related_table = 'qr_product_requests'
  and exists (
    select 1
    from public.qr_product_requests qpr
    join public.fragrance_products fp on fp.id = qpr.fragrance_product_id
    where qpr.id = email_events.related_id
      and fp.created_by_staff_id = public.current_staff_profile_id()
  )
);
create policy "manager email events all"
on public.email_events for all
to authenticated
using (public.is_manager())
with check (public.is_manager());

revoke all on table public.email_events from anon;
grant select, insert, update, delete on public.email_events to authenticated;
