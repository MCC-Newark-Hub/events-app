# Explanation: Church Hierarchy

Understanding how ICM Maranatha is structured helps explain why the data model is shaped the way it is.

---

## The organizational structure

ICM (Igreja Cristã Maranatha) is a Pentecostal denomination with congregations across Brazil and the diaspora. The Newark hub coordinates events for approximately 15 congregations across the northeastern US and Canada.

```
ICM Maranatha (denomination)
└── Polo Newark (regional hub — this system)
    ├── Newark, NJ — EUA           ← main congregation
    ├── Boston, MA — EUA
    ├── Philadelphia, PA — EUA
    ├── Toronto, ON — Canada
    └── ... (15 congregations total)
        │
        ├── Families
        │   └── Family groups (e.g. "Família Silva") — members share family_id
        │
        └── Assistance Groups (Grupos de Assistência / GA)
            └── Small pastoral groups led by a GA leader
                └── ~10–20 members per GA
```

---

## Members

Every registered person in the system is a **member** (`members` table). Members have:
- A **church** (one of the 15 congregations)
- A **category** (age group)
- A **role** (ministry function, optional)
- A **family_id** (links them to a family group, optional)
- A **ga_id** (links them to an assistance group, optional)

Members are imported via CSV or added manually through the directory.

---

## Families

A **family** (`families` table) is a named group of members who travel and register together. Family grouping matters for:
- The registration portal (add family members in step 2)
- Consultar Inscrição (cancel or add a family member from one lookup)
- Payment deadline exemptions (if one family member is an Obreiro or on a service team, the whole family is exempt from the deadline)

The `families.member_ids` array tracks which members belong to each family.

---

## Assistance Groups (GA)

A **Grupo de Assistência** (`assistance_groups` table) is a small pastoral cell group led by a `ga_leader`. Each GA leader sees only their group's registrations in the GA Leader view.

GA membership is set on the member record (`members.ga_id`). Changing the GA on a member updates their view for all future events.

---

## Churches

The 15 congregations are stored in the `churches` table (or fall back to the `CHURCH_LIST` constant). Each church has:
- A canonical **display name** (e.g. "Newark, NJ — EUA") used consistently across badges, reports, and the portal
- Optional `city`, `state`, `country`, `region` fields (added in migration 005)
- An optional `pastor_id` (FK to the lead pastor's member record, added in migration 007)

---

## Why this matters for event registration

When someone registers for an event, their **church** appears on the badge and in reports, allowing organizers to:
- Verify they belong to one of the 15 affiliated congregations
- Sort and filter attendance by congregation
- Assign service teams by church

GA leaders can filter the registration list to their group, reducing the workload of a single admin reviewing all ~391 members' registrations.

---

## Related

- [Architecture: Data Model](../architecture/data-model.md)
- [Reference: Roles](../reference/roles.md)
- [Explanation: Registration Rules](registration-rules.md)
