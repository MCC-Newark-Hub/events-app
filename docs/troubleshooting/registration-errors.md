# Troubleshooting: Registration Errors

---

## Portal search returns no results for a known member

**Symptom:** A participant types their name in the portal and gets "Nenhum membro encontrado".

**Check in order:**

1. **Spelling / accent mismatch** — the search is accent-insensitive ("joao" finds "João"), but must match the name stored in the directory. Ask the participant if their name might be stored differently (e.g. "José" vs "Jose" vs their nickname).

2. **Members didn't load** — look for the small counter under the search box: "X membros disponíveis — digite para buscar". If it shows 0, the `members` table didn't load. Check:
   - Browser DevTools → Network tab → look for the Supabase request to `members`
   - If it returned a 401 or empty array, RLS may be enabled on the `members` table
   - Run `ALTER TABLE members DISABLE ROW LEVEL SECURITY;` in Supabase SQL Editor

3. **Member not in the directory** — if the member is genuinely missing, the participant can:
   - Use the manual entry option in step 2 of the portal to add themselves as unverified
   - Or visit the registration desk, where a clerk can add them manually

---

## "Este participante já está inscrito neste evento"

**Symptom:** The portal blocks registration with an "already registered" message.

This is correct behavior — a member can only have one active (non-cancelled) registration per event. If the participant needs help with their existing registration, direct them to **Consultar Inscrição** on the home screen.

If the registration should be cancelled to allow re-registration, a clerk must cancel it via the Clerk view.

---

## Family member registration shows 409 / FK constraint error in the console

**Symptom:** Console shows a Supabase error with `registrations_family_id_fkey`.

**Cause:** A temporary string ID is being passed as `family_id`. This field is a FK referencing `families.id` — only null or a real `families` row ID is valid.

**Fix:** In `handleSubmit` in `PublicPortal.jsx`, ensure `familyId: null` is passed for all portal registrations. Family grouping uses the batch token in the `note` field, not this FK.

---

## Registration numbers are duplicating

**Symptom:** Two family members registered at the same time get the same registration number.

**Cause:** A stale `seq` state value is being read inside concurrent `addReg` calls.

**Fix:** The sequence counter must use `seqRef.current` (a `useRef`), not the `seq` state variable. Reads from `useRef` are not subject to React's closure-captured stale state problem. See `useAppData.js`.

---

## Registration submitted on the portal but not appearing in the admin list

**Symptom:** A participant says they completed registration, but the clerk can't find them.

**Check in order:**

1. **DB write failed silently** — check if RLS is enabled. In Supabase SQL Editor:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
   ```
   All tables should show `rowsecurity = false`.

2. **Real-time didn't deliver the update** — the clerk's browser may not have received the Realtime event. Refresh the clerk view — the registration should appear.

3. **Supabase project paused mid-session** — the write silently failed. Ask the participant for their name, search on the portal, and re-register if needed.

---

## Paid status resets after page refresh

**Symptom:** Marking a registration as Paid appears to work, but the status reverts after reload.

**Cause:** The DB write is failing silently (optimistic UI hides the failure). RLS is the most common cause.

**Diagnosis:** Open browser DevTools → Network tab → mark a registration as paid → look for the Supabase PATCH request. If it returns a 401 or the response body is empty, check RLS:

```sql
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;
```

---

## Related

- [Troubleshooting: Login Issues](login-issues.md)
- [Explanation: Registration Rules](../explanation/registration-rules.md)
- [Reference: Registration Statuses](../reference/statuses.md)
- [Runbook: Incident Response](../runbooks/incident-response.md)
