# MCC Newark — Event Registration System

A full-featured event registration and management app for **Igreja Cristã Maranatha (ICM) Newark** and its affiliated congregations across the US and Canada. Handles self-registration, waitlists, fee tracking, team assignments, badge printing, and QR-code check-in.

---

## Features

**Public portal**
- Self-registration in 4 steps: member search → family → health info → contact & terms
- Family grouping — register multiple members in a single submission
- Bilingual interface (Portuguese / English)
- Terms of acceptance with payment deadline acknowledgement
- Consultar Inscrição — look up a registration by number or name, cancel it, or add a family member

**Registration desk (Clerk)**
- Search, register, and manage participants
- Capacity enforcement with automatic waitlist
- Over-capacity ("excedente") flow with pastor approval
- Fee payment tracking; auto-exempt for Pastors and Ungidos
- Real-time sync between multiple clerk stations

**Admin**
- Event and fee configuration (per age category)
- Payment deadline with auto-cancel logic (family/team exemptions)
- Member directory CRUD (members, families, assistance groups, churches, teams)
- CSV bulk import
- Badge printing (PDF via html2canvas + jsPDF)
- Registrations report with bulk delete

**Pastor / GA Leader / Team Leader views**
- Pastor: approve/deny capacity override requests
- GA Leader: view and manage their assistance group registrations
- Team Leader: manage their team roster

**Check-in**
- Clerk check-in via URL param (`?checkin=<regNumber>`)
- Participant self check-in kiosk via QR code (`?selfcheckin=<eventId>`)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 |
| Backend / DB | Supabase (PostgreSQL + Supabase JS v2) |
| Hosting | Vercel |
| Icons | lucide-react |
| PDF / Badges | html2canvas + jsPDF |
| QR codes | qrcode |
| Tests | Vitest + @testing-library/react |

---

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A [Supabase](https://supabase.com/) project (free tier is sufficient)

---

## Getting Started

```bash
# 1. Clone
git clone https://github.com/leonard-alves/mcc-newark-events.git
cd mcc-newark-events

# 2. Install dependencies
npm install

# 3. Configure environment variables (see section below)
cp .env.example .env.local

# 4. Start the dev server
npm run dev
```

---

## Environment Variables

Create a `.env.local` file at the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key-here
```

Both values are found in your Supabase project under **Settings → API**.

> **Note:** The app uses PIN-based authentication (not Supabase Auth). All users share the same anon key. Row Level Security is disabled on all tables — access control is enforced at the application layer.

---

## Database Setup

The schema lives in the `migrations/` folder. Run each file **in order** using the Supabase SQL editor or `psql`.

```
migrations/
  001_member_fields.sql       — Adds first_name, last_name, allergies, special_needs to members
  002_teams_table.sql         — Creates teams reference table
  003_presence.sql            — Adds presence column to registrations
  004_checkin_fields.sql      — Adds checked_in_at and checkin_method to registrations
  005_churches_schema.sql     — Expands churches table with city/state/country fields
  006_teams_enrich.sql        — Adds description, leader, and responsibilities to teams
  007_churches_pastor.sql     — Adds pastor_id FK to churches
  008_member_roles.sql        — Adds roles[] array to members
  009_id_defaults.sql         — Auto-generates IDs for assistance_groups and families
  010_families_member_ids.sql — Adds member_ids[] array to families
```

Each migration is idempotent (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`) — re-running is safe.

### Tables

| Table | Purpose |
|---|---|
| `events` | Event details, fees by category, capacity, registration prefix |
| `registrations` | Registration records with all status flags |
| `members` | Member directory (name, category, church, role, family_id, ga_id) |
| `families` | Family groups |
| `assistance_groups` | GA (Grupo de Assistência) groups |
| `approvals` | Capacity override / exemption requests |
| `rosters` | Team assignments per event |
| `churches` | Church list (overrides the built-in constant when populated) |
| `app_users` | PIN-authenticated users with system roles |
| `categories` | Age categories (overrides built-in constant when populated) |
| `functions` | Ministry roles (overrides built-in constant when populated) |
| `teams` | Service teams (overrides built-in constant when populated) |

