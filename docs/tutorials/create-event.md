# Tutorial: Create Your First Event

**What you'll learn:** How to create an event, configure fees per age category, set capacity, and open it for registration.

**Who this is for:** An admin setting up a new event for the first time.

**Time:** ~10 minutes

**Prerequisite:** You're logged in as admin. If not, see [Tutorial: First Login](first-login.md).

---

## Step 1 — Go to the Events tab

In the Admin panel, click the **Events** tab in the sidebar.

You'll see any existing events listed. Click **New Event** (or the `+` button).

---

## Step 2 — Fill in the event details

Complete the following fields:

| Field | Example | Notes |
|---|---|---|
| **Name** | Convenção de Jovens 2026 | The name shown on badges and the public portal |
| **Date** | 2026-08-15 | YYYY-MM-DD format |
| **Time** | 09:00 | 24-hour format |
| **Location** | Newark, NJ | Shown on the public portal |
| **Prefix** | CJ26 | Used in registration numbers: `CJ26-20260815-0001` |
| **Capacity** | 200 | Maximum active registrations before the waitlist activates |

> The **Prefix** must be short (4–6 characters), unique per event, and contain only letters and digits. It appears on every badge and registration number.

---

## Step 3 — Set fees by age category

The system has five age categories. Set a fee for each:

| Category | Typical fee |
|---|---|
| Adulto | $50.00 |
| Jovem | $40.00 |
| Adolescente | $30.00 |
| Criança | $0.00 |
| Bebê | $0.00 |

Enter `0` for categories that are free. Pastors and Ungidos are always fee-exempt regardless of what you set here.

---

## Step 4 — Set the payment deadline (optional)

The **Payment Deadline (Days)** field sets how many days a registration can remain unpaid before it's considered overdue. This is displayed prominently on the public portal's confirmation screen and in the Terms of Acceptance.

Example: enter `7` to indicate that payment is expected within 7 days of registration.

Leave blank if there's no deadline.

> The system does not auto-cancel unpaid registrations — this field is informational only. Cancellations are done manually by clerks or by participants via Consultar Inscrição.

---

## Step 5 — Save the event

Click **Save**. The event appears in the list and becomes active immediately — the public portal will now show it.

---

## Step 6 — Verify on the public portal

Open the app URL in a new browser tab (without logging in) and click **Fazer minha inscrição**. You should see your event name, date, and location.

Try searching for a member name. If the member directory is empty, see [Local Setup — Seed test data](../setup-local.md) or import members via the Directory tab.

---

## What's next?

- Share the app URL with participants so they can self-register
- Assign clerks their PINs so they can process desk registrations
- See [How-to: Print Badges](../how-to/print-badges.md) when the event day arrives
