# Contributing

This is an internal project for ICM Newark. These guidelines keep the codebase consistent and production safe.

---

## Prerequisites

- Node.js 18+
- A Supabase project (see [Local Setup](docs/setup-local.md))
- Access to the GitHub repository

---

## Workflow

1. **Branch** from `master` using the naming convention in [Branching Standards](docs/standards/branching.md)
2. **Develop** locally — `npm run dev`
3. **Test** — `npm test` must pass with no failures
4. **Lint** — `npm run lint` must pass
5. **Commit** using the convention in [Commit Standards](docs/standards/commits.md)
6. **Open a PR** following the [PR Standards](docs/standards/pull-requests.md)
7. **Merge** — squash merge into `master`; Vercel deploys automatically

---

## Code Style

- **Formatting:** Prettier (`npm run format`). Config is in `package.json`. Run before committing.
- **No TypeScript** — the project uses plain JavaScript (`.js` / `.jsx`).
- **No comments explaining what code does** — well-named identifiers do that. Comments only for non-obvious *why*.
- **No over-engineering** — don't abstract until the third repetition. Don't add error handling for impossible cases.
- **Optimistic UI** — mutations update local React state immediately, then fire the async Supabase write. Don't wait for the DB before updating the UI.
- **Supabase JS v2** — always `.update(data).eq(col, val)` — filter after mutation, never before.

---

## Testing

- Tests live in `src/test/`
- Run with `npm test` (Vitest)
- Pure logic tests only — no live Supabase connection required
- Add tests for any new helper functions in `constants/` or `hooks/`
- UI/integration tests are not yet in scope

---

## What not to do

- Do not re-enable Row Level Security without a complete auth redesign — the app uses PIN auth, not Supabase Auth. All 12 tables must have RLS disabled.
- Do not add a client-side router — view state lives in `App.jsx` as a `view` string. URL params (`?checkin=`, `?selfcheckin=`) are the only URL-driven state.
- Do not add pagination or lazy loading — the full DB is loaded upfront. This is intentional at current scale.
- Do not push directly to `master` — always use a PR.
- Do not skip `npm test` before opening a PR.

---

## Reporting Issues

Use the GitHub issue templates:
- [Bug report](.github/ISSUE_TEMPLATE/bug_report.md)
- [Feature request](.github/ISSUE_TEMPLATE/feature_request.md)

For production incidents, follow the [Incident Response runbook](docs/runbooks/incident-response.md).
