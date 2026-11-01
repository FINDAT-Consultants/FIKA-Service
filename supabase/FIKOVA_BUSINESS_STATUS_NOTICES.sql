-- FIKova registration and status notices are generated transactionally by Postgres.
-- No client can forge status-transition notices or activate itself.
create or replace function public.fikova_automatic_business_notice()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  new_title text;
  new_body text;
  new_category text;
begin
  if tg_op = 'INSERT' then
    new_title := 'Registration received — awaiting FIKova approval';
    new_category := 'registration';
    new_body := 'Your FIKova business was registered successfully. Your account is pending until FIKova Management confirms your business registration and any manual payment. Contact FIKova for verified payment instructions, support, or other requests. You can prepare products while waiting, but they will remain hidden.';
  elsif old.status is distinct from new.status then
    if new.status='active' then
      new_title := 'FIKova business activated';
      new_category := 'activation';
      new_body := 'FIKova Management has activated your company. Published products may now appear in the public marketplace. Contact FIKova for support or any other requests.';
    elsif new.status='suspended' then
      new_title := 'Account suspended — payment or verification required';
      new_category := 'payment';
      new_body := 'Your FIKova business has been suspended and your products are hidden. Please contact FIKova Management for verified bank/mobile-money payment details, to confirm your payment, or to request assistance. Only FIKova Management can reactivate this account.';
    else
      new_title := 'Account under review';
      new_category := 'registration';
      new_body := 'Your FIKova business is pending verification. Contact FIKova Management for questions or registration requirements.';
    end if;
  else
    return new;
  end if;
  insert into public.fikova_business_notices(business_id,title,body,category,author_id)
  values(new.id,new_title,new_body,new_category,null);
  return new;
end; $$;
revoke all on function public.fikova_automatic_business_notice() from public,anon,authenticated;
create trigger fikova_automatic_notice_on_register
  after insert on public.fikova_businesses
  for each row execute function public.fikova_automatic_business_notice();
create trigger fikova_automatic_notice_on_status
  after update of status on public.fikova_businesses
  for each row execute function public.fikova_automatic_business_notice();
-- Limit direct public access to explicit storefront fields. Other columns remain owner/manager-only via RLS.
revoke select on public.fikova_businesses from anon;
grant select (id,business_name,phone,status) on public.fikova_businesses to anon;