# How-to: Print Badges

Use this guide to generate and print participant badges for an event.

**Role required:** Admin

---

## Generate badges for all registrants

1. Log in as Admin
2. Click the **Badges** tab in the sidebar
3. The tab shows all active (non-cancelled) registrations with their badge preview
4. Click **Print All** to open the browser's print dialog

The badges are rendered as a PDF grid — typically 6–8 badges per A4/Letter page.

---

## Generate badges for a filtered subset

To print badges for specific participants (e.g. only people who checked in):

1. In the **Badges** tab, use the filter controls to narrow the list:
   - Filter by **church**, **category**, **team**, or **status**
   - Filter by **check-in status** to print only for people who have arrived
2. Click **Print Selected** to print only the filtered badges

---

## Badge layout

Each badge contains:
- Participant's **badge name** (the short display name, not always their full name)
- **Registration number**
- **Age category**
- **Church**
- **Ministry role** (if any)
- **Team** assignment (if assigned to a service team)
- QR code for self-check-in

---

## Edit a badge name before printing

The badge name defaults to the member's `badgeName` field, which falls back to their full name. To change what appears on the badge:

1. Open the registration in the Admin → Registrations tab
2. Edit the **Badge Name** field
3. Return to the Badges tab — the badge preview updates immediately

---

## Mark badges as printed

After printing, the system can track which badges have been produced:

1. Select the registrations whose badges were printed
2. Click **Mark as Printed**
3. The **Badges** tab can then be filtered to show only unprinted badges — useful if you need to print a second batch for late arrivals

---

## Troubleshooting

**Badges appear blank or garbled in print preview:**
Browser print scaling may be clipping content. Set the print scale to 100% or "Actual size" in the print dialog.

**PDF download fails:**
The badge export uses `html2canvas` to render the DOM to a canvas, then `jsPDF` to bundle it. This requires the browser to have JavaScript fully loaded. Try refreshing the page and attempting again.

---

## Related

- [Tutorial: Register a Member](../tutorials/register-member.md)
- [Reference: Age Categories](../reference/age-categories.md)
