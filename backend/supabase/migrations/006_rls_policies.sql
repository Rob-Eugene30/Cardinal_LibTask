-- 006_rls_policies.sql
begin;

-- Helper: is current user admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.tags enable row level security;
alter table public.task_tags enable row level security;
alter table public.status_updates enable row level security;

-- PROFILES policies
drop policy if exists "profiles: self read" on public.profiles;
create policy "profiles: self read"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles: self update" on public.profiles;
create policy "profiles: self update"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- TASKS policies
drop policy if exists "tasks: staff read own assigned" on public.tasks;
create policy "tasks: staff read own assigned"
on public.tasks
for select
to authenticated
using (public.is_admin() or assigned_to = auth.uid());

drop policy if exists "tasks: admin insert" on public.tasks;
create policy "tasks: admin insert"
on public.tasks
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "tasks: admin update" on public.tasks;
create policy "tasks: admin update"
on public.tasks
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "tasks: admin delete" on public.tasks;
create policy "tasks: admin delete"
on public.tasks
for delete
to authenticated
using (public.is_admin());

-- TAGS policies
drop policy if exists "tags: read all" on public.tags;
create policy "tags: read all"
on public.tags
for select
to authenticated
using (true);

drop policy if exists "tags: admin write" on public.tags;
create policy "tags: admin write"
on public.tags
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "tags: admin update" on public.tags;
create policy "tags: admin update"
on public.tags
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "tags: admin delete" on public.tags;
create policy "tags: admin delete"
on public.tags
for delete
to authenticated
using (public.is_admin());

-- TASK_TAGS policies (tagging tasks)
drop policy if exists "task_tags: read own tasks or admin" on public.task_tags;
create policy "task_tags: read own tasks or admin"
on public.task_tags
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.tasks t
    where t.id = task_id
      and t.assigned_to = auth.uid()
  )
);

drop policy if exists "task_tags: admin write" on public.task_tags;
create policy "task_tags: admin write"
on public.task_tags
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "task_tags: admin delete" on public.task_tags;
create policy "task_tags: admin delete"
on public.task_tags
for delete
to authenticated
using (public.is_admin());

-- STATUS_UPDATES policies
drop policy if exists "status_updates: read own tasks or admin" on public.status_updates;
create policy "status_updates: read own tasks or admin"
on public.status_updates
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.tasks t
    where t.id = task_id
      and t.assigned_to = auth.uid()
  )
);

drop policy if exists "status_updates: admin insert" on public.status_updates;
create policy "status_updates: admin insert"
on public.status_updates
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "status_updates: admin delete" on public.status_updates;
create policy "status_updates: admin delete"
on public.status_updates
for delete
to authenticated
using (public.is_admin());

commit;
