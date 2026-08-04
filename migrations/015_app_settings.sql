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

-- Matches the grants already present on every other table (RLS stays disabled
-- app-wide per migrations/README.md).
GRANT ALL PRIVILEGES ON app_settings TO anon, authenticated, service_role;
