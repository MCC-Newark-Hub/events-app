# Architecture: Overview

## System diagram

```
┌───────────────────────────────────────────────────────────┐
│                        Vercel CDN                         │
│   master → production   |   feature/* → preview URL      │
└──────────────────────────────┬────────────────────────────┘
                               │ static HTML + JS bundle
               ┌───────────────▼───────────────┐
               │         React 19 SPA           │
               │         Vite 8, no router      │
               │                                │
               │  ┌─────────────────────────┐  │
               │  │      App.jsx            │  │
               │  │  view = string state    │  │
               │  │  lang = "pt" | "en"     │  │
               │  └────────────┬────────────┘  │
               │               │               │
               │  ┌────────────▼────────────┐  │
               │  │     useAppData.js       │  │
               │  │  all state + mutations  │  │
               │  │  optimistic UI          │  │
               │  └────────────┬────────────┘  │
               └───────────────┼───────────────┘
                               │ Supabase JS v2
               ┌───────────────▼───────────────┐
               │           Supabase            │
               │   PostgreSQL 15 (12 tables)   │
               │   REST API (PostgREST)        │
               │   Realtime (WebSocket)        │
               └───────────────────────────────┘
```

---

## Key architectural decisions

| Decision | What | Why |
|---|---|---|
| No router | View state = a `view` string in `App.jsx` | Kiosk/shared-device use case; URL navigation adds no value |
| PIN auth | 4-digit PINs in `app_users`, `localStorage` session | Simpler than Supabase Auth for volunteer staff |
| RLS disabled | All 12 tables have RLS off | PIN auth shares one anon key; RLS cannot distinguish roles |
| Upfront loading | All data loaded in `Promise.all` on mount | ~391 members, one event — dataset fits comfortably in memory |
| Optimistic UI | State updated before DB write | Desk clerks need instant feedback; 200–400 ms round-trips are noticeable |
| `useRef` for sequence | `seqRef` instead of `seq` state | Avoids stale closure in concurrent `addReg` calls for family submissions |
| Batch token | `[B{ts}]` in `note` field | Groups family members from the same portal submission without needing the `family_id` FK |

Full rationale for each is in the [ADRs](../adrs/).

---

## View routing

```
App.jsx (view state)
├── "login"   → LoginScreen      (public — no PIN required)
├── "portal"  → PublicPortal     (public — 4-step registration)
├── "lookup"  → RegistrationLookup (public — Consultar Inscrição)
├── "admin"   → AdminView        (PIN required: admin)
├── "clerk"   → ClerkView        (PIN required: clerk)
├── "pastor"  → PastorView       (PIN required: pastor)
├── "ga"      → GALeaderView     (PIN required: ga_leader)
└── "team"    → TeamLeaderView   (PIN required: team_leader)

URL params (bypass auth entirely):
├── ?checkin=<regNumber>   → CheckInScreen
└── ?selfcheckin=<eventId> → SelfCheckInScreen
```

---

## Data flow on mount

```
useAppData mount
└── Promise.all([
      events, registrations, members, families,
      assistance_groups, approvals, rosters, churches,
      app_users, categories, functions, teams
    ])
    ├── Sets raw state for each table
    ├── Computes seqRef from max(reg_number)
    └── Opens Realtime subscriptions on registrations + approvals
```

---

## Mutation pattern

Every write follows the same pattern:

```js
// 1. Update local state immediately (optimistic)
setRegs(prev => [...prev, newReg]);

// 2. Write to Supabase async (no await at the call site)
sb.from("registrations").insert(dbRow).then(({ error }) => {
  if (error) {
    console.error(error);
    notify("Erro ao salvar...");
  }
});
```

Failures are surfaced as toast notifications. The UI is not rolled back on failure.

---

## Further reading

- [Architecture: Data Model](data-model.md)
- [Architecture: Integrations](integrations.md)
- [Explanation: Security Model](../explanation/security-model.md)
- [ADRs](../adrs/)
