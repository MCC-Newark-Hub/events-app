import SearchSelect from "@/components/SearchSelect";
import { ROLE_GROUPS } from "@/constants";

// A member can hold several roles at once (e.g. worship team + instrumentalist).
// Search-and-chip UI, extracted from AdminView's member editor so the same
// multi-role editing is available everywhere a member gets edited — a member
// edited through a single-select role field would silently lose every role
// but the one picked.
export default function RolesMultiSelect({ roles, onChange, label = "Funções" }) {
  const current = roles || [];
  return (
    <div>
      <label>{label}</label>
      <SearchSelect
        value=""
        onSelect={(r) => {
          if (!r || current.includes(r)) return;
          onChange([...current, r]);
        }}
        items={ROLE_GROUPS.flatMap((g) => g.roles.map((r) => ({ id: r, name: r, group: g.group })))
          .filter((r) => !current.includes(r.id))
          .sort((a, b) => a.name.localeCompare(b.name))}
        getLabel={(r) => r.name}
        getId={(r) => r.id}
        placeholder="Buscar função…"
      />
      {current.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
          {current.map((r) => (
            <span key={r} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "var(--sidebar-active-bg)", border: "1px solid var(--primary)", borderRadius: 12, padding: "2px 8px", fontSize: 12 }}>
              {r}
              <button onClick={() => onChange(current.filter((x) => x !== r))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
