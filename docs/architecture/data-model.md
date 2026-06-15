# Modelo de dados

Diagrama de entidades e relacionamentos do banco de dados Supabase (schema v2).

> Este documento é voltado para desenvolvedores. Membros e usuários internos não precisam conhecer esta estrutura.

---

## Entidades e relacionamentos

```mermaid
erDiagram
    churches ||--o{ members : "pertence a"
    churches ||--o{ assistance_groups : "tem"
    families ||--o{ members : "agrupa"
    assistance_groups ||--o{ members : "inclui"
    members ||--o{ registrations : "faz"
    events ||--o{ registrations : "recebe"
    categories ||--o{ registrations : "classifica"
    functions ||--o{ registrations : "atribui"
    registrations ||--o{ approvals : "requer"
    app_users ||--o{ approvals : "processa"
    events ||--o{ rosters : "gera"
    members ||--o{ rosters : "aparece em"

    churches {
        uuid id
        string name
        boolean is_custom
    }
    families {
        uuid id
        string name
        boolean payment_exempt
    }
    members {
        uuid id
        string full_name
        date birth_date
        string gender
        uuid church_id
        uuid family_id
        uuid assistance_group_id
        string church_custom
        boolean is_visitor
    }
    events {
        uuid id
        string name
        date event_date
        int max_capacity
        date payment_deadline
    }
    registrations {
        uuid id
        uuid member_id
        uuid event_id
        uuid category_id
        uuid function_id
        string status
        boolean payment_confirmed
        timestamp created_at
    }
    app_users {
        uuid id
        string name
        string role
        string pin
    }
    approvals {
        uuid id
        uuid registration_id
        uuid app_user_id
        string decision
        timestamp decided_at
    }
```
