# Database Migrations

Run these files **in order** using the Supabase SQL editor (or `psql`).

| File | Description |
|------|-------------|
| `001_member_fields.sql` | Adds `first_name`, `last_name`, `allergies`, `special_needs`, `notes` columns to `members`. Auto-populates first/last name from existing `name` values. |
| `002_teams_table.sql` | Creates a `teams` domain table to replace the hardcoded JS array. Seeds the 13 standard teams. |
| `003_presence.sql` | Adds a `presence` column to `registrations` (`unknown` / `present` / `absent` / `walk_in`). |

## How to run

1. Open your Supabase project → **SQL Editor**
2. Paste and run `001_member_fields.sql`
3. Paste and run `002_teams_table.sql`
4. Paste and run `003_presence.sql`

Each migration is idempotent (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`) so re-running is safe.
