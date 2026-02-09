-- 005_status_updates.sql
begin;

create table if not exists public.status_updates (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  status text not null check (status in ('pending','in_progress','done','cancelled')),
  note text check (note is null or char_length(note) <= 1000),
  updated_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists idx_status_updates_task on public.status_updates(task_id);
create index if not exists idx_status_updates_created_at on public.status_updates(created_at desc);

commit;
