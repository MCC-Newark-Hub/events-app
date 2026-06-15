# ADR-001: PIN-Based Authentication

**Date:** 2026-06-13  
**Status:** Accepted  
**Deciders:** Leonard Alves

---

## Context

The app needs to restrict access to admin, clerk, pastor, GA leader, and team leader views. Public users (participants) need zero-friction access to the registration portal.

Options considered:

1. **Supabase Auth** — email/password, magic links, or OAuth
2. **PIN-based auth** — 4-digit PINs stored in a custom `app_users` table
3. **Single shared password** — one password for all staff
4. **No auth** — all features accessible to everyone

### Constraints

- Staff includes volunteers who may not have a church email address
- Staff rotate between events — high turnover
- The app is used on shared tablets at the registration desk
- No IT department to manage accounts or reset passwords
- Events happen at venues with uncertain WiFi — auth flows that require email delivery are unreliable

---

## Decision

Implement PIN-based authentication using a custom `app_users` table. Each staff member gets a unique 4-digit PIN that determines their role and view.

PINs are stored in plain text in the `app_users` table. Sessions are persisted in `localStorage` (`mcc_pin`, `mcc_view`) and restored on page load.

---

## Consequences

**Positive:**
- No email account required for volunteers
- Fast to onboard new staff — admin creates a PIN, tells them verbally
- Works offline-ish (session persists in localStorage)
- Fast PIN entry on a shared tablet is practical

**Negative:**
- PINs are plain text in the database — anyone with Supabase dashboard access can see all PINs
- No self-service PIN reset — requires admin action
- Short PINs (4 digits) are guessable by brute force if the app is exposed publicly
- Session is tied to the browser's localStorage — clearing storage logs the user out
- No audit log of who made which change — `registered_by` is stored as a name string, not a verified user ID

**Accepted risks:**
- The app URL is not publicized beyond church staff and participants
- 4-digit PINs are sufficient because the data (names, fees) is not sensitive enough to warrant stronger protection
- If a PIN is compromised, the admin can change it immediately

**Future migration path:**
If security requirements increase, migrate to Supabase Auth:
1. Enable Supabase Auth
2. Create Auth users per staff member
3. Map `app_users.role` to Supabase JWT claims
4. Replace `useAuth.js` with Supabase Auth hooks
5. Re-enable RLS with `auth.uid()` based policies

---

## Related

- [ADR-002: Permissions](ADR-002-permissions.md)
- [Explanation: Security Model](../explanation/security-model.md)
