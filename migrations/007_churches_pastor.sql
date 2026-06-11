ALTER TABLE churches
  ADD COLUMN IF NOT EXISTS pastor_id text REFERENCES members(id) ON DELETE SET NULL;

COMMENT ON COLUMN churches.pastor_id IS 'Lead pastor for this church — FK to members.id';
