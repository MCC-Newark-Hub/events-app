# Reference: Age Categories

Age categories determine the fee a participant pays. They are set on the member record and carried onto the registration.

---

## Categories

| Category | Typical age range | Notes |
|---|---|---|
| **Adulto** | 30+ | Default for most members |
| **Jovem** | 18–29 | Youth adult |
| **Adolescente** | 13–17 | Teenager |
| **Criança** | 4–12 | Child; typically free |
| **Bebê** | 0–3 | Infant; typically free |

> Age ranges are approximate and set by event organizers. The system does not validate age against date of birth — category is assigned manually on the member record.

---

## Fee configuration

Fees are set per-event, per-category by the admin. Example configuration:

| Category | Example fee |
|---|---|
| Adulto | $50.00 |
| Jovem | $40.00 |
| Adolescente | $30.00 |
| Criança | $0.00 |
| Bebê | $0.00 |

A category with fee `$0.00` is free — the registration shows as "Grátis" rather than "Pendente".

---

## Fee overrides

Certain conditions override the category fee regardless of what's configured:

| Condition | Override |
|---|---|
| Ministry role is Pastor | Always fee = $0 and `exempt = true` |
| Ministry role is Ungido | Always fee = $0 and `exempt = true` |
| Clerk sets `exempt = true` manually | Fee = $0 |

---

## Changing a category after registration

A clerk or admin can update the category on an existing registration via the detail panel. The fee is recalculated automatically based on the new category and the current event's fee table. Payment status is not reset.

---

## Custom categories

The built-in category list (`CATEGORIES` in `src/constants/index.js`) is used as a fallback. If the `categories` table in Supabase is populated, its values override the built-in list.

---

## Related

- [Reference: Registration Statuses](statuses.md)
- [Reference: Roles](roles.md) — for auto-exempt rules
- [Tutorial: Create an Event](../tutorials/create-event.md) — for setting fees
