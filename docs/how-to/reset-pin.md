# How-to: Reset or Change a User PIN

Use this guide to change a staff member's PIN or to set up a new user account.

**Role required:** Admin

> The system uses 4-digit PINs for staff authentication — there are no passwords or email-based logins. Only an admin can create or change PINs.

---

## Change an existing user's PIN

1. Log in as Admin
2. Click the **Users** tab (or **Directory → Users**) in the sidebar
3. Find the user whose PIN needs to change
4. Click **Edit** on their row
5. Enter the new 4-digit PIN in the PIN field
6. Click **Save**

The new PIN is active immediately — the user's current session is not invalidated, but the next login will require the new PIN.

---

## Create a new staff user

1. Log in as Admin
2. Go to the **Users** tab
3. Click **New User**
4. Fill in:
   - **Name** — displayed in the top bar when logged in
   - **PIN** — 4 digits; choose something the user can remember but not easily guessed
   - **Role** — see [Reference: Roles](../reference/roles.md)
5. Click **Save**

Share the PIN with the user through a secure channel (direct message, in person). Do not send PINs by email or group chat.

---

## Deactivate a user

The app does not have an "inactive" flag for users. To prevent someone from logging in:

1. Go to the **Users** tab
2. Delete their user record, or change their PIN to something they don't know

If you delete the record, any audit trail entries from that user (in the `registered_by` field on registrations) remain intact — only the login access is removed.

---

## If an admin forgets their PIN

No self-service PIN reset exists. Options:

1. Another admin can log in and change the PIN via the Users tab
2. If no admin can log in, update the PIN directly in the Supabase table:

```sql
UPDATE app_users
SET pin = '1234'
WHERE name = 'Admin Name';
```

---

## PIN security guidelines

- Use a unique PIN per person — don't share PINs between staff members
- Avoid simple sequences (1234, 0000) for roles with sensitive access (admin)
- Change PINs after an event if the device was shared with temporary volunteers
- The clerk PIN is sufficient for registration tasks — only give admin PINs to administrators

---

## Related

- [Reference: Roles and Permissions](../reference/roles.md)
- [Reference: Permissions Matrix](../reference/permissions.md)
