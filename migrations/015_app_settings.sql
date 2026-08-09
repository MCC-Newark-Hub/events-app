-- Global app settings, single-row table (id always 1). Currently just the PIN
-- session TTL, admin-configurable from Usuários & PINs — was previously
-- hardcoded to 8h in App.jsx.
CREATE TABLE IF NOT EXISTS app_settings (
  id                smallint PRIMARY KEY DEFAULT 1,
  session_ttl_hours numeric NOT NULL DEFAULT 2,
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_settings_singleton CHECK (id = 1)
);

INSERT INTO app_settings (id, session_ttl_hours)
VALUES (1, 2)
ON CONFLICT (id) DO NOTHING;

-- Supabase enables RLS by default on newly created tables — every other table in
-- this schema predates that default and has it off (see migrations/README.md).
-- This was missed originally: the table silently 401'd on every write from the
-- day it shipped (Aug 4) until caught and fixed here (Aug 9) — the admin-facing
-- "save" always reported success because the UI never re-read the row back from
-- the DB to confirm, it trusted its own optimistic state. See migration 017's
-- note in README for the general fix to that verification gap.
ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;

-- Matches the grants already present on every other table.
GRANT ALL PRIVILEGES ON app_settings TO anon, authenticated, service_role;
