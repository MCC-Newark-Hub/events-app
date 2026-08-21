import { useState } from "react";
import { X } from "lucide-react";
import { ROLE_GROUPS } from "@/constants";
import { sb } from "@/lib/supabase";

const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const FUNC_GROUPS = [
  { id: "intercessao", label: "Grupo de Intercessão",              roles: ["Grupo de Intercessão", "Grupo de Oração"] },
  { id: "louvor",      label: "Grupo de Louvor e Instrumentistas", roles: ["Grupo de Louvor", "Instrumentista", "Instrumentista Aprendiz", "Operador de Som"] },
  { id: "professoras", label: "Professoras",                       roles: ["Professor(a) de Crianças", "Professor(a) de Crianças 0-3", "Professor(a) de Intermediários", "Professor(a) de Adolescentes", "Professor(a) de Jovens", "Professor de Seminário"] },
  { id: "ga",          label: "Responsáveis de GA",                gaLeaders: true },
  { id: "secretaria",  label: "Secretaria",                        roles: ["Secretário(a) de Igreja", "Secretário(a) de GA"] },
  { id: "tesouraria",  label: "Tesouraria",                        roles: ["Primeiro Tesoureiro", "Segundo Tesoureiro", "Comissão de Contas"] },
  { id: "traducao",    label: "Tradutores",                        roles: ["Tradutor", "Intérprete de Libras"] },
];

