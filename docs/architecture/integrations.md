# Architecture: Integrations

## Supabase

The primary backend. Used for:

| Capability | How it's used |
|---|---|
| PostgreSQL (via PostgREST) | All 12 tables — CRUD via Supabase JS v2 |
| Realtime (WebSocket) | Live updates on `registrations` and `approvals` between clerk stations |
| Storage | Not used |
| Auth | Not used (PIN auth is implemented in the app layer) |
| Edge Functions | Not used |

### Client setup

```js
// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";
export const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);
```

Both variables are Vite public env vars (prefixed `VITE_`), injected at build time and visible in the browser bundle.

### Query pattern (Supabase JS v2)

```js
// Always: mutation first, then filter
await sb.from("registrations").update(data).eq("id", id);

// NOT: filter first (Supabase JS v1 style — will throw)
await sb.from("registrations").eq("id", id).update(data); // ← broken
```

### Realtime subscriptions

```js
supabase
  .channel("regs-changes")
  .on("postgres_changes", {
    event: "*",
    schema: "public",
    table: "registrations"
  }, (payload) => {
    // merge payload.new into local regs state
  })
  .subscribe();
```

Subscriptions are opened in `useAppData.js` and cleaned up on unmount. Realtime requires RLS to be disabled — the anon role cannot receive events for tables where RLS blocks SELECT.

---

## Vercel

Static site hosting. The app is a Vite SPA — Vercel serves the `dist/` folder.

| Branch | Deployment |
|---|---|
| `master` | Production (automatic on push) |
| Any feature branch | Preview URL (automatic on push) |

**Build command:** `npm run build`  
**Output directory:** `dist`  
**Framework preset:** Vite

Environment variables are configured per-environment in the Vercel dashboard. See [Deployment guide](../deployment.md).

---

## html2canvas + jsPDF

Used for badge generation:

1. `html2canvas` renders the badge DOM elements to an HTML5 Canvas
2. `jsPDF` converts the canvas to a PDF for download or browser printing

This is client-side only — no server-side PDF generation. Badge layout is in `src/components/BadgePrint.jsx`.

**Known limitation:** Complex CSS (gradients, box-shadows) may not render perfectly in `html2canvas`. The badge layout is intentionally simple to avoid rendering artifacts.

---

## qrcode

Generates QR codes for self-check-in kiosks. Each event gets a QR code encoding the URL:

```
https://your-app.vercel.app?selfcheckin=<eventId>
```

Participants scan the QR code on arrival, find their name, and confirm their presence. The QR code is generated client-side using the `qrcode` npm package.

---

## Future integrations (not yet implemented)

| System | Potential use |
|---|---|
| WhatsApp / Twilio | Send registration confirmation via WhatsApp (participants provide phone numbers in the portal) |
| Google Sheets | Auto-export attendance data for finance team |
| Stripe | Online payment option (currently in-person only) |
| Supabase Auth | Full auth migration if security requirements change |

---

## Related

- [Architecture: Overview](overview.md)
- [Deployment guide](../deployment.md)
- [ADR-003: Database](../adrs/ADR-003-database.md)
