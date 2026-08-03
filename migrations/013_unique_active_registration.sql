-- Nothing in the app enforced this server-side: every "already registered"
-- check was client-side UI filtering (RegModal, PublicPortal,
-- RegistrationLookup, TeamsTab's bulk-register loop), keyed on whatever the
-- browser's local `regs` state happened to hold at the time. That let a
-- member end up with two active registrations for the same event (seen in
-- production with member M013, one from the TeamsTab bulk-assign flow and
-- one from a normal manual add).
--
-- member_id is excluded for 'GUEST' rows, which have no real member behind
-- them and are expected to repeat. Cancelled registrations are excluded so
-- the existing cancel-then-re-register flow (RegistrationLookup) keeps
-- working — cancelled rows are kept as history, not deleted.
CREATE UNIQUE INDEX IF NOT EXISTS registrations_active_member_event_uidx
  ON registrations (member_id, event_id)
  WHERE cancelled = false AND member_id <> 'GUEST';
