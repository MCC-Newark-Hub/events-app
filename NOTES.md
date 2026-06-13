# MCC Newark Events — Project Notes

## App Purpose

Event registration and management app for **ICM Newark** (Igreja Cristã Maranatha). Handles participant sign-ups for church events across 15 US/Canada congregations, with capacity enforcement, waitlists, fee tracking, team rostering, and badge printing.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Vite + React 19, no router |
| Backend / DB | Supabase (Postgres + Supabase JS v2) |
| Hosting | Vercel |
| Icons | lucide-react |
| PDF/badges | html2canvas + jspdf |
| QR codes | qrcode |
| Tests | Vitest + @testing-library/react |
| UI language | Portuguese (Brazilian), hardcoded `lang = "pt"` |

---

## Folder Structure

```
src/
  App.jsx                    # Root: session restore, view routing
  index.css                  # All styles (CSS vars for theming)
  constants/index.js         # Roles, categories, churches, helpers
  i18n/strings.js            # i18n PT/EN strings
  lib/supabase.js            # Supabase client (sb)
  hooks/
    useAppData.js            # Central data hook — all state + mutations
    useAuth.js               # PIN login/logout
  views/
    LoginScreen.jsx
    PublicPortal.jsx         # 4-step self-registration flow
    CheckInScreen.jsx        # URL-param: ?checkin=<regNumber>
    SelfCheckInScreen.jsx    # URL-param: ?selfcheckin=<eventId>
    AdminView.jsx            # Full admin panel (1773 lines)
    ClerkView.jsx
    PastorView.jsx
    GALeaderView.jsx
    TeamLeaderView.jsx
    admin/
      BadgesTab.jsx
      EventsTab.jsx
      RegistrationsTab.jsx
      ReportsTab.jsx
      TeamsTab.jsx
  components/
    ApprovalsPanel, BadgePrint, CapBar, ChurchSearch
    DetailModal, FeeBox, ICMLogo, Modal, PinLogin
    RegModal, Sidebar, StatusBadge, Topbar
  dev/seeds.js
migrations/
  001–010 SQL migrations
```

---

## Key Architectural Decisions

### No router — view state in App.jsx
Views are rendered with conditional JSX based on a `view` string state. URL params (`?checkin=` and `?selfcheckin=`) bypass auth entirely for kiosk/QR use cases.

### PIN-based auth (no Supabase auth)
4-digit PINs stored in `app_users` table. Session persisted via `localStorage` (`mcc_pin`, `mcc_view`). `useAuth` handles login/logout. `userRef` pattern avoids stale closure in `useAppData`.

### Upfront data loading
All 12 tables loaded in a single `Promise.all` on mount in `useAppData`. No lazy loading, no pagination — entire DB in memory. Works fine at current data scale.

### Optimistic UI everywhere
All mutations update local React state immediately, then fire Supabase async. Errors are logged but not surfaced to the user (silent failure on DB errors).

### Derived state via `useMemo`
`activeRegs`, `wlRegs`, `exRegs`, `pendingApprovals`, `isFull` are memos off `regs + event`.

---

## Business Logic

### Roles
- **System roles** (for login/views): `admin`, `clerk`, `pastor`, `ga_leader`, `team_leader`
- **Church roles** (on members/regs): 30+ ministry roles (Pastor, Ungido, Diácono, Obreiro, Grupo de Louvor, etc.)

### Auto-exempt
Pastors and Ungidos are automatically fee-exempt on registration (`addReg`) and when role is updated (`updateReg`).

### Deadline exemptions (`isDeadlineExempt`)
A reg is exempt from payment deadline if: already paid/exempt/cancelled/waitlisted, role is an Obreiro role, assigned to a service team, or belongs to a family that has an obreiro or service team member.

### Capacity flow
1. Event has a `capacity` number
2. `isFull = activeCount >= capacity`
3. When full: new regs go to **waitlist** automatically (unless exempt)
4. Clerk can force **excedente** (over-capacity) — triggers approval workflow
5. Pastor approves/denies capacity overrides via `ApprovalsPanel`
6. Cancellations notify clerk if there's a waitlisted person

### Registration number format
`{event.prefix}-{YYYYMMDD}-{0001}` — sequence tracked in `seq` state, derived from max reg number on load.

### Public Portal (4-step flow)
1. Search member + phone/email + translation needs
2. Add family members (verified from DB or manual unverified)
3. Health info (allergies, special needs)
4. Terms acceptance + submit

---

## Database Schema (12 tables)

