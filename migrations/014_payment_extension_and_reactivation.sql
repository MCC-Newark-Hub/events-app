-- Payment-deadline extension and reactivation of cancelled registrations.
--
-- deadline_extended_to: an explicit per-registration override date, set either when
-- staff extends an active-but-approaching-deadline registration, or when a cancelled
-- registration is reactivated (which always needs a fresh deadline — reusing the
-- original earliest-attempt date would make it instantly overdue again).
--
-- cancel_reason: why a registration was cancelled, so reports can filter reliably
-- instead of parsing free-text notes. NULL for cancellations unrelated to payment.
--   'nonpayment_auto'   — cancelled by the scheduled job past the grace period
--   'nonpayment_manual' — cancelled by staff via the existing bulk "Atrasados" flow
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS deadline_extended_to date,
  ADD COLUMN IF NOT EXISTS cancel_reason text;

-- Per-event default length, in days, for a reactivated registration's new deadline.
-- Deliberately shorter than payment_deadline_days' default (7) — reactivation is a
-- second chance, not a full reset. Pastor/Admin can still enter a custom date at the
-- moment of reactivation/extension, overriding this default.
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS payment_extension_days integer NOT NULL DEFAULT 5;
