# RLS notes (defense-in-depth)

Even if your FastAPI enforces "staff can only read their tasks", it's still recommended
to enforce Row Level Security (RLS) in Supabase for extra protection.

Typical approach:
- Enable RLS on tables
- Staff policies restrict SELECT to:
  - tasks.assigned_to = auth.uid()
  - status_updates.task_id belongs to a task assigned to auth.uid()
- Admin policies can be implemented via:
  - custom claim in JWT (e.g., user_metadata.app_role = 'admin')
  - a profiles table lookup (profiles.app_role = 'admin')

This repo includes `006_rls_policies.sql` to document/implement those policies.
