# Troubleshooting: Sync and Real-Time Issues

---

## Clerk B doesn't see Clerk A's registrations without refreshing

**Symptom:** Two clerks are working simultaneously. One registers someone, but the other's screen doesn't update until they manually refresh.

**Most likely cause:** Supabase Realtime subscriptions are not active.

**Check in order:**

1. **RLS is enabled** — Supabase Realtime checks RLS before delivering events. If RLS is enabled on the `registrations` table, the anon role gets no events. Disable RLS:
   ```sql
   ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;
   ALTER TABLE approvals    DISABLE ROW LEVEL SECURITY;
   ```

2. **Realtime not enabled on the table** — In Supabase Dashboard → Database → Replication, verify that `registrations` and `approvals` are listed under "Source Tables". If not, enable them.

3. **WebSocket connection dropped** — The browser may have lost the WebSocket connection (common on spotty event-venue WiFi). Refreshing the page re-establishes the connection.

4. **Supabase project on the free tier** — Free tier has connection limits. With multiple simultaneous clerk connections, some may be dropped. Upgrade to the Pro tier if this is a recurring issue during events.

---

## "Atualizado!" toast appears but change doesn't persist

**Symptom:** Clicking Pago shows a "Atualizado!" notification but refreshing the page shows the old value.

**Cause:** Optimistic UI updates local React state immediately (hence the toast), but the Supabase write failed silently.

**Diagnosis:**
1. Open DevTools → Network tab
2. Make the change
3. Look for a `PATCH` or `UPDATE` request to Supabase
4. If the response is empty (`[]` or `{}` with no rows affected), the write failed

**Common causes:**
- RLS enabled (write blocked without an error message returned to the client)
- Network timeout during a slow connection
- Supabase project paused

---

## Pastor's approval queue doesn't update when a clerk creates an excedente request

**Symptom:** A clerk submits an excedente (over-capacity) request, but the pastor's approval queue doesn't show it.

**Check in order:**

1. Verify RLS is disabled on the `approvals` table
2. Verify Realtime is enabled for `approvals` in Supabase → Database → Replication
3. Ask the pastor to refresh their page — the approval should appear in the list

---

## Toast notifications not appearing

**Symptom:** Actions complete (registration saved, payment marked) but no toast appears.

The `notify()` function in `useAppData.js` fires a brief toast. If it's not appearing:

1. The browser may be blocking notifications — check browser notification permissions (though the app uses in-app toasts, not OS notifications)
2. A call with `{ silent: true }` was made — public-facing cancellations intentionally suppress toasts
3. The component may have unmounted before the toast fired (e.g. navigating away immediately)

This is cosmetic — if the action completed (verifiable by refreshing), the missing toast is not a functional issue.

---

## Data is stale after returning to the app after a long break

**Symptom:** Opened the app hours later and the data shown is outdated.

The app loads all data on mount. If the browser tab was left open without refreshing, the in-memory data can become stale relative to the DB.

**Fix:** Refresh the page. Data is reloaded fresh on every mount.

If the app will be used over a multi-day event, consider implementing a manual refresh button or a timed reload — this is a known gap.

---

## Related

- [Troubleshooting: Registration Errors](registration-errors.md)
- [Architecture: Overview](../architecture/overview.md) — Realtime subscription setup
- [Runbook: Incident Response](../runbooks/incident-response.md)
