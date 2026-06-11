-- Migration 008: Add roles array column to members
-- Keeps the old role column for backward compatibility.

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS roles text[] DEFAULT '{}';

-- Migrate existing single role to array
UPDATE members
  SET roles = ARRAY[role]
  WHERE role IS NOT NULL AND role <> '' AND roles = '{}';
