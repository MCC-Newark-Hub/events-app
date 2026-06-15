# ADR-003: Supabase + Upfront Loading + Optimistic UI

**Date:** 2026-06-13  
**Status:** Accepted  
**Deciders:** Leonard Alves

---

## Context

Three related decisions were made together because they are interdependent:

1. **Database:** Which backend/database to use
2. **Loading strategy:** When and how to fetch data
3. **Mutation strategy:** How to handle writes

---

## Decision 1: Supabase as the backend

### Options considered

| Option | Pros | Cons |
|---|---|---|
| Supabase | Hosted PostgreSQL, JS client, Realtime, no infra to manage | Anon key is public; free tier pauses |
| Firebase Firestore | Realtime, good React integration | NoSQL — harder to query for reports |
| PlanetScale / Neon | Hosted PostgreSQL | No built-in Realtime; need separate API |
| SQLite (local) | Works offline | No sync between clerks |

### Decision

Supabase. It provides hosted PostgreSQL with a REST API, Realtime WebSocket subscriptions, and a generous free tier — all without maintaining any server infrastructure. The anon-key-is-public concern is acceptable (see [ADR-002](ADR-002-permissions.md)).

---

## Decision 2: Upfront full data load

### Options considered

| Option | Pros | Cons |
|---|---|---|
| Upfront full load | All queries instant; simplest code | Memory usage; stale data if left open |
| Lazy loading per view | Lower initial load time | Adds loading states everywhere; complicates queries |
| Server-side pagination | Scales to any size | Overkill at current scale; adds complexity |

### Decision

Load all 12 tables in a single `Promise.all` on mount.

**Justification:** The dataset is small and bounded:
- ~391 members
- One active event at a time
- ~500 registrations per event at most

The full dataset fits comfortably in memory (estimated <1 MB). Upfront loading eliminates all per-view loading states and makes all derived computations (`activeRegs`, `isFull`, etc.) instant. Stale data is mitigated by Realtime subscriptions that keep `registrations` and `approvals` up to date.

**Known limitation:** If the app tab is left open for multiple hours without refresh, tables other than `registrations` and `approvals` (e.g. `members`) may become stale. A manual refresh resolves this.

---

## Decision 3: Optimistic UI for all mutations

### Options considered

| Option | Pros | Cons |
|---|---|---|
| Optimistic UI | Instant feedback; no loading spinners | UI may not match DB on write failure |
| Wait for DB confirmation | UI always reflects DB state | 200–400 ms per action; desk clerks register 30+ people per session |
| Pessimistic with retry | Balances correctness and UX | Complex error handling |

### Decision

All mutations update local React state immediately, then fire the Supabase write asynchronously. DB errors are logged to the console and surfaced as a toast notification. The UI is not rolled back on failure.

**Justification:** Registration desks operate under time pressure. A 200–400 ms wait per action across 30+ registrations per session is a meaningful friction. Optimistic UI eliminates this at the cost of potential UI/DB divergence on network errors — which are rare and fixable by refreshing.

The tradeoff is acceptable because:
- Supabase writes are reliable under normal conditions
- Failures produce a visible toast ("Erro ao salvar...")
- A page refresh restores correct state from the DB

---

## Consequences

**Positive:**
- No server to maintain
- Instant UI across all operations
- Realtime sync between clerk stations (via Supabase Realtime)
- Simple, flat data access — no complex query layer

**Negative:**
- Full dataset must fit in memory (bounded by `Promise.all` on mount)
- Stale data possible if tab left open without refresh
- Silent write failures possible (mitigated by toasts)
- Free tier pauses after 7 days — must restore before events

**Monitoring:**
No automated monitoring. Production issues are detected by users reporting problems. The [Incident Response runbook](../runbooks/incident-response.md) covers known failure modes.

---

## Related

- [ADR-001: Authentication](ADR-001-authentication.md)
- [ADR-002: Permissions](ADR-002-permissions.md)
- [Architecture: Overview](../architecture/overview.md)
- [Architecture: Integrations](../architecture/integrations.md)
