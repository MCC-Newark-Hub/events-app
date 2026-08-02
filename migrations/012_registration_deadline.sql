-- Registration cutoff date per event, plus the fields approvals need so a
-- late-registration request can actually be turned into a real registration
-- once a pastor approves it (previously submitApproval didn't persist these).

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS registration_deadline date;

-- reg_id/fee/role were already referenced by submitApproval/resolveApproval but never
-- actually existed on this table, so every approval submission has been failing with a
-- 400 (PGRST204) this whole time. Adding them here since the late-registration flow
-- extends this same code path and can't work on top of a broken insert.
ALTER TABLE approvals
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS church text,
  ADD COLUMN IF NOT EXISTS badge_name text,
  ADD COLUMN IF NOT EXISTS team text,
  ADD COLUMN IF NOT EXISTS note text,
  ADD COLUMN IF NOT EXISTS pastor_note text,
  ADD COLUMN IF NOT EXISTS reg_id uuid REFERENCES registrations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS fee numeric,
  ADD COLUMN IF NOT EXISTS role text;
