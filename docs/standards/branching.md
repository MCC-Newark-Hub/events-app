# Branching Standards

---

## Branch naming

```
<type>/<short-description>
```

Use hyphens, no spaces, all lowercase.

| Prefix | Purpose | Example |
|---|---|---|
| `feat/` | New feature | `feat/registration-lookup` |
| `fix/` | Bug fix | `fix/family-fk-constraint` |
| `hotfix/` | Urgent production fix | `hotfix/portal-build-crash` |
| `refactor/` | Refactor, no behavior change | `refactor/filter-th-helper` |
| `docs/` | Documentation only | `docs/architecture-guide` |
| `chore/` | Build, deps, config | `chore/upgrade-vite-8` |
| `test/` | Tests only | `test/registration-helpers` |

---

## Branch lifetime

| Branch | Lifetime | Notes |
|---|---|---|
| `master` | Permanent | Production. Protected — no direct pushes except P0 hotfixes. |
| `feat/*` / `fix/*` | Short-lived | Open → PR → merge → delete. Keep under 1 week if possible. |
| `hotfix/*` | Hours | Fix only what's broken; merge as soon as verified. |

---

## Base branch

Always branch from `master`:

```bash
git checkout master
git pull
git checkout -b feat/my-feature
```

Never branch from another feature branch.

---

## Merging

- **Squash merge** into `master` via GitHub PR — keeps history clean
- Delete the branch after merge
- Do not use `git merge --no-ff` or rebase onto master manually

---

## Direct pushes to `master`

Allowed **only** for P0 production incidents when a PR review would meaningfully delay the fix. In that case:
1. Push the minimal fix directly
2. Immediately open a follow-up PR documenting the change
3. Note the incident in [CHANGELOG.md](../../CHANGELOG.md)
