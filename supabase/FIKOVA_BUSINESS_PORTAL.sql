-- FIKova Business Portal: dedicated tables inside the FINDAT Supabase project.
-- Inspired by Assurance Regent's governed company directory. The ADRA database is unchanged.
-- All browser-facing tables have RLS. Never expose service_role in the frontend.
create extension if not exists pgcrypto;

create table if not exists public.fikova_management_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  appointed_at timestamptz not null default now()
);
alter table public.fikova_management_users enable row level security;
create policy "Fikova manager sees own appointment" on public.fikova_management_users
  for select to authenticated using (user_id=(select auth.uid()));
revoke all on public.fikova_management_users from anon, authenticated;
grant select on public.fikova_management_users to authenticated;
grant all on public.fikova_management_users to service_role;

create table if not exists public.fikova_businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  code text not null unique default ('FKV-' || upper(left(replace(gen_random_uuid()::text,'-',''),8))),
  business_name text not null check (length(btrim(business_name)) between 2 and 120),
  owner_name text not null check (length(btrim(owner_name)) between 2 and 120),
  business_email text not null,
  phone text not null,
  category text not null default 'Other',
  location text not null default '',
  country_code text not null default 'ZM',
  currency text not null default 'ZMW',
  description text not null default '',
  logo_path text,
  status text not null default 'pending' check (status in ('pending','active','suspended')),
  registered_at timestamptz not null default now(),
  activated_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.fikova_businesses enable row level security;
create index if not exists fikova_businesses_status_idx on public.fikova_businesses(status, registered_at desc);
-- Business registration must be owned by the signed-in user and always start pending.
create policy "Fikova business owner registers pending company" on public.fikova_businesses
  for insert to authenticated
  with check (owner_id=(select auth.uid()) and status='pending' and activated_at is null);
create policy "Fikova business owner reads own company" on public.fikova_businesses
  for select to authenticated using (owner_id=(select auth.uid()));
create policy "Fikova manager reads all companies" on public.fikova_businesses
  for select to authenticated using (
    exists(select 1 from public.fikova_management_users m where m.user_id=(select auth.uid()))
  );
-- Active store data intentionally public (business email/phone are business contacts, not private login credentials).
create policy "Fikova active businesses publicly listed" on public.fikova_businesses
  for select to anon, authenticated using (status='active');
-- Only Management may modify a company after registration.
create policy "Fikova management edits businesses" on public.fikova_businesses
  for update to authenticated
  using (exists(select 1 from public.fikova_management_users m where m.user_id=(select auth.uid())))
  with check (exists(select 1 from public.fikova_management_users m where m.user_id=(select auth.uid())));

create table if not exists public.fikova_business_billing (
  business_id uuid primary key references public.fikova_businesses(id) on delete cascade,
  monthly_amount numeric(12,2) not null default 0 check (monthly_amount>=0),
  payment_currency text not null default 'ZMW',
  bank_or_mobile_instructions text not null default '',
  billing_message text not null default '',
  next_due_date date,
  last_verified_payment_at timestamptz,
  verified_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);
alter table public.fikova_business_billing enable row level security;
create policy "Fikova management handles billing" on public.fikova_business_billing
  for all to authenticated
  using (exists(select 1 from public.fikova_management_users m where m.user_id=(select auth.uid())))
  with check (exists(select 1 from public.fikova_management_users m where m.user_id=(select auth.uid())));
create policy "Fikova business owner sees own billing" on public.fikova_business_billing
  for select to authenticated using (
    exists(select 1 from public.fikova_businesses b where b.id=business_id and b.owner_id=(select auth.uid()))
  );

create table if not exists public.fikova_products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.fikova_businesses(id) on delete cascade,
  name text not null check (length(btrim(name)) between 2 and 140),
  category text not null default 'Other',
  description text not null default '',
  price numeric(14,2) not null check (price>0),
  currency text not null default 'ZMW',
  photo_paths text[] not null default '{}',
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.fikova_products enable row level security;
create index if not exists fikova_products_business_idx on public.fikova_products(business_id);
create policy "Fikova public sees only active business products" on public.fikova_products
  for select to anon, authenticated
  using (published and exists(select 1 from public.fikova_businesses b where b.id=business_id and b.status='active'));
create policy "Fikova owner sees own products" on public.fikova_products
  for select to authenticated using (exists(select 1 from public.fikova_businesses b where b.id=business_id and b.owner_id=(select auth.uid())));
create policy "Fikova owner creates own products" on public.fikova_products
  for insert to authenticated with check (exists(select 1 from public.fikova_businesses b where b.id=business_id and b.owner_id=(select auth.uid())));
create policy "Fikova owner edits own products" on public.fikova_products
  for update to authenticated
  using (exists(select 1 from public.fikova_businesses b where b.id=business_id and b.owner_id=(select auth.uid())))
  with check (exists(select 1 from public.fikova_businesses b where b.id=business_id and b.owner_id=(select auth.uid())));
create policy "Fikova owner removes own products" on public.fikova_products
  for delete to authenticated using (exists(select 1 from public.fikova_businesses b where b.id=business_id and b.owner_id=(select auth.uid())));
