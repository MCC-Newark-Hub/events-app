# Troubleshooting: Login Issues

---

## "PIN incorreto" after entering the correct PIN

**Possible causes:**

1. **Typo in the PIN** — the system is case-insensitive but PIN digits must be exact. Try again carefully.
2. **Wrong PIN on file** — an admin may have changed the PIN. Ask the admin to verify what PIN is set for your account.
3. **Supabase project is paused** — free-tier Supabase projects pause after 7 days of inactivity. If no one has used the system recently, the database is offline. An admin must log in to [supabase.com/dashboard](https://supabase.com/dashboard) and click **Restore**. The app will then work again within 30 seconds.
4. **Empty `app_users` table** — on a fresh deployment, no users exist yet. An admin must create user records in Supabase directly (see [Local Setup — Seed test data](../setup-local.md)).

**How to verify Supabase is running:**
Open browser DevTools → Network tab → attempt a login → look for a request to `supabase.co`. A 404 or connection error confirms the project is offline.

---

## Logged in as the wrong role / wrong view appears

The role is stored in `localStorage` under `mcc_view`. If a user was previously logged in with a different PIN on the same device:

1. Sign out using the button in the top bar
2. Log back in with the correct PIN

If the issue persists, clear the browser's localStorage:
- DevTools → Application → Storage → Local Storage → delete `mcc_pin` and `mcc_view`
- Refresh the page and log in again

---

## Session disappears on page refresh

The session is stored in `localStorage`, which persists across page refreshes in normal use. If the session is lost on refresh:

1. The browser may be in **private/incognito mode** — localStorage is cleared when the private window closes. Use a regular browser window.
2. The browser may be set to clear localStorage on close. Check browser privacy settings.
3. Safari on iOS sometimes clears localStorage aggressively. Use Chrome or Firefox.

---

## App shows public portal instead of the login form

If the URL has `?checkin=` or `?selfcheckin=` parameters, the app bypasses the login screen entirely and shows the check-in or kiosk view. Remove those parameters from the URL to see the normal home screen.

---

## Forgot which PIN is set for a user

Only an admin can see and change PINs. See [How-to: Reset or Change a User PIN](../how-to/reset-pin.md).

If no admin can log in, update the PIN directly in Supabase:

```sql
UPDATE app_users
SET pin = '0000'
WHERE name = 'Admin Name';
```

---

## Related

- [How-to: Reset or Change a User PIN](../how-to/reset-pin.md)
- [Explanation: Security Model](../explanation/security-model.md)
