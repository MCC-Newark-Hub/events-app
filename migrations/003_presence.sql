-- Presence tracking on registrations
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS presence text DEFAULT 'unknown';
  -- values: 'unknown' | 'present' | 'absent' | 'walk_in'

COMMENT ON COLUMN registrations.presence IS
  'unknown=not yet checked, present=attended, absent=no-show, walk_in=attended without prior registration';
