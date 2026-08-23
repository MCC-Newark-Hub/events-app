-- Disable RLS on teams (was never done in 002/006 — updates were silently blocked)
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
GRANT ALL PRIVILEGES ON teams TO anon, authenticated, service_role;

-- Add Tesouraria team that was in the JS constant but missing from the seed
INSERT INTO teams (name, sort_order, is_service) VALUES
  ('Tesouraria', 13, true)
ON CONFLICT (name) DO NOTHING;

-- Also fix functions + categories tables if they exist
ALTER TABLE functions  DISABLE ROW LEVEL SECURITY;
GRANT ALL PRIVILEGES ON functions  TO anon, authenticated, service_role;

ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
GRANT ALL PRIVILEGES ON categories TO anon, authenticated, service_role;
