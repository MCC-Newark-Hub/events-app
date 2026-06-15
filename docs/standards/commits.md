# Commit Standards

We use a lightweight version of [Conventional Commits](https://www.conventionalcommits.org/).

---

## Format

```
<type>(<scope>): <short description>

<optional body — explain the WHY, not the what>
```

The first line must be under 72 characters.

---

## Types

| Type | When to use |
|---|---|
| `feat` | A new user-visible feature |
| `fix` | A bug fix |
| `refactor` | Code change with no behavior change |
| `test` | Adding or updating tests |
| `docs` | Documentation only |
| `chore` | Build config, deps, CI, tooling |
| `style` | Formatting only (Prettier, whitespace) |
| `perf` | Performance improvement |
| `revert` | Reverting a prior commit |

---

## Scope (optional)

Use the main area of the codebase the change touches:

`portal`, `admin`, `clerk`, `lookup`, `useAppData`, `auth`, `db`, `i18n`, `badges`, `checkin`

---

## Examples

```
feat(portal): add batch token for family grouping without contact info

fix(useAppData): swap .eq().update() to .update().eq() — Supabase JS v2 ordering

fix(portal): replace typographic quotes in TermsContent JSX string

feat(admin): add bulk delete with confirmation modal in RegistrationsTab

chore: disable RLS on all 12 tables

test: add extractBatchId and getRegStatus test cases

docs: add architecture and troubleshooting guides
```

---

## Rules

- **Present tense** — "add feature" not "added feature"
- **Imperative mood** — "fix bug" not "fixes bug"
- **No period** at the end of the first line
- **Body explains WHY** — the diff shows what changed; the commit message explains why it was necessary
- **One logical change per commit** — don't mix a bug fix with a refactor in the same commit

---

## What not to do

```
# Too vague
fix stuff
update code
wip

# Describes what, not why
add if statement to check for null
move phone field

# Too long for first line
feat: add a new feature to the public portal that allows users to look up their registration by number or name and cancel it if needed, including family members
```
