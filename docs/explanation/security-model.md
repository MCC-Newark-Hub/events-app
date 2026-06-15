# Explanation: Security Model

This document explains the authentication and authorization approach, why it was chosen, and what its limitations are.

---

## How authentication works

The app uses **PIN-based authentication** rather than Supabase Auth (email/password, OAuth, magic links). 

A 4-digit PIN is stored in plain text in the `app_users` table. When a staff member enters their PIN, the app queries `app_users` and compares the input to the stored value. The matched record gives the app the user's name and role. The PIN and role are stored in `localStorage` and restored on page load.

There is no JWT, no session token, and no server-side session. The Supabase anon key is used for all queries regardless of who is logged in.

---

## Why PIN auth instead of Supabase Auth

Supabase Auth requires each user to have an email address and to manage their own credentials (password resets, email verification, etc.). For a church registration desk staffed by volunteers who rotate between events, this is impractical:

- Volunteers may not have a church email address
- Password reset flows require email access that may not be available at the event venue
- Volunteer turnover means frequent account creation and deletion
- PIN entry on a shared tablet is faster and more reliable than a login form

PINs are distributed by the admin verbally or by message. A 4-digit PIN is sufficient because the app has no sensitive personal data beyond names, phone numbers, and fee amounts — and access is limited to people physically at the event.

---

## Why RLS is disabled

Supabase's Row Level Security (RLS) evaluates policies against the authenticated user's JWT. Because all users share one anon key and there is no Supabase Auth, there is no JWT to evaluate — RLS would either block everyone or allow everyone.

Attempts to use RLS with the anon key require writing policies like `USING (true)` (allow all), which defeats the purpose of RLS. More critically, Supabase Realtime also checks RLS before delivering change events to subscribers — with RLS enabled and no permissive anon policy, real-time updates between clerk stations would not be delivered.

The decision to disable RLS is documented in [ADR-003](../adrs/ADR-003-database.md).

---

## Access control model

All access control is enforced at the **application layer**:

- View routing in `App.jsx` renders different components based on the `role` from localStorage
- Mutation functions (`addReg`, `updateReg`, etc.) are passed as props only to views that should have them
- The public portal receives `addReg` but not the admin's `deleteReg`
- The clerk view receives payment mutation functions; the GA leader view does not

This is a **trust-the-client** model, not a **trust-no-one** model. Anyone who can access the Supabase anon key can call any table directly via the REST API or the Supabase dashboard, bypassing the app entirely.

---

## What this means in practice

**Protected:** Casual users opening the app URL cannot see admin data — they see only the public portal unless they know a PIN.

**Not protected:** A determined person who extracts the `VITE_SUPABASE_KEY` from the browser (visible in the network tab) can read and write all tables directly.

For a church internal tool handling event registration data (names, phone numbers, fees), this risk level is accepted. The data is not sensitive enough to warrant the operational complexity of full Supabase Auth integration.

---

## If security requirements change

If the app ever needs to handle more sensitive data or integrate with external systems:

1. Enable Supabase Auth (email/password or magic link)
2. Migrate PINs to Supabase Auth users — each staff member gets their own account
3. Re-enable RLS on all tables with role-based policies using `auth.uid()` and `auth.jwt()`
4. Remove the `app_users` table and `localStorage` session

This would be a significant refactor of `useAuth.js`, `useAppData.js`, and all permission checks throughout the app.

---

## Related

- [ADR-001: Authentication](../adrs/ADR-001-authentication.md)
- [ADR-002: Permissions](../adrs/ADR-002-permissions.md)
- [ADR-003: Database](../adrs/ADR-003-database.md)
- [Reference: Permissions Matrix](../reference/permissions.md)
