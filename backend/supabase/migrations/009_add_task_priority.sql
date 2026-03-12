begin;

alter table public.tasks
add column if not exists priority text not null default 'Medium'
check (priority in ('Low', 'Medium', 'High'));

create index if not exists idx_tasks_priority on public.tasks(priority);

commit;