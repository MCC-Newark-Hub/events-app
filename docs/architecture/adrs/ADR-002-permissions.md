# ADR-002: Application-Layer Permissions (No RLS)

**Date:** 2026-06-13  
**Status:** Accepted  
**Deciders:** Leonard Alves

---

## Context

The app has five distinct staff roles (admin, clerk, pastor, ga_leader, team_leader) and a public user type. Each role should see different views and have access to different mutations.

Options for enforcing this:

1. **Supabase RLS** — database-level policies filter what each user can read/write
2. **Application-layer checks** — React view routing and prop-drilling control what each role sees and can do
3. **A separate backend API** — a Node.js/serverless layer enforces permissions server-side

---

## Decision

Enforce permissions entirely at the application layer. 

Supabase RLS is disabled on all 12 tables. Role-based access is enforced by:
- `App.jsx` routing to the appropriate view component based on `role` from localStorage
- Mutation functions (`addReg`, `updateReg`, etc.) are prop-drilled only to components that should have them
- The public portal receives `addReg`; the pastor view does not
- Clerk-only mutations are not passed to GA leader or team leader views

---

## Consequences

**Positive:**
- Simpler implementation — no RLS policy authoring or debugging
- Supabase Realtime works correctly (RLS blocks Realtime events for the anon role)
- All tables accessible for reporting and admin operations without complex policy exceptions
- No need for a separate backend API

**Negative:**
- **No server-side enforcement** — anyone who obtains the `VITE_SUPABASE_KEY` (visible in the browser) can call the Supabase REST API directly and bypass all permission checks
- Mutations granted in one component cannot be revoked from a descendant — careful prop-drilling is required
- No per-row audit capability — the database doesn't know which app user made a change

**Accepted risks:**
- The anon key is visible in the browser bundle. This is mitigated by the fact that the key is labeled "anon/public" in Supabase — it is designed to be public-facing. The risk is that someone uses it to write bad data. For a church internal tool, this risk is accepted.
- A server-side API would add significant complexity (auth middleware, deployment, maintenance) that is disproportionate to the sensitivity of this data.

**Future migration path:**
If a server-side boundary is needed:
1. Move all mutations to Supabase Edge Functions or a Next.js API layer
2. Validate the caller's role in the function before executing the mutation
3. Re-enable RLS with the Edge Function's service key
4. The React app becomes purely a presentation layer

---

## Related

- [ADR-001: Authentication](ADR-001-authentication.md)
- [ADR-003: Database](ADR-003-database.md)
- [Reference: Permissions](../reference/permissions.md)
- [Explanation: Security Model](../explanation/security-model.md)
