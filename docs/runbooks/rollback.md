# Rollback

Use this runbook to revert production to a previous working state.

---

## Code rollback (Vercel)

Vercel keeps every past deployment and can instantly promote any of them back to production.

### Via the Vercel dashboard (fastest)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard) → select the project
2. Click **Deployments**
3. Find the last known-good deployment (check the timestamp and commit SHA against your git log)
4. Click the three-dot menu on that deployment → **Promote to Production**
5. Confirm — the old build goes live in seconds, no rebuild required

### Via the Vercel CLI

```bash
# List recent deployments
npx vercel ls

# Promote a specific deployment URL to production
npx vercel promote <deployment-url> --scope=<your-vercel-team>
```

### Via git revert

If you need the rollback in git history (e.g. the bad commit introduced a DB migration):

```bash
git revert <bad-commit-sha>
git push origin master
# Vercel builds and deploys the reverted code automatically
```

---

## Database rollback

> **Important:** Supabase (PostgreSQL) has no automatic migration rollback. All migrations must be written and tested to be safe to leave in place even if the code is rolled back.

### If a migration broke the schema

1. Identify what the migration changed (check `migrations/` for the file)
2. Write a compensating SQL statement to undo the change — run it in the Supabase SQL Editor
3. Example: if a migration added a column, drop it:
   ```sql
   ALTER TABLE members DROP COLUMN IF EXISTS new_column;
   ```
4. Document the compensating change as a new migration file (e.g. `011_revert_member_column.sql`)

### If bad data was written

Use the Supabase table editor or SQL editor to correct the data directly. Back up what you're changing first:

```sql
-- Back up affected rows before modifying
CREATE TABLE registrations_backup_20260615 AS
SELECT * FROM registrations WHERE <condition>;

-- Then make the correction
UPDATE registrations SET cancelled = false WHERE <condition>;
```

---

## Rollback decision tree

```
Is the issue in the code (JS crash, wrong logic)?
  └── YES → Vercel instant promote of previous deployment
  └── NO → Is the issue in the DB schema?
              └── YES → Write compensating SQL, run in Supabase SQL Editor
              └── NO → Is it bad data?
                          └── YES → Correct directly in Supabase table editor / SQL
                          └── NO → Is Supabase down?
                                      └── YES → Check status.supabase.com; wait
```

---

## After rollback

1. Verify the app is working correctly in production
2. Notify the registration team that the issue is resolved
3. Identify and fix the root cause before re-deploying the rolled-back change
4. Update [CHANGELOG.md](../../CHANGELOG.md) and [troubleshooting.md](../troubleshooting.md)
