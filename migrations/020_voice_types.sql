-- Voice type catalog with note ranges
CREATE TABLE IF NOT EXISTS voice_types (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text    NOT NULL UNIQUE,
  gender     text    NOT NULL DEFAULT 'F' CHECK (gender IN ('F','M')),
  min_note   text    NOT NULL,
  max_note   text    NOT NULL,
  sort_order int     DEFAULT 0
);
ALTER TABLE voice_types DISABLE ROW LEVEL SECURITY;
GRANT ALL PRIVILEGES ON voice_types TO anon, authenticated, service_role;

INSERT INTO voice_types (name, gender, min_note, max_note, sort_order) VALUES
  ('Soprano',       'F', 'B3', 'C6', 0),
  ('Mezzo-Soprano', 'F', 'A3', 'A5', 1),
  ('Contralto',     'F', 'F3', 'E5', 2),
  ('Tenor',         'M', 'C3', 'A4', 3),
  ('Barítono',      'M', 'A2', 'F4', 4),
  ('Baixo',         'M', 'E2', 'D4', 5)
ON CONFLICT (name) DO NOTHING;

-- Member voice range columns
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS voice_lowest_note  text,
  ADD COLUMN IF NOT EXISTS voice_highest_note text;
