begin;

alter table public.tasks
  drop constraint if exists tasks_status_check;

alter table public.tasks
  add constraint tasks_status_check
  check (status in ('pending', 'in_progress', 'done', 'on_hold', 'cancelled'));

alter table public.status_updates
  drop constraint if exists status_updates_status_check;

alter table public.status_updates
  add constraint status_updates_status_check
  check (status in ('pending', 'in_progress', 'done', 'on_hold', 'cancelled'));

update public.tasks
set status = case
  when status = 'blocked' then 'on_hold'
  when status = 'completed' then 'done'
  when status = 'assigned' then 'pending'
  else status
end
where status in ('blocked', 'completed', 'assigned');

update public.status_updates
set status = case
  when status = 'blocked' then 'on_hold'
  when status = 'completed' then 'done'
  when status = 'assigned' then 'pending'
  else status
end
where status in ('blocked', 'completed', 'assigned');

commit;
