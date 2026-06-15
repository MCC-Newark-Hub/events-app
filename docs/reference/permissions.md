# Reference: Permissions Matrix

This table shows what each system role can do. Access control is enforced at the application layer (React view routing and prop-drilling of mutation functions).

| Action | Public | Clerk | GA Leader | Team Leader | Pastor | Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Self-register via portal | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Look up own registration | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Cancel own registration (unpaid) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Add family member to existing reg | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Register any member at desk | | ✓ | | | | ✓ |
| Mark payment (Pago / Isento) | | ✓ | | | | ✓ |
| Cancel any registration | | ✓ | | | | ✓ |
| Promote from waitlist | | ✓ | | | | ✓ |
| Process check-in (manual) | | ✓ | | | | ✓ |
| Create excedente (over-capacity) | | ✓ | | | | ✓ |
| View own GA group's registrations | | | ✓ | | | ✓ |
| View own team's roster | | | | ✓ | | ✓ |
| Approve / deny excedente requests | | | | | ✓ | ✓ |
| Create / edit events | | | | | | ✓ |
| Edit event fees and capacity | | | | | | ✓ |
| View all registrations | | | | | | ✓ |
| Bulk delete registrations | | | | | | ✓ |
| Export attendance CSV | | | | | | ✓ |
| Print badges | | | | | | ✓ |
| Manage member directory | | | | | | ✓ |
| Import CSV (members, churches…) | | | | | | ✓ |
| Create / edit / delete users | | | | | | ✓ |
| Change any user's PIN | | | | | | ✓ |

---

## Notes

- **No server-side enforcement:** All permission checks are UI-only. Anyone who can obtain the Supabase anon key can read and write all tables directly. See [Explanation: Security Model](../explanation/security-model.md).
- **Paid registrations:** The public Consultar Inscrição portal blocks self-cancellation of paid registrations — participants must contact a clerk.
- **Clerk vs. Admin:** Clerks and admins share most registration capabilities. Admins additionally have access to directory management, user management, events configuration, and reporting.

---

## Related

- [Reference: Roles](roles.md)
- [Explanation: Security Model](../explanation/security-model.md)
- [ADR-002: Permissions](../adrs/ADR-002-permissions.md)
