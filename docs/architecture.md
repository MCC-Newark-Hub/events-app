# Architecture

## System Overview

```
┌──────────────────────────────────────────────────────┐
│                     Vercel CDN                       │
│            master branch → production                │
│         feature branches → preview URLs             │
└──────────────────────┬───────────────────────────────┘
                       │ static SPA (HTML + JS bundle)
          ┌────────────▼────────────┐
          │     React 19 SPA        │
          │     Vite, no router     │
          │     view = string in    │
          │     App.jsx state       │
          └────────────┬────────────┘
                       │ Supabase JS v2 (REST + Realtime)
          ┌────────────▼────────────┐
          │       Supabase          │
          │   PostgreSQL 15         │
          │   Realtime (WS)         │
          │   Storage (unused)      │
          │   Auth (not used)       │
          └─────────────────────────┘
```

---

## Key Architectural Decisions

### No router — view state in App.jsx

Views are rendered with conditional JSX based on a `view` string in `useState`. There is no `react-router` or URL-based navigation. The only URL-driven state is two special query params handled at startup:

- `?checkin=<regNumber>` → skips auth, opens clerk check-in screen
- `?selfcheckin=<eventId>` → skips auth, opens self-service kiosk

**Why:** The app is a kiosk/desk tool used on shared devices. Stateful URLs would complicate session management and add no user value.

### PIN-based authentication (not Supabase Auth)

4-digit PINs are stored in the `app_users` table. `useAuth` validates the PIN client-side and stores the session in `localStorage` (`mcc_pin`, `mcc_view`). All users share the same Supabase anon key — there is no per-user JWT.

**Why:** Supabase Auth would require each clerk, pastor, and leader to have an account and manage credentials. PINs are simpler to administer for a church environment with high volunteer turnover.

### RLS disabled on all tables

Row Level Security is disabled on all 12 tables. Because all users share one anon key, RLS cannot distinguish between roles — it would either block everyone or allow everyone. Access control is enforced at the application layer (role-gated views, prop-drilling of permitted mutations).

**Consequence:** Anyone who obtains the anon key can read/write all data. This is acceptable for an internal church app where the key is never published. If Supabase Auth is ever adopted, RLS must be re-evaluated before re-enabling.

### Upfront data loading — full DB in memory

All 12 tables are loaded in a single `Promise.all` on mount in `useAppData`. No lazy loading, no pagination.

**Why:** At ~391 members and one event at a time, the full dataset is small (well under 1 MB). Loading everything upfront makes all queries instant and simplifies all downstream code.

### Optimistic UI everywhere

All mutations (register, pay, cancel, promote from waitlist, etc.) update local React state immediately, then fire the async Supabase write. The user sees the result instantly. DB errors are logged to the console and a toast is shown, but the UI is not rolled back.

**Why:** Desk clerks register 30+ people in a session. A 200–400 ms round-trip before each update would be noticeably slow.

### Derived state via `useMemo`

`activeRegs`, `wlRegs`, `exRegs`, `pendingApprovals`, `isFull`, and similar computed values are derived from raw `regs + event` state with `useMemo`. They are never stored redundantly.

### Sequence via `useRef`

The registration number sequence counter (`seqRef`) is a `useRef`, not `useState`. This avoids stale closure captures when `addReg` is called concurrently for family members in the same portal submission.

---

## Data Flow

```
useAppData (mount)
  └── Promise.all([
        supabase.from("events").select(),
        supabase.from("registrations").select(),
        supabase.from("members").select(),
        ...9 more tables
      ])
      └── sets raw state: event, regs, members, families, ...

useMemo (derived)
  ├── activeRegs   = regs where !cancelled && !waitlisted && !excedente
  ├── wlRegs       = regs where waitlisted
  ├── exRegs       = regs where excedente
  ├── isFull       = activeRegs.length >= event.capacity
  └── pendingApprovals = approvals where status === "pending"

Supabase Realtime (subscriptions)
  ├── registrations → INSERT/UPDATE → refreshes regs state
  └── approvals    → INSERT/UPDATE → refreshes approvals state
```

---

## Module Map

| Module | Responsibility |
|---|---|
| `App.jsx` | Session restore, view routing, lang state |
| `useAuth.js` | PIN validation, localStorage session |
| `useAppData.js` | All DB state, all mutations (`addReg`, `updateReg`, `resolveApproval`, …) |
| `constants/index.js` | Static reference data, fee helpers, role helpers |
| `i18n/strings.js` | All user-facing strings (PT-BR + EN) |
| `PublicPortal.jsx` | 4-step self-registration, confirmation screen |
| `RegistrationLookup.jsx` | Consultar Inscrição (lookup, cancel, add family) |
| `LoginScreen.jsx` | Landing: public register, lookup, PIN login |
| `AdminView.jsx` | Tabbed admin panel |
| `ClerkView.jsx` | Desk registration with capacity controls |
| `PastorView.jsx` | Approval queue |
| `CheckInScreen.jsx` | Clerk check-in by reg number |
| `SelfCheckInScreen.jsx` | QR-code self check-in kiosk |

---

## Registration Number

```
{EVENT_PREFIX}-{YYYYMMDD}-{sequence}
                              └── zero-padded 4 digits, per-event
```

Example: `MCC-20260615-0042`

Sequence is derived from the max existing reg number on mount, stored in `seqRef`, and incremented in `addReg`.

---

## Supabase Realtime

Two subscriptions are active while any role is logged in:

```js
supabase
  .channel("regs-changes")
  .on("postgres_changes", { event: "*", schema: "public", table: "registrations" }, handler)
  .subscribe()

supabase
  .channel("approvals-changes")
  .on("postgres_changes", { event: "*", schema: "public", table: "approvals" }, handler)
  .subscribe()
```

Both are cleaned up on unmount.
