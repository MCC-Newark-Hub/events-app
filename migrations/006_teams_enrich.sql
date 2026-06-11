-- Enrich the teams reference table with description, leader, and responsibilities
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS description      text,
  ADD COLUMN IF NOT EXISTS leader_id        text REFERENCES members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS responsibilities text;

COMMENT ON COLUMN teams.description      IS 'What this team does / purpose';
COMMENT ON COLUMN teams.leader_id        IS 'FK to members.id — the default leader of this team';
COMMENT ON COLUMN teams.responsibilities IS 'Free-text list of responsibilities or tasks';
