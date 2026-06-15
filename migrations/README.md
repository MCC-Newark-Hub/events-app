# Database Migrations

Run these files **in order** using the Supabase SQL editor or `psql`. Each migration is idempotent (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`) — re-running is safe.

| File | Description |
|---|---|
| `001_member_fields.sql` | Adds `first_name`, `last_name`, `allergies`, `special_needs`, `notes` to `members`. Auto-populates first/last name from existing `name` values. |
| `002_teams_table.sql` | Creates `teams` reference table; seeds the 13 standard service teams. |
| `003_presence.sql` | Adds `presence` column to `registrations` (`unknown` / `present` / `absent` / `walk_in`). |
| `004_checkin_fields.sql` | Adds `checked_in_at` (timestamptz) and `checkin_method` (`manual` / `qr_clerk` / `self`) to `registrations`. |
| `005_churches_schema.sql` | Expands `churches` table with `city`, `state`, `country`, `region` fields; keeps the `display` column as canonical short label. |
| `006_teams_enrich.sql` | Adds `description`, `leader_id` (FK → members), and `responsibilities` to `teams`. |
| `007_churches_pastor.sql` | Adds `pastor_id` (FK → members) to `churches`. |
| `008_member_roles.sql` | Adds `roles text[]` array to `members` for multi-role support; keeps legacy `role` column for compatibility. |
| `009_id_defaults.sql` | Adds auto-generated ID defaults for `assistance_groups` and `families` so clients don't need to supply IDs on insert. |
| `010_families_member_ids.sql` | Adds `member_ids text[]` to `families`; adds ID defaults for both `families` and `assistance_groups`. |

## How to run

1. Open your Supabase project → **SQL Editor**
2. Run each file in numerical order (001 → 010)

## Notes

- Migrations assume the base schema (all 12 core tables) already exists. The base schema is created separately via the Supabase dashboard or a seed script.
- Row Level Security is disabled on all tables. If Supabase Auth is ever added, re-evaluate RLS policies before re-enabling.
