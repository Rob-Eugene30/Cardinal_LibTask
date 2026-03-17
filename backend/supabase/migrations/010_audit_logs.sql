create table audit_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid,
    action text not null,
    entity_type text not null,
    entity_id uuid,
    old_data jsonb,
    new_data jsonb,
    created_at timestamptz default now()
);

create index idx_audit_entity
on audit_logs(entity_type, entity_id);

create index idx_audit_created
on audit_logs(created_at desc);