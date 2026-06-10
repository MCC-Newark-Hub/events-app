-- Domain table for teams (replaces hardcoded JS array)
CREATE TABLE IF NOT EXISTS teams (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  sort_order int  DEFAULT 0,
  is_service boolean DEFAULT true
);

-- Seed with current hardcoded values (keep same order)
INSERT INTO teams (name, sort_order, is_service) VALUES
  ('Participante',    0,  false),
  ('Pastores',        1,  true),
  ('Ungidos',         2,  true),
  ('Diáconos',        3,  true),
  ('Grupo de Louvor', 4,  true),
  ('Cozinha',         5,  true),
  ('Limpeza',         6,  true),
  ('Secretaria',      7,  true),
  ('Segurança',       8,  true),
  ('Som & Projeção',  9,  true),
  ('Tradução',        10, true),
  ('Transporte',      11, true),
  ('Professoras',     12, true)
ON CONFLICT (name) DO NOTHING;
