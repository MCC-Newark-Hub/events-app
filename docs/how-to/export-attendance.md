# How-to: Export Attendance

Use this guide to export a list of registrations or attendance records for reporting, reconciliation, or sharing with event staff.

**Role required:** Admin

---

## Export the full registrations list

1. Log in as Admin
2. Click the **Reports** tab in the sidebar
3. Click **Export CSV** (or the download icon)
4. The browser downloads a `.csv` file with all registrations for the current event

The CSV includes: registration number, name, badge name, category, church, role, team, fee, paid status, exempt status, waitlisted, cancelled, presence, check-in timestamp, and note.

---

## Export a filtered subset

To export only a specific group (e.g. paid registrations, or a specific church):

1. In the **Registrations** tab, use the column filters to narrow the list:
   - Click a column header to filter by that column
   - Filter **paid = true** to export only paid registrations
   - Filter **church** to export a specific congregation's registrations
2. Click **Export CSV** — the export respects the active filters

---

## Export check-in attendance

To report who actually attended (vs. who registered):

1. Filter **presence = present** in the Registrations tab
2. Export the filtered list

---

## Column reference

| Column | Description |
|---|---|
| `reg_number` | Registration number (`PREFIX-YYYYMMDD-NNNN`) |
| `member_name` | Full name from the member directory |
| `badge_name` | Name printed on the badge |
| `category` | Age category |
| `church` | Congregation |
| `role` | Ministry role |
| `team` | Service team assignment |
| `fee` | Fee amount (numeric) |
| `paid` | `true` / `false` |
| `exempt` | `true` / `false` |
| `cancelled` | `true` / `false` |
| `waitlisted` | `true` / `false` |
| `presence` | `present` / `absent` / `unknown` / `walk_in` |
| `checked_in_at` | ISO 8601 timestamp of check-in, or blank |
| `registered_at` | ISO 8601 timestamp of registration |

---

## Related

- [Reference: Registration Statuses](../reference/statuses.md)
- [How-to: Process Payment](process-payment.md)
