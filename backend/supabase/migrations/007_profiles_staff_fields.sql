begin;

alter table public.profiles
  add column if not exists staff_code text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists address text,
  add column if not exists department text,
  add column if not exists job_title text,
  add column if not exists availability text not null default 'Available',
  add column if not exists employment_status text not null default 'Active',
  add column if not exists employee_since date;

alter table public.profiles
  drop constraint if exists profiles_availability_check,
  add constraint profiles_availability_check
    check (availability in ('On Duty', 'Available', 'Leave'));

alter table public.profiles
  drop constraint if exists profiles_employment_status_check,
  add constraint profiles_employment_status_check
    check (employment_status in ('Active', 'Inactive'));

create unique index if not exists idx_profiles_staff_code_unique
  on public.profiles(staff_code)
  where staff_code is not null;

create unique index if not exists idx_profiles_email_unique
  on public.profiles(email)
  where email is not null;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and (p.email is null or p.email = '');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'app_role', 'staff'),
    new.email
  )
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

commit;
