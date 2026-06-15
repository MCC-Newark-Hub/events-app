# Troubleshooting

---

## Production is blank / white screen

**Symptom:** The app loads but shows nothing, or the browser console has a JS error.

1. Check the Vercel deployment log for build errors
2. Open browser DevTools → Console for the specific error
3. If it's a JSX syntax error (vite:oxc), a bad character (e.g. typographic `"..."` quotes) got into JSX — find the file and line, fix the string to use proper ASCII quotes or JSX fragments
4. If the error is `Cannot read properties of undefined` — a prop or data field is being accessed before the data loads; add a null guard

---

## DB writes not saving (silent failure)

**Symptom:** Marking a registration as paid appears to work, but reloading the page reverts the change.

**Most likely cause:** Row Level Security is enabled on the `registrations` table.

**Fix:**
```sql
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;
-- Repeat for any other affected table
```

Verify RLS status:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should show `rowsecurity = false`.

---

## `sb.from(...).eq is not a function`

**Cause:** Supabase JS v2 requires the filter to come *after* the mutation:

```js
// WRONG (v1 style)
await sb.from("registrations").eq("id", id).update(data);

// CORRECT (v2)
await sb.from("registrations").update(data).eq("id", id);
```

Search for any `.eq(...).update(` or `.eq(...).delete(` pattern and invert the chain.

---

## Registration numbers duplicating

**Symptom:** Two family members submitted together get the same registration number.

**Cause:** `addReg` was reading stale `seq` state inside concurrent calls. The sequence counter must use `seqRef.current`, not the `seq` state variable.

```js
// WRONG
const num = seq + 1;
setSeq(num);

// CORRECT
seqRef.current += 1;
const num = seqRef.current;
```

---

## Real-time not delivering updates between clerks

**Symptom:** Clerk A registers someone, Clerk B doesn't see it without refreshing.

**Cause:** Supabase Realtime checks RLS before delivering events. If RLS is enabled, the anon role gets no events.

**Fix:** Disable RLS (see above). Real-time works correctly with RLS disabled.

---

## Family registration fails with 409 / FK error

**Symptom:** Console shows a FK constraint violation on `registrations_family_id_fkey`.

**Cause:** A temporary string ID (e.g. `"FAM-" + Date.now()`) was passed as `family_id`. This column is a FK referencing `families.id` and must either reference a real row or be `null`.

**Fix:** Pass `familyId: null` when creating portal registrations. Family grouping uses the batch token in the `note` field, not the `family_id` FK.

---

## Portal search shows "Nenhum membro encontrado" for known members

**Symptom:** A member searches their name on the public portal and gets no results, even though they're in the directory.

**Most likely cause:** `members` table is empty or didn't load. Check:
1. Browser DevTools → Network tab → look for the Supabase `members` request and inspect the response
2. If the response is empty, the table may need to be seeded
3. If the request fails (401/403), check that RLS is disabled on `members`

---

## "Já inscrito" shown but the participant wants to re-register

**Symptom:** A member's registration was cancelled but the portal still shows "Já inscrito".

**Cause:** The portal checks for non-cancelled registrations: `!r.cancelled`. If the registration was cancelled correctly in the DB, the portal should allow re-registration. Verify the `cancelled` flag in Supabase:

```sql
SELECT reg_number, cancelled FROM registrations WHERE member_id = '<id>';
```

---

## Supabase connection issues in local dev

**Symptom:** The app loads but shows "Carregando..." indefinitely or network errors.

1. Verify `.env.local` exists and has the correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY`
2. Restart the dev server after editing `.env.local` — Vite does not hot-reload env file changes
3. Check Supabase project status at [supabase.com/dashboard](https://supabase.com/dashboard) — projects pause after 1 week of inactivity on the free tier
4. If the project is paused, click **Restore** in the dashboard

---

## Vite build fails locally but passes in CI / vice versa

- Clear the build cache: `rm -rf node_modules/.vite dist`
- Re-install: `npm ci`
- Check Node.js version matches: `node -v` (must be 18+)
