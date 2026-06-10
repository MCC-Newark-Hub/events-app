-- Expand churches table: split "City, ST" display into individual fields
-- Keeps display column as the canonical short label (e.g. "Newark, NJ")

ALTER TABLE churches
  ADD COLUMN IF NOT EXISTS city          text,
  ADD COLUMN IF NOT EXISTS state_name    text,   -- full state name, e.g. "New Jersey"
  ADD COLUMN IF NOT EXISTS state_code    text,   -- 2-letter code, e.g. "NJ"
  ADD COLUMN IF NOT EXISTS country       text,   -- full country name, e.g. "United States"
  ADD COLUMN IF NOT EXISTS country_code  text,   -- 3-letter code, e.g. "EUA" | "CAN" | "BRA"
  ADD COLUMN IF NOT EXISTS address       text,   -- street address (optional)
  ADD COLUMN IF NOT EXISTS church_name   text;   -- official congregation name (optional)

-- Migrate any existing rows: split "City, ST" → city + state_code
-- and copy code → country_code
UPDATE churches SET
  city         = trim(split_part(display, ',', 1)),
  state_code   = trim(split_part(display, ',', 2)),
  country_code = code
WHERE city IS NULL AND display IS NOT NULL;
