# Security Policy

## Reporting a vulnerability

This is a private project for internal church use. If you discover a security issue:

1. **Do not open a public GitHub issue.**
2. Contact the project owner directly via email or in person.
3. Include a description of the issue and steps to reproduce it if possible.

We'll respond as quickly as possible and patch anything critical before it affects members.

---

## What we protect

- Member personal information (names, contact info, church affiliation)
- Payment status records
- Internal access PINs

---

## Known limitations

- Authentication is PIN-based, not password-based. PINs are intentionally simple for staff usability. Do not share them outside of authorized users.
- Supabase RLS policies are currently set to `allow_all` for the anon role. This is acceptable while the app is internal-only, but should be tightened before any public-facing API exposure.
- `.env` files must never be committed. The Supabase anon key and Resend API key are in scope.

---

## Dependency updates

Dependencies should be reviewed and updated regularly. Pay attention to security advisories for:
- `@supabase/supabase-js`
- `jspdf`
- `lucide-react`
- Vite and its plugins
