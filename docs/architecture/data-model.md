# Architecture: Data Model

## Entity relationships

```
events (1)
  └──< registrations (N)    via event_id
         ├── member_id       → members.id  (nullable — "GUEST" for unverified)
         ├── family_id       → families.id (nullable — portal regs always null)
         └── timeline[]      jsonb array of {status, note, timestamp, by}

members (1)
  ├──< registrations (N)    via member_id
  ├── family_id             → families.id
  ├── ga_id                 → assistance_groups.id
  └── roles text[]          (multiple ministry roles)

families (1)
  ├──< registrations (N)    via family_id
  ├── member_ids text[]     (denormalized — kept in sync with members.family_id)
  └──< members (N)          via family_id

assistance_groups (1)
  ├──< members (N)          via ga_id
  └── leader_id             → members.id

approvals (N)
  ├── event_id              → events.id
  └── reg_id                → registrations.id

rosters (N)
  ├── event_id              → events.id
  └── member_id             → members.id

churches (N)
  └── pastor_id             → members.id

app_users                   standalone (no FK relations)
categories                  standalone reference table
functions                   standalone reference table (ministry roles)
teams                       standalone reference table
```

---

## Table definitions

### events

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | UUID default |
| `name` | text | Display name |
| `date` | text | YYYY-MM-DD |
| `time` | text | HH:MM (24h) |
| `location` | text | Free text |
| `prefix` | text | Used in reg numbers |
| `capacity` | integer | Max active registrations |
| `fees` | jsonb | `{"Adulto": 50, "Jovem": 40, ...}` |
| `payment_deadline_days` | integer | Days until informal deadline |

### registrations

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | |
| `event_id` | text FK → events | |
| `member_id` | text | FK to members or `"GUEST"` |
| `member_name` | text | Denormalized — snapshot at registration time |
| `badge_name` | text | Short name for badge; falls back to member_name |
| `category` | text | Age category snapshot |
| `church` | text | Church snapshot |
| `role` | text | Ministry role snapshot |
| `family_id` | text FK → families | Nullable; portal regs always null |
| `team` | text | Default: `"Participante"` |
| `fee` | numeric | Calculated from event.fees[category] |
| `paid` | boolean | |
| `exempt` | boolean | |
| `cancelled` | boolean | |
| `waitlisted` | boolean | |
| `waitlist_reason` | text | |
| `excedente` | boolean | |
| `needs_translation` | boolean | |
| `note` | text | Contains batch token `[B{ts}]` + contact info |
| `badge_printed` | boolean | |
| `timeline` | jsonb | `[{status, note, timestamp, by}, ...]` |
| `reg_number` | text | `PREFIX-YYYYMMDD-NNNN` |
| `registered_at` | timestamptz | |
| `registered_by` | text | Staff name or "Portal" |
| `checked_in_at` | timestamptz | |
| `checkin_method` | text | `manual` / `qr_clerk` / `self` |
| `presence` | text | `unknown` / `present` / `absent` / `walk_in` |

### members

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | |
| `name` | text | Full display name |
| `first_name` | text | Added in migration 001 |
| `last_name` | text | Added in migration 001 |
| `category` | text | Age category |
| `church` | text | |
| `role` | text | Primary ministry role (legacy) |
| `roles` | text[] | All ministry roles (added in migration 008) |
| `gender` | text | `M` / `F` |
| `family_id` | text FK → families | |
| `ga_id` | text FK → assistance_groups | |
| `allergies` | text | Added in migration 001 |
| `special_needs` | text | Added in migration 001 |

### families

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | Auto-generated (migration 010) |
| `name` | text | e.g. "Família Silva" |
| `member_ids` | text[] | Denormalized member list (migration 010) |

### assistance_groups

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | Auto-generated (`GA` + 6 hex chars) |
| `name` | text | |
| `leader_id` | text FK → members | |

### app_users

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | |
| `name` | text | Display name in top bar |
| `pin` | text | 4-digit PIN (plain text) |
| `role` | text | `admin` / `clerk` / `pastor` / `ga_leader` / `team_leader` |

---

## Key design notes

**Denormalized snapshots on registrations:** `member_name`, `category`, `church`, `role` are copied from the member record at registration time. This means:
- Registration data doesn't change if the member directory is updated later
- Reporting is accurate as of the registration date
- Downside: clerk must manually update the registration if the member's details change

**Batch token in `note`:** Portal registrations always start with `[B{timestamp}]` in the `note` field. This groups family members from the same submission for Consultar Inscrição. The `family_id` FK is not used for portal registrations because no `families` row is created during the portal flow.

**`member_id = "GUEST"`:** Unverified members (added manually in the portal or at the desk) use the literal string `"GUEST"` rather than a FK to `members`. This distinguishes them in reporting and prevents FK constraint violations.

---

## Related

- [Architecture: Overview](overview.md)
- [Architecture: Integrations](integrations.md)
- [Explanation: Registration Rules](../explanation/registration-rules.md)
