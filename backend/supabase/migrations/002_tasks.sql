-- 002_tasks.sql
begin;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  description text,
  due_date date,

  created_by uuid not null references public.profiles(id) on delete restrict,
  assigned_to uuid not null references public.profiles(id) on delete restrict,

  status text not null default 'pending'
    check (status in ('pending','in_progress','done','cancelled')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tasks_assigned_to on public.tasks(assigned_to);
create index if not exists idx_tasks_created_by on public.tasks(created_by);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_created_at on public.tasks(created_at desc);

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

commit;
