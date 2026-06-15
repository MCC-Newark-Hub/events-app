# Tutorial: Register a Member at the Desk

**What you'll learn:** How to register a participant as a clerk, handle family registrations, mark payment, and deal with a full event.

**Who this is for:** A clerk processing registrations at the registration desk.

**Time:** ~15 minutes (includes practicing edge cases)

**Prerequisite:** You're logged in as a clerk. If not, see [Tutorial: First Login](first-login.md).

---

## Step 1 — Search for the member

In the search bar at the top of the Clerk view, type the participant's name (or part of it). The system uses accent-insensitive search — typing "joao" will find "João".

Click the participant's name in the results to select them.

> If the participant doesn't appear, they may not be in the member directory. In that case, you can register them as a guest by entering their name manually. Check with your admin if members are frequently missing.

---

## Step 2 — Review the registration card

A registration card opens showing:
- Name, age category, church, and ministry role
- Calculated fee (based on their category and the event's fee table)
- Auto-exempt status (Pastors and Ungidos are shown as "Isento" with fee $0.00)

Confirm the information with the participant before proceeding.

---

## Step 3 — Add family members (optional)

If the participant is registering with family:

1. In the family members section, search and select each family member
2. Each member appears with their own fee
3. The total updates at the bottom

Family members are linked by the registration batch — they can all be looked up and cancelled together via Consultar Inscrição.

---

## Step 4 — Submit the registration

Click **Registrar** (or **Confirm**). Registration numbers are generated immediately:

```
CJ26-20260815-0001   ← primary registrant
CJ26-20260815-0002   ← first family member
```

Write down or print the number(s) and give them to the participant.

---

## Step 5 — Process payment (if paying now)

If the participant is paying immediately:

1. Find their registration in the list (it should appear at the top as the most recent)
2. Click the registration to open the detail panel
3. Toggle **Pago** to mark payment as received

See [How-to: Process Payment](../how-to/process-payment.md) for more detail.

---

## Edge case: Event is full

If the event is at capacity, you'll see a warning. You have two options:

- **Waitlist:** Register normally — the system automatically places the participant on the waitlist. Inform them they'll be contacted if a spot opens.
- **Excedente:** If you have authorization to go over capacity, toggle the "Excedente" option. This creates an approval request that the pastor must approve.

---

## Edge case: Participant is already registered

If a search result shows "Já inscrito", the participant has registered via the public portal or at a previous desk session. Ask them for their registration number and look it up to verify their status.

---

## What's next?

- [How-to: Process Payment](../how-to/process-payment.md)
- [How-to: Print Badges](../how-to/print-badges.md)
- [Reference: Registration Statuses](../reference/statuses.md)
