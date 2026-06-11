-- Add default ID generation for tables that use text IDs without defaults
-- This lets INSERT work without specifying an id

ALTER TABLE assistance_groups
  ALTER COLUMN id SET DEFAULT ('GA' || upper(substring(md5(random()::text) FROM 1 FOR 6)));

ALTER TABLE families
  ALTER COLUMN id SET DEFAULT ('F' || upper(substring(md5(random()::text) FROM 1 FOR 6)));