---

## Project Structure

```
src/
├── App.jsx                     # Root — session restore, view routing
├── index.css                   # All styles (CSS custom properties for theming)
├── constants/index.js          # Roles, categories, churches, fee helpers
├── i18n/strings.js             # PT-BR and EN string table
├── lib/supabase.js             # Supabase client
├── hooks/
│   ├── useAppData.js           # Central data hook — all state + mutations
│   └── useAuth.js              # PIN login/logout
├── views/
│   ├── LoginScreen.jsx         # Landing — public register, lookup, PIN login
│   ├── PublicPortal.jsx        # 4-step self-registration flow + confirmation
│   ├── RegistrationLookup.jsx  # Consultar Inscrição (lookup, cancel, add family)
│   ├── CheckInScreen.jsx       # Clerk check-in (?checkin=<regNumber>)
│   ├── SelfCheckInScreen.jsx   # Self check-in kiosk (?selfcheckin=<eventId>)
│   ├── AdminView.jsx           # Full admin panel (tabbed)
│   ├── ClerkView.jsx
│   ├── PastorView.jsx
│   ├── GALeaderView.jsx
│   ├── TeamLeaderView.jsx
│   └── admin/
│       ├── BadgesTab.jsx
│       ├── EventsTab.jsx
│       ├── RegistrationsTab.jsx
│       ├── ReportsTab.jsx
│       └── TeamsTab.jsx
├── components/
│   └── ApprovalsPanel, BadgePrint, CapBar, ChurchSearch,
│       DetailModal, FeeBox, ICMLogo, Modal, PinLogin,
│       RegModal, Sidebar, StatusBadge, Topbar
└── test/
    ├── constants.test.js       # fmt, daysSince, isDeadlineExempt, deadlineStatus, church helpers
    └── registration.test.js    # mapReg, extractBatchId, dateFromRegNumber, getRegStatus
```

---

## Authentication & Roles

Authentication uses 4-digit PINs stored in the `app_users` table. Sessions are persisted in `localStorage`.

| Role | View | Access |
|---|---|---|
| `admin` | AdminView | Full access — events, registrations, directory, reports, badges |
| `clerk` | ClerkView | Register participants, manage payments and check-in |
| `pastor` | PastorView | Approve/deny capacity override requests |
| `ga_leader` | GALeaderView | View and manage their assistance group |
| `team_leader` | TeamLeaderView | Manage their team roster |

Public users (no PIN) can self-register via the portal and look up their registration.

---

## Registration Number Format

```
{EVENT_PREFIX}-{YYYYMMDD}-{0001}
```

Example: `MCC-20260615-0042`

---

## Available Scripts

```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build locally
npm run test         # Run tests (Vitest)
npm run test:watch   # Run tests in watch mode
npm run lint         # ESLint
npm run format       # Prettier (src/**/*.{js,jsx})
```

---

## Testing

```bash
npm test
```

41 tests across two files covering core helpers, data mapping, and status logic. Tests do not require a live Supabase connection.

---

## Deployment

The app is hosted on [Vercel](https://vercel.com/). The `master` branch deploys automatically to production.

**Required environment variables in Vercel:**

| Variable | Environment |
|---|---|
| `VITE_SUPABASE_URL` | Production + Preview |
| `VITE_SUPABASE_KEY` | Production + Preview |

**Staging setup (optional):** Create a second Supabase project, run all migrations on it, then configure the **Preview** environment in Vercel to point to the staging project. Feature branches will then deploy against staging data automatically.

---

## Special URL Parameters

| URL | Purpose |
|---|---|
| `?checkin=MCC-20260615-0042` | Opens the clerk check-in screen for that reg number |
| `?selfcheckin=<eventId>` | Opens the self-service QR check-in kiosk |

These bypass PIN auth entirely, enabling kiosk and QR-code use cases.

---

## License

Private — internal use by Igreja Cristã Maranatha Newark. Not licensed for redistribution.
