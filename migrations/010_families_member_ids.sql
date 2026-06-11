-- Add member_ids array to families table (was missing from original schema)
ALTER TABLE families
  ADD COLUMN IF NOT EXISTS member_ids text[] DEFAULT '{}';

-- Add id defaults for both tables so client doesn't need to generate them
ALTER TABLE families
  ALTER COLUMN id SET DEFAULT ('F' || upper(substring(md5(random()::text) FROM 1 FOR 8)));

ALTER TABLE assistance_groups
  ALTER COLUMN id SET DEFAULT ('GA' || upper(substring(md5(random()::text) FROM 1 FOR 8)));
