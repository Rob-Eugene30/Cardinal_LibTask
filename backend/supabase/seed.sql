-- seed.sql
begin;

insert into public.tags (name)
values
  ('Inventory'),
  ('Circulation'),
  ('Cataloging'),
  ('Reference'),
  ('Facilities')
on conflict (name) do nothing;

commit;