| Table | Purpose |
|-------|---------|
| `events` | Event details, fees by category, capacity, prefix |
| `registrations` | Core reg records with all status flags |
| `members` | Member directory (name, category, church, role, family_id, ga_id) |
| `families` | Family groups with `member_ids[]` |
| `assistance_groups` | GA (Grupo de Assistência) groups |
| `approvals` | Capacity override / exemption requests |
| `rosters` | Team rosters per event |
| `churches` | Church list (overrides `CHURCH_LIST` constant if populated) |
| `app_users` | PIN-authenticated users with system roles |
| `categories` | Age categories (overrides `CATEGORIES` constant if populated) |
| `functions` | Ministry roles (overrides `ROLE_OPTIONS` if populated) |
| `teams` | Service teams (overrides `TEAMS` constant if populated) |

Migrations in `migrations/001–010`.

---

## What's Working

- Full registration flow (public portal + admin desk)
- Capacity enforcement with waitlist and excedente
- Pastor approval workflow
- Fee tracking with auto-exempt for Pastor/Ungido
- Payment deadline tracking with family/team exemptions
- Badge printing (html2canvas → PDF)
- QR code check-in (`?checkin=` and `?selfcheckin=` URL params)
- CSV bulk import (members, families, GA, teams, churches)
- Directory CRUD (churches, members, families, GA, rosters, teams)
- PIN user management
- Role-based view routing
- Session persistence across page reloads
- Dark/light theme toggle
- Bilingual UI (PT/EN strings in `i18n/strings.js`)

---

## Recently Fixed (session 2026-06-13)

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Public portal "Nenhum membro encontrado" | `LoginScreen` rendered its own internal `PublicPortal` with `SAMPLE_EVENT` and no `members`/`regs`/`addReg` props — bypassing App.jsx entirely | Wired "Fazer minha inscrição" button to `onPublicRegister` callback → App.jsx renders the real PublicPortal with live data |
| Family registration 409 Conflict | `famId = "FAM-" + Date.now()` violated FK constraint `registrations_family_id_fkey` (must reference `families.id`) | Set `famId = null` in portal submit — family grouping on confirmation screen uses the `regs` array directly |
| Registration sequence duplicates | `addReg` read stale `seq` state in concurrent family submissions | Replaced `seq` state reads with `seqRef.current` (useRef) for always-current value |
| Pastor/Ungido not auto-exempt on role change | `updateReg` didn't apply exempt/fee=0 when role was updated to Pastor/Ungido | Added `autoExempt` object merged into the updated reg when role is Pastor/Ungido |
| Admin directory column filters caused crash | `FilterTh` factory pattern broke React hook rules | Refactored to `makeTh` helper, removed per-column filter inputs (global search still works) |
| Admin bulk delete missing | No way to delete multiple registrations at once | Added checkbox column + bulk delete button with confirmation modal in RegistrationsTab |

---

## Known Issues / Pending

| Issue | Notes |
|-------|-------|
| `teams` table returns 401 | Supabase RLS blocks anon reads on the `teams` table — add `CREATE POLICY "anon_read" ON teams FOR SELECT USING (true);` or disable RLS |
| Vercel deployment broken | Prod env has wrong `VITE_SUPABASE_KEY` — update in Vercel Dashboard → Settings → Environment Variables, then redeploy |
| `promoteFromWaitlist` no DB write | Only updates local state; DB record stays `waitlisted=true` — needs `sb.from("registrations").update(...)` call |
| No real-time updates | Two clerks editing simultaneously will diverge — no Supabase subscriptions |
| Silent DB errors | Most query errors log to console only; users see no feedback on failure |

---

## Known Patterns / Gotchas

- `CHURCH_LIST` constant is the fallback — DB `churches` table overrides it if populated
- Same for `categories`, `functions`, `teams` tables overriding their constants
- `mapReg` uses `reg.presence || 'unknown'` — presence can be `present`, `absent`, or `unknown`
- `member_id: "GUEST"` is used for unverified/manual registrants
- `registrations.family_id` is a FK to `families.id` — do NOT use temp string IDs here
- Optimistic temp IDs: `"tmp-" + n` for regs, `"tmp-apr-" + Date.now()` for approvals
- `seqRef.current` (not `seq` state) is the authoritative sequence counter in `addReg`
- `submitApproval` embeds `Date.now()` in a tmp id — fine since it's replaced after DB insert

---

## Next Steps (pick what to tackle)

1. **Fix `teams` RLS** — quick Supabase SQL fix; unblocks teams data loading
2. **Fix Vercel deployment** — update `VITE_SUPABASE_KEY` in Vercel env vars + redeploy
3. **Fix `promoteFromWaitlist` DB write** — ~5 line fix in `useAppData.js`
4. **Real-time sync** — Supabase subscriptions so two clerks stay in sync
5. **Error feedback** — surface DB errors to users instead of silent console logs
6. **Test coverage** — vitest setup exists but coverage is unknown
