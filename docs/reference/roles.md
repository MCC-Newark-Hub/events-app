# Reference: Roles

The system has two distinct sets of roles: **system roles** (control login access and views) and **church/ministry roles** (describe a member's function in the church).

---

## System roles

Set on the `app_users` table. Determines which view a user sees after logging in.

| Role | View | Description |
|---|---|---|
| `admin` | Admin panel | Full access to all tabs: registrations, events, teams, groups, reports, badges, directory, users |
| `clerk` | Clerk desk | Register participants, mark payment, process check-in, manage waitlist |
| `pastor` | Pastor dashboard | View and approve/deny capacity override (excedente) requests |
| `ga_leader` | GA Leader view | See and manage registrations for members of their assistance group |
| `team_leader` | Team Leader view | Manage their service team's roster for the current event |

Public users (no PIN) can access the self-registration portal and Consultar Inscrição without any system role.

---

## Church / ministry roles

Stored in the `role` (text) and `roles` (text[]) columns on the `members` table and carried onto `registrations.role`. Used for:

- Auto-exemption (Pastor and Ungido are always fee-exempt)
- Deadline exemption (Obreiro roles and service team members are exempt from payment deadlines)
- Badge display
- Filtering and reporting

### Exempt roles (fee = $0, always)

| Role | Notes |
|---|---|
| Pastor | Primary pastor of a congregation |
| Ungido | Ordained minister |

### Obreiro roles (exempt from payment deadlines)

| Role |
|---|
| Diácono / Diaconisa |
| Obreiro / Obreira |
| Presbítero / Presbítera |

### Other common roles

| Role | Category |
|---|---|
| Grupo de Louvor | Worship |
| Líder de Jovens | Youth |
| Líder de Adolescentes | Adolescents |
| Líder de Crianças | Children |
| Secretário(a) | Administration |
| Tesoureiro(a) | Finance |
| Membro | General member |

The full list is maintained in `src/constants/index.js` (`ROLE_OPTIONS`) and can be overridden by populating the `functions` table in Supabase.

---

## Related

- [Reference: Permissions](permissions.md)
- [Explanation: Registration Rules](../explanation/registration-rules.md)
