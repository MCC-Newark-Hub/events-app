# Explanation: Registration Rules

This document explains the logic behind how registrations are processed, how capacity is enforced, and who is exempt from fees and deadlines.

---

## Capacity enforcement

Every event has a `capacity` number. The system continuously computes:

```
activeCount = registrations where !cancelled AND !waitlisted AND !excedente
isFull      = activeCount >= capacity
```

When a clerk attempts to register someone and `isFull` is true, they are presented with two choices:

1. **Waitlist** — The registration is created with `waitlisted = true`. The participant is informed they're on the waitlist. No fee is expected until they're promoted.

2. **Excedente** — The clerk can override capacity with an excedente registration (`excedente = true`). This creates an **approval request** that a pastor must review. The registration is held in limbo until approved or denied.

When a registration is cancelled, if there are waitlisted participants, the system notifies the clerk that a spot has opened — promotion is manual (the clerk decides who to promote and in what order).

---

## Auto-exemption (Pastor and Ungido)

When any registration is created or updated with role = `Pastor` or role = `Ungido`, the system automatically sets:
- `exempt = true`
- `fee = 0`

This happens in `addReg` and `updateReg` in `useAppData.js`. It cannot be overridden by manually setting a fee — the auto-exempt logic re-applies whenever the role is changed to one of these values.

---

## Payment deadline

An event can have a `payment_deadline_days` number set by the admin. This is informational — the system does not automatically cancel unpaid registrations. What it does:

1. Displays prominently on the public portal confirmation screen with ⚠️ styling
2. Requires a separate acknowledgement checkbox in the Terms of Acceptance on the portal
3. Is shown on the Terms screen in both Portuguese and English

Actual enforcement (cancelling overdue registrations) is done manually by clerks or admins.

---

## Deadline exemptions

Some registrations are exempt from the payment deadline even if `payment_deadline_days` is set. The `isDeadlineExempt` helper in `src/constants/index.js` returns `true` if any of these conditions hold:

- Status is already `paid`, `exempt`, `cancelled`, or `waitlisted`
- The member's ministry role is an Obreiro role (Diácono, Obreiro, Presbítero, etc.)
- The member is assigned to a service team (`team` ≠ "Participante")
- The member belongs to a **family** that has at least one member who is an Obreiro or on a service team

The last condition — family-based deadline exemption — means that if one family member is serving at the event, the whole family group is not penalized for late payment.

---

## Family grouping on the portal

When a participant registers via the public portal with family members, all registrations in that submission share a **batch token** in their `note` field:

```
[B1749900000000] | Tel: +55 11 99999-9999
```

The `[B{timestamp}]` token is the same for all members of the same portal submission. This allows **Consultar Inscrição** to find and group family members even when:
- No phone number was provided
- Family members aren't linked via `families.member_ids` in the DB
- The primary registrant's `family_id` is null (portal registrations don't set the FK)

This is a pragmatic design — family grouping needed to survive the phone-optional change without a schema migration.

---

## Unverified members

If a participant can't find a family member in the member directory during portal registration, they can add them as an **unverified member** (`member_id = "GUEST"`). Unverified registrations:
- Get a registration number and a badge
- Show a "Não verificado" badge in the admin list
- Are not linked to any member record in the directory
- Cannot be auto-exempt (no role to check)

Clerks should follow up to verify the person's identity and update the registration if needed.

---

## Related

- [Reference: Registration Statuses](../reference/statuses.md)
- [Reference: Age Categories](../reference/age-categories.md)
- [Reference: Roles](../reference/roles.md)
- [Architecture: Data Model](../architecture/data-model.md)