create policy "Fikova managers control products" on public.fikova_products
  for all to authenticated
  using (exists(select 1 from public.fikova_management_users m where m.user_id=(select auth.uid())))
  with check (exists(select 1 from public.fikova_management_users m where m.user_id=(select auth.uid())));

create table if not exists public.fikova_business_notices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.fikova_businesses(id) on delete cascade,
  title text not null,
  body text not null,
  category text not null default 'general' check (category in ('general','registration','payment','activation','suspension')),
  author_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.fikova_business_notices enable row level security;
create index if not exists fikova_business_notices_business_idx on public.fikova_business_notices(business_id,created_at desc);
create policy "Fikova management reads notices" on public.fikova_business_notices
  for select to authenticated using (exists(select 1 from public.fikova_management_users m where m.user_id=(select auth.uid())));
create policy "Fikova owner reads own notices" on public.fikova_business_notices
  for select to authenticated using (exists(select 1 from public.fikova_businesses b where b.id=business_id and b.owner_id=(select auth.uid())));
create policy "Fikova management sends notices" on public.fikova_business_notices
  for insert to authenticated with check (
    author_id=(select auth.uid()) and exists(select 1 from public.fikova_management_users m where m.user_id=(select auth.uid()))
  );

create table if not exists public.fikova_admin_audit (
  id bigint generated always as identity primary key,
  business_id uuid references public.fikova_businesses(id) on delete set null,
  actor_id uuid,
  event_type text not null,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.fikova_admin_audit enable row level security;
create policy "Fikova management sees audit trail" on public.fikova_admin_audit
  for select to authenticated using (exists(select 1 from public.fikova_management_users m where m.user_id=(select auth.uid())));

-- Database audit is generated by triggers, not by untrusted frontend values.
create or replace function public.fikova_audit_company_status()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if old.status is distinct from new.status then
    insert into public.fikova_admin_audit (business_id,actor_id,event_type,detail)
    values(new.id,(select auth.uid()),'company_status_changed',
      jsonb_build_object('from',old.status,'to',new.status));
  end if;
  return new;
end; $$;
create trigger fikova_log_status after update of status on public.fikova_businesses
  for each row execute function public.fikova_audit_company_status();

create or replace function public.fikova_audit_notice()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.fikova_admin_audit(business_id,actor_id,event_type,detail)
  values (new.business_id,(select auth.uid()),'notice_sent',jsonb_build_object('category',new.category,'title',new.title));
  return new;
end; $$;
create trigger fikova_log_notice after insert on public.fikova_business_notices
  for each row execute function public.fikova_audit_notice();
revoke all on function public.fikova_audit_company_status() from public,anon,authenticated;
revoke all on function public.fikova_audit_notice() from public,anon,authenticated;

create table if not exists public.fikova_contact_settings (
  singleton boolean primary key default true check (singleton),
  whatsapp text not null default '',
  email text not null default '',
  payment_help text not null default 'Contact FIKova Management for verified bank or mobile-money payment instructions.',
  updated_at timestamptz not null default now()
);
alter table public.fikova_contact_settings enable row level security;
insert into public.fikova_contact_settings(singleton) values(true) on conflict do nothing;
create policy "Fikova public reads official contacts" on public.fikova_contact_settings
  for select to anon,authenticated using(true);
create policy "Fikova management updates official contacts" on public.fikova_contact_settings
  for update to authenticated
  using(exists(select 1 from public.fikova_management_users m where m.user_id=(select auth.uid())))
  with check(exists(select 1 from public.fikova_management_users m where m.user_id=(select auth.uid())));

-- Image bucket is deliberately public: shop product photos are public marketing assets.
-- Upload/update/delete operations remain restricted to authenticated owners under their own user ID folder.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('fikova-product-images','fikova-product-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy "Fikova business photo uploads" on storage.objects
  for insert to authenticated with check(
    bucket_id='fikova-product-images'
    and (storage.foldername(name))[1]=(select auth.uid())::text
    and exists(select 1 from public.fikova_businesses b where b.owner_id=(select auth.uid()))
  );
create policy "Fikova business photo update" on storage.objects
  for update to authenticated
  using(bucket_id='fikova-product-images' and (storage.foldername(name))[1]=(select auth.uid())::text)
  with check(bucket_id='fikova-product-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Fikova business photo delete" on storage.objects
  for delete to authenticated
  using(bucket_id='fikova-product-images' and (storage.foldername(name))[1]=(select auth.uid())::text);

-- RLS is necessary but insufficient without Data API grants.
grant select on public.fikova_businesses,public.fikova_products,public.fikova_contact_settings to anon;
grant select,insert,update on public.fikova_businesses to authenticated;
grant select,insert,update,delete on public.fikova_products to authenticated;
grant select,insert,update on public.fikova_business_billing to authenticated;
grant select,insert on public.fikova_business_notices to authenticated;
grant select on public.fikova_admin_audit to authenticated;
grant select,update on public.fikova_contact_settings to authenticated;
grant usage,select on sequence public.fikova_admin_audit_id_seq to authenticated;

-- MANAGEMENT BOOTSTRAP (manually, once the intended Manager signs up at FIKova):
-- insert into public.fikova_management_users(user_id)
-- select id from auth.users where lower(email)=lower('management@example.com')
-- on conflict do nothing;
