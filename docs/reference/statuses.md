# Reference: Registration Statuses

A registration's status is derived from a set of boolean flags on the `registrations` table. Status is not stored as a single column — it is computed from the combination of flags.

---

## Status derivation (priority order)

The status is resolved by checking flags in this order. The first matching condition wins.

| Priority | Status | Condition | Color |
|---|---|---|---|
| 1 | **Cancelado** | `cancelled = true` | Grey |
| 2 | **Lista de Espera** | `waitlisted = true` | Amber |
| 3 | **Excedente** | `excedente = true` | Purple |
| 4 | **Isento** | `exempt = true` | Green |
| 5 | **Pago** | `paid = true` | Green |
| 6 | **Pendente** | (none of the above) | Amber |

---

## Status descriptions

### Pendente
Default status after registration. Payment has not been received. The participant's spot is reserved but not confirmed. Subject to payment deadline rules.

### Pago
Payment has been received and confirmed by a clerk. Spot is confirmed.

### Isento
The participant is exempt from paying the registration fee. This is set automatically for Pastors and Ungidos, or manually by a clerk for special cases. Spot is confirmed.

### Lista de Espera
The event was at capacity when this registration was submitted. The participant is on the waitlist. Spot is not guaranteed. A clerk can promote this registration to active if a spot opens.

### Excedente
The registration was accepted over the event's stated capacity, pending pastor approval. Spot is conditionally held until the approval is resolved.

### Cancelado
The registration has been cancelled — either by the participant via Consultar Inscrição (if unpaid), or by a clerk. The capacity slot is freed.

---

## Flags on the `registrations` table

| Column | Type | Description |
|---|---|---|
| `paid` | boolean | Payment received |
| `exempt` | boolean | Fee waived |
| `cancelled` | boolean | Registration cancelled |
| `waitlisted` | boolean | On the waitlist |
| `waitlist_reason` | text | Why the registration was waitlisted (e.g. "Capacidade esgotada") |
| `excedente` | boolean | Over-capacity, pending approval |
| `presence` | text | `unknown` / `present` / `absent` / `walk_in` |

---

## Presence vs. status

**Status** (paid/cancelled/waitlisted etc.) describes the registration's administrative state.  
**Presence** describes whether the participant physically attended the event.

These are independent. A participant can be `paid` and `absent`, or `unknown` presence and `Isento`. Presence is recorded at check-in time and does not affect status.

---

## Related

- [Explanation: Registration Rules](../explanation/registration-rules.md)
- [How-to: Process Payment](../how-to/process-payment.md)
