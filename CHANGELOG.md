# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions follow [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

---

## [1.1.0] — 2026-06-15

### Added
- **Consultar Inscrição** — self-service registration lookup on the home screen
  - Search by registration number or by name
  - Cancel individual or full family group registrations
  - Add a new family member to an existing submission
  - Paid registrations blocked from self-cancel ("fale com um atendente")
- **Terms of Acceptance** redesign
  - Rich formatting: headings, bold, bullet lists, italic emphasis
  - pt-BR / en-US language tabs
  - Payment deadline callout (⚠️ red box, days pulled from event config)
  - Separate amber acknowledgement checkbox required before submit
- **Confirmation screen** — prominent payment card
  - Fee displayed as hero element (large monospace)
  - "How to pay" instructions: authorized staff only, in-person only, reg number to quote
  - Deadline warning inline if event has `payment_deadline_days` set
  - Zero-fee path shows green "Isento" card instead
- **Admin bulk delete** — checkbox column + confirmation modal in Registrations tab
- **Real-time sync** — clerks see each other's registrations and approvals live via Supabase Realtime
- **Phone optional** — moved from required step 1 to optional step 4 ("Contato & Termos")
- **Batch token** — `[B{timestamp}]` prepended to `note` so family members from the same portal submission can be grouped in Consultar Inscrição even when no contact info is provided
- 41 unit tests (Vitest) covering `mapReg`, `extractBatchId`, `dateFromRegNumber`, `getRegStatus`, and constants helpers

### Fixed
- All DB writes silently failing — Supabase RLS was enabled on all 12 tables with no anon write policies; disabled RLS on all tables
- `updateReg` crash — `sb.from(...).eq is not a function`; Supabase JS v2 requires `.update(data).eq(col, val)`, not the reverse
- `promoteFromWaitlist` not persisting — only updated local state, no DB write
- Real-time events not delivered — RLS blocked SELECT for the anon role before delivery
- Portal showing "not found" for already-registered members — `primaryResults` excluded `existingMemberIds`; now shows "Já inscrito" card with status
- Family registration 409 FK conflict — `famId = "FAM-" + Date.now()` violated the `families.id` FK; set to `null`
- Registration sequence duplicates on concurrent family submissions — replaced stale `seq` state reads with `seqRef.current`
- Pastor/Ungido not auto-exempt when role updated via admin — `updateReg` now applies `exempt: true, fee: 0` automatically
- Admin directory column filters crash — `FilterTh` factory violated React hook rules; refactored to `makeTh` helper
- JSX build crash (vite:oxc) — typographic `"..."` curly-quote characters inside a JSX string literal in `TermsContent`
- `notify("Atualizado!")` toast shown on public-facing cancellation — added `opts.silent` flag to `updateReg`

---

## [1.0.0] — 2026-06-13

### Added
- 4-step public self-registration portal (member search → family → health → contact & terms)
- Family grouping in the portal
- Bilingual interface (pt-BR / en-US)
- Clerk registration desk with capacity enforcement and waitlist
- Over-capacity ("excedente") flow with pastor approval workflow
- Fee tracking with auto-exempt for Pastors and Ungidos
- Payment deadline tracking with family/service-team exemptions
- Badge printing (html2canvas → PDF)
- QR-code check-in (`?checkin=<regNumber>`, `?selfcheckin=<eventId>`)
- CSV bulk import for members, families, GA groups, teams, churches
- Member directory CRUD (churches, members, families, GA, rosters, teams)
- PIN-based authentication with role-based view routing
- Session persistence across page reloads
- Dark/light theme toggle
- Admin, Clerk, Pastor, GA Leader, Team Leader role views
- Supabase Realtime subscriptions on `registrations` and `approvals`
