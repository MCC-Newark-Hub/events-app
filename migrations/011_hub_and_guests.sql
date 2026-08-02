-- Flag which churches are part of the Newark Hub cluster, and let a
-- registration record who (if anyone) invited that participant.

ALTER TABLE churches
  ADD COLUMN IF NOT EXISTS is_hub boolean NOT NULL DEFAULT false;

UPDATE churches SET is_hub = true
WHERE display IN ('Newark, NJ', 'Philadelphia, PA', 'New York, NY', 'Toms River, NJ');

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS invited_by_member_id text REFERENCES members(id) ON DELETE SET NULL;