export default function MemberFunctionsView({ members, setMembers, gas, notify, churchLock, filterMemberIds }) {
  const readOnly = !setMembers;
  const [search, setSearch] = useState("");
  const [filterChurch, setFilterChurch] = useState(churchLock || "");
  const [roleEditing, setRoleEditing] = useState(null);
  const [editingRoles, setEditingRoles] = useState([]);
  const [ministryAddGroup, setMinistryAddGroup] = useState(null);
  const [ministryAddSearch, setMinistryAddSearch] = useState("");
  const [ministryAddRole, setMinistryAddRole] = useState("");

  const churchOptions = !churchLock && !filterMemberIds
    ? [...new Set((members || []).map((m) => m.church).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt", { sensitivity: "base" }))
    : null;

  const applyFilters = (mems) => {
    let filtered = mems;
    if (filterMemberIds) {
      filtered = filtered.filter((m) => filterMemberIds.includes(m.id));
    } else if (filterChurch) {
      filtered = filtered.filter((m) => m.church === filterChurch);
    }
    return filtered
      .filter((m) => !search || norm(m.name).includes(norm(search)) || norm(m.church || "").includes(norm(search)))
      .sort((a, b) => norm(a.name).localeCompare(norm(b.name)));
  };

  const gaLeaderEntries = (gas || [])
    .filter((g) => g.leaderId)
    .map((g) => {
      const m = (members || []).find((x) => x.id === g.leaderId);
      return m ? { ...m, _gaName: g.name } : null;
    })
    .filter(Boolean);

  const openRoleEdit = (m) => {
    setRoleEditing(m);
    setEditingRoles(m.roles || []);
  };

  const saveRoles = async () => {
    const { error } = await sb.from("members").update({ roles: editingRoles }).eq("id", roleEditing.id).select();
    if (error) { notify("Erro: " + error.message); return; }
    setMembers((p) => p.map((m) => m.id === roleEditing.id ? { ...m, roles: editingRoles } : m));
    notify("Funções atualizadas!");
    setRoleEditing(null);
  };

  const addMemberToGroup = async (member, role) => {
    const newRoles = [...new Set([...(member.roles || []), role])];
    const { error } = await sb.from("members").update({ roles: newRoles }).eq("id", member.id).select();
    if (error) { notify("Erro: " + error.message); return; }
    setMembers((p) => p.map((m) => m.id === member.id ? { ...m, roles: newRoles } : m));
    notify(`${member.name} adicionado(a) como ${role}!`);
    setMinistryAddSearch("");
  };

  const addablePool = filterMemberIds
    ? (members || []).filter((m) => filterMemberIds.includes(m.id))
    : churchLock
      ? (members || []).filter((m) => m.church === churchLock)
      : (members || []);

  const addSearchResults = ministryAddSearch.length > 1
    ? addablePool.filter((m) => norm(m.name).includes(norm(ministryAddSearch))).slice(0, 6)
    : [];

  return (
    <>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        <div className="sb" style={{ maxWidth: 300 }}>
          <span className="si-icon" style={{ fontSize: 14 }}>🔍</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar…" />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
              <X size={14} />
            </button>
          )}
        </div>
        {churchLock ? (
          <span style={{ fontSize: 13, color: "var(--muted)", padding: "4px 10px", background: "var(--bg2)", borderRadius: 6, border: "1px solid var(--border)" }}>
            ⛪ {churchLock}
          </span>
        ) : churchOptions && (
          <select
            value={filterChurch}
            onChange={(e) => setFilterChurch(e.target.value)}
            style={{ fontSize: 13, padding: "5px 8px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--card-bg)", color: filterChurch ? "var(--text)" : "var(--muted)" }}
          >
            <option value="">Todas as Igrejas</option>
            {churchOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {roleEditing && !readOnly && (
        <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && setRoleEditing(null)}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, margin: 0 }}>Funções — {roleEditing.name}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setRoleEditing(null)}>✕</button>
            </div>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>{roleEditing.church}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {(ROLE_GROUPS || []).map((g) => (
                <div key={g.group}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>{g.group}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {g.roles.map((r) => {
                      const on = editingRoles.includes(r);
                      return (
                        <button
                          key={r}
                          onClick={() => setEditingRoles((p) => on ? p.filter((x) => x !== r) : [...p, r])}
                          style={{ fontSize: 12, padding: "4px 10px", borderRadius: 20, border: `1px solid ${on ? "var(--icm-crimson)" : "var(--border)"}`, background: on ? "var(--icm-crimson)" : "var(--card-bg)", color: on ? "#fff" : "var(--text)", cursor: "pointer", fontWeight: on ? 600 : 400 }}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveRoles}>Salvar</button>
              <button className="btn btn-ghost" onClick={() => setRoleEditing(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
        {FUNC_GROUPS.map((group) => {
          const mems = applyFilters(
            group.gaLeaders
              ? gaLeaderEntries
              : (members || []).filter((m) => (m.roles || []).some((r) => (group.roles || []).includes(r)))
          );
          return (
            <div key={group.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", background: "#f8f9fb", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{group.label}</h4>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span className={`badge ${mems.length > 0 ? "badge-blue" : "badge-gray"}`}>{mems.length}</span>
                  {!readOnly && !group.gaLeaders && (
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => {
                        if (ministryAddGroup === group.id) { setMinistryAddGroup(null); setMinistryAddSearch(""); setMinistryAddRole(""); }
                        else { setMinistryAddGroup(group.id); setMinistryAddSearch(""); setMinistryAddRole(group.roles.length === 1 ? group.roles[0] : ""); }
                      }}
                    >
                      {ministryAddGroup === group.id ? "✕" : "+ Adicionar"}
                    </button>
                  )}
                </div>
              </div>

              {!readOnly && ministryAddGroup === group.id && (
                <div style={{ padding: "10px 12px", background: "#fffbeb", borderBottom: "1px solid var(--border)" }}>
                  {group.roles.length > 1 && (
                    <select value={ministryAddRole} onChange={(e) => setMinistryAddRole(e.target.value)} style={{ marginBottom: 6, fontSize: 13 }}>
                      <option value="">Selecionar função…</option>
                      {group.roles.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  )}
                  <input
                    value={ministryAddSearch}
                    onChange={(e) => setMinistryAddSearch(e.target.value)}
                    placeholder="Buscar membro…"
                    style={{ marginBottom: 4 }}
                  />
                  {addSearchResults.map((m) => {
                    const alreadyIn = (m.roles || []).some((r) => group.roles.includes(r));
                    return (
                      <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderTop: "1px solid var(--border)" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</div>
                          <div style={{ fontSize: 11, color: "var(--muted)" }}>{m.church}</div>
                        </div>
                        {alreadyIn ? (
                          <span className="badge badge-gray" style={{ fontSize: 10 }}>Já cadastrado</span>
                        ) : (
                          <button
                            className="btn btn-ok btn-xs"
                            disabled={!ministryAddRole}
                            title={!ministryAddRole ? "Selecione uma função acima" : ""}
                            onClick={() => { if (ministryAddRole) addMemberToGroup(m, ministryAddRole); }}
                          >
                            +
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {ministryAddSearch.length > 1 && addSearchResults.length === 0 && (
                    <p style={{ fontSize: 12, color: "var(--muted)", margin: "6px 0 0" }}>Nenhum membro encontrado.</p>
                  )}
                </div>
              )}

              <div style={{ padding: "4px 12px 8px" }}>
                {mems.length === 0 ? (
                  <p style={{ color: "var(--muted)", fontSize: 12, padding: "8px 0", margin: 0, fontStyle: "italic" }}>Nenhum membro cadastrado.</p>
                ) : (
                  mems.map((m) => {
                    const subRoles = group.gaLeaders
                      ? [m._gaName]
                      : (m.roles || []).filter((r) => (group.roles || []).includes(r));
                    return (
                      <div
                        key={m.id + (m._gaName || "")}
                        onClick={() => !readOnly && !group.gaLeaders && openRoleEdit(m)}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "6px 0", borderBottom: "1px solid #f3f4f6", cursor: (!readOnly && !group.gaLeaders) ? "pointer" : "default" }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</div>
                          <div style={{ fontSize: 11, color: "var(--muted)" }}>
                            {m.church}{subRoles.length > 0 && <span style={{ marginLeft: 4 }}>· {subRoles.join(", ")}</span>}
                          </div>
                        </div>
                        {!readOnly && !group.gaLeaders && (
                          <span style={{ fontSize: 11, color: "#9ca3af", flexShrink: 0, alignSelf: "center" }}>✏</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
