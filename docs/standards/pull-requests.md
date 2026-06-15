# Pull Request Standards

---

## When to open a PR

- Every change to `master`, except documented P0 hotfixes
- One logical change per PR — a feature and its tests together are fine; unrelated fixes are not
- Keep PRs small enough to review in under 20 minutes

---

## PR title

Same format as commits: `type(scope): description`

```
feat(portal): add Consultar Inscrição with cancel and add-family
fix(useAppData): correct Supabase .update().eq() ordering
chore: disable RLS on all 12 tables
```

---

## PR description

Use the [pull request template](../../.github/pull_request_template.md). Every field matters:

- **Summary** — one paragraph on what and why
- **Type of change** — check exactly one box
- **Testing** — every box must be checked before requesting review
- **Database changes** — if a migration is included, say so explicitly

---

## Before requesting review

- [ ] `npm test` passes locally
- [ ] `npm run lint` passes
- [ ] `npm run build` completes (catches JSX/syntax errors)
- [ ] Tested the changed flow manually in the browser
- [ ] If a migration is included — ran against a non-production Supabase project first
- [ ] CHANGELOG.md entry added if this is user-visible

---

## Review expectations

- At least one approval required before merging (self-merge allowed for docs/chore)
- Address all comments before merging, or explicitly resolve them with a note
- Don't merge with unresolved threads

---

## After merging

- Delete the branch
- Verify the Vercel deployment completes without errors
- For user-facing changes: manually verify the feature on production immediately after deploy
- Add a CHANGELOG.md entry if not already done
