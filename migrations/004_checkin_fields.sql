-- Add check-in timestamp and method to registrations
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS checked_in_at  timestamptz,
  ADD COLUMN IF NOT EXISTS checkin_method text;
  -- checkin_method values: 'manual' | 'qr_clerk' | 'self'
