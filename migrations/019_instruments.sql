-- Instrument catalog (replaces hardcoded JS array in member form)
CREATE TABLE IF NOT EXISTS instruments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  sort_order int  DEFAULT 0
);
ALTER TABLE instruments DISABLE ROW LEVEL SECURITY;
GRANT ALL PRIVILEGES ON instruments TO anon, authenticated, service_role;

INSERT INTO instruments (name, sort_order) VALUES
  ('Violão',        0),
  ('Guitarra',      1),
  ('Baixo Elétrico',2),
  ('Bateria',       3),
  ('Percussão',     4),
  ('Teclado',       5),
  ('Piano',         6),
  ('Flauta',        7),
  ('Violino',       8),
  ('Trompete',      9),
  ('Saxofone',      10)
ON CONFLICT (name) DO NOTHING;
