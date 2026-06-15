# Incident Response

Use this runbook when the production app is broken or degraded during an event.

---

## Severity levels

| Level | Definition | Target response |
|---|---|---|
| **P0** | App is completely down or registrations cannot be submitted | Immediate — fix within 30 min |
| **P1** | Major feature broken (e.g. payments not saving, portal search broken) | Fix within 2 hours |
| **P2** | Minor feature broken or visual glitch | Fix in next release |

---

## P0 Response steps

### 1. Assess

Open the app and identify the symptom:

- **Blank white page** → likely a JS crash at startup. Check browser console for the error.
- **"Carregando..." forever** → Supabase connection failing. Check network tab.
- **DB writes not saving** → RLS may be re-enabled, or Supabase project paused.
- **Portal form error on submit** → validation or Supabase write error.

### 2. Check Supabase

1. Log in to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Verify the project is **Active** (not paused — free tier pauses after 1 week of inactivity)
3. If paused, click **Restore** (takes ~30 seconds)
4. Check **Logs → API logs** for recent errors

### 3. Check Vercel

1. Log in to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Open the project → **Deployments**
3. Find the latest production deployment and check its build log for errors
4. If the deploy failed, the previous version is still live — identify when it broke

### 4. Rollback if needed

If a recent deploy introduced the issue, rollback immediately. See [rollback runbook](rollback.md).

### 5. Fix forward if rollback isn't enough

If the issue is in the DB (RLS, missing table, bad data) and not in the code:

- **RLS re-enabled:** Run `ALTER TABLE <table> DISABLE ROW LEVEL SECURITY;` in the Supabase SQL Editor
- **Supabase outage:** Check [status.supabase.com](https://status.supabase.com) — nothing to do but wait
- **Bad data:** Use the Supabase table editor to correct the data directly

### 6. Communicate

Notify the registration team as soon as you have a status update:

- What broke
- What's being done
- ETA for resolution (or that it's already resolved)

### 7. Post-incident

After the incident is resolved:

- Add a CHANGELOG.md entry under the next version (even if the fix is in the same release)
- If a code fix was pushed directly to `master`, open a follow-up PR documenting the change
- Update [troubleshooting.md](../troubleshooting.md) if the root cause wasn't documented there

---

## Known fragile points

| Area | Risk | Mitigation |
|---|---|---|
| Supabase RLS | If ever re-enabled, all writes silently fail | Verify RLS status after any DB migration |
| Supabase free tier | Project pauses after 7 days of inactivity | Upgrade to Pro tier for events; or restore before the event day |
| JSX syntax errors in deploy | Build succeeds but runtime crashes on that component | Run `npm run build` locally before merging to master |
| `.update().eq()` ordering | New Supabase query code may accidentally use v1 style | Always write filter after mutation; `npm run lint` won't catch this |
