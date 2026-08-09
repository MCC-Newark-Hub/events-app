-- Global audit log: who did what, when. Registrations already had a per-row
-- `timeline` field, but it was only populated by some mutation paths (e.g.
-- marking paid from ClerkView wrote nothing at all), and approvals' own
-- resolved_by/resolved_at were never surfaced anywhere in the UI. This table
-- is written to from every mutation in useAppData.js (see logAudit) so there's
-- one consistent, queryable record across registrations, members, approvals,
-- and app_users — independent of any one entity's own optional fields.
CREATE TABLE IF NOT EXISTS audit_log (
  id            bigserial PRIMARY KEY,
  created_at    timestamptz NOT NULL DEFAULT now(),
  actor_name    text,
  actor_id      integer,
  actor_role    text,
  action        text NOT NULL,
  entity_type   text NOT NULL,
  entity_id     text,
  entity_label  text,
  details       jsonb
);

CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx ON audit_log (actor_id);

-- Supabase enables RLS by default on newly created tables — every other table in
-- this schema predates that default and has it off (see migrations/README.md), so
-- this needs an explicit disable or every insert 401s with no policy defined.
ALTER TABLE audit_log DISABLE ROW LEVEL SECURITY;

-- Matches the grants already present on every other table.
GRANT ALL PRIVILEGES ON audit_log TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON SEQUENCE audit_log_id_seq TO anon, authenticated, service_role;
