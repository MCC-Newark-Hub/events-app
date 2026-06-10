-- Split name into first_name + last_name; add health/notes fields
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS first_name   text,
  ADD COLUMN IF NOT EXISTS last_name    text,
  ADD COLUMN IF NOT EXISTS allergies    text,
  ADD COLUMN IF NOT EXISTS special_needs text,
  ADD COLUMN IF NOT EXISTS notes        text;

-- Auto-populate from existing name column
UPDATE members
SET
  first_name = trim(split_part(name, ' ', 1)),
  last_name  = trim(substring(name FROM position(' ' IN name) + 1))
WHERE first_name IS NULL AND name IS NOT NULL AND name <> '';
