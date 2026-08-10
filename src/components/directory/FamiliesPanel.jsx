import { useState } from "react";
import { Plus, Pencil, Trash2, ChevronUp, X } from "lucide-react";
import { sb } from "@/lib/supabase";
import { mapFamily } from "@/hooks/useAppData";
import SearchSelect from "@/components/SearchSelect";
import ConfirmDelete from "@/components/ConfirmDelete";
import BulkBar from "@/components/BulkBar";

const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function familyGas(family, members, gas) {
  const ids = [...new Set(
    (family.memberIds || []).map((mid) => (members || []).find((m) => m.id === mid)?.gaId).filter(Boolean)
  )];
  return ids.map((id) => (gas || []).find((g) => g.id === id)).filter(Boolean);
}

export default function FamiliesPanel({ members, families, setFamilies, gas, showGroup, showChurch, notify }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");   // "name" | "group" | "church"
  const [groupBy, setGroupBy] = useState("none"); // "none" | "group" | "church"
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({});
  const [deleting, setDeleting] = useState(null);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const isNew = !editing?.id;
  const toggleSel = (id) => setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const selAll = (ids) => setSelected(ids);
  const clearSel = () => setSelected([]);
  const openEdit = (row, defaults) => { setEditing(row); setFormData(defaults); };
  const openNew = (defaults) => { setEditing({ id: null }); setFormData(defaults); };

  const saveFamily = async () => {
    if (!formData.name?.trim()) { notify("Nome obrigatório."); return; }
    setSaving(true);
    const ids = (formData.selectedMembers || []).map((m) => m.id);
    const row = { name: formData.name.trim(), member_ids: ids };
    if (isNew) {
      row.id = "F" + String(Date.now()).slice(-8);
      const { data, error } = await sb.from("families").insert(row).select().single();
      if (error) { notify("Erro: " + error.message); setSaving(false); return; }
      setFamilies((prev) => [...prev, mapFamily(data)]);
      notify("Criado!");
    } else {
      row.id = editing.id;
      const { error } = await sb.from("families").update(row).eq("id", row.id);
      if (error) { notify("Erro: " + error.message); setSaving(false); return; }
      setFamilies((prev) => prev.map((f) => f.id === row.id ? mapFamily({ ...f, ...row }) : f));
      notify("Atualizado!");
    }
    setSaving(false);
    setEditing(null);
    setFormData({});
  };

  const deleteFamilies = async (ids) => {
    const { error } = await sb.from("families").delete().in("id", ids);
    if (error) { notify("Erro: " + error.message); setDeleting(null); return; }
    setFamilies((prev) => prev.filter((f) => !ids.includes(f.id)));
    notify(`${ids.length} item(s) excluído(s).`);
    setDeleting(null);
    clearSel();
  };

  const enrich = (f) => {
    const gs = familyGas(f, members, gas);
    const gaName = gs.map((g) => g.name).join(", ") || "—";
    const churchName = [...new Set(gs.map((g) => g.church).filter(Boolean))].join(", ") || "—";
    return { ...f, gaName, churchName };
  };

  const rawList = (families || []).map(enrich).filter((f) =>
    norm(f.name).includes(norm(search)) ||
    (showGroup && norm(f.gaName).includes(norm(search))) ||
    (showChurch && norm(f.churchName).includes(norm(search))) ||
    (search.length > 0 && (f.memberIds || []).some((mid) => {
      const m = (members || []).find((x) => x.id === mid);
      return m && norm(m.name).includes(norm(search));
    }))
  );

  const sorted = [...rawList].sort((a, b) => {
    if (sortBy === "group")  return (a.gaName || "").localeCompare(b.gaName || "")  || (a.name || "").localeCompare(b.name || "");
    if (sortBy === "church") return (a.churchName || "").localeCompare(b.churchName || "") || (a.name || "").localeCompare(b.name || "");
    return (a.name || "").localeCompare(b.name || "");
  });

  const allIds = sorted.map((f) => f.id).filter(Boolean);

  let groupedList = null;
  if (groupBy === "group" && showGroup) {
    const keys = [...new Set(sorted.map((f) => f.gaName))];
    groupedList = keys.map((k) => ({ key: k, items: sorted.filter((f) => f.gaName === k) }));
  } else if (groupBy === "church" && showChurch) {
    const keys = [...new Set(sorted.map((f) => f.churchName))];
    groupedList = keys.map((k) => ({ key: k, items: sorted.filter((f) => f.churchName === k) }));
  }

  // checkbox + name + church? + group? + members + actions
  const colCount = 3 + (showGroup ? 1 : 0) + (showChurch ? 1 : 0);

  const renderRow = (f) => (
    <tr key={f.id} style={{ background: selected.includes(f.id) ? "var(--sidebar-active-bg)" : "" }}>
      <td><input type="checkbox" checked={selected.includes(f.id)} onChange={() => toggleSel(f.id)} /></td>
      <td style={{ fontWeight: 500 }}>{f.name}</td>
      {showChurch && <td style={{ fontSize: 12, color: "var(--muted)" }}>{f.churchName}</td>}
      {showGroup && <td style={{ fontSize: 12 }}>{f.gaName !== "—" ? <span className="badge badge-gray" style={{ fontSize: 10 }}>{f.gaName}</span> : <span style={{ color: "var(--muted)" }}>—</span>}</td>}
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {(f.memberIds || []).slice(0, expanded === f.id ? undefined : 3).map((mid) => {
            const m = (members || []).find((x) => x.id === mid);
            return <span key={mid} className="badge badge-gray">{m ? m.name : mid}</span>;
          })}
          {(f.memberIds || []).length > 3 && (
            <button onClick={() => setExpanded(expanded === f.id ? null : f.id)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontSize: 12, padding: 0 }}>
              {expanded === f.id ? <ChevronUp size={14} /> : `+${(f.memberIds || []).length - 3} mais`}
            </button>
          )}
        </div>
      </td>
      <td>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn btn-ghost btn-xs" onClick={() => openEdit(f, { name: f.name, selectedMembers: (f.memberIds || []).map((mid) => (members || []).find((m) => m.id === mid)).filter(Boolean) })}><Pencil size={12} /></button>
          <button className="btn btn-danger btn-xs" onClick={() => setDeleting({ ids: [f.id], label: f.name })}><Trash2 size={12} /></button>
        </div>
      </td>
    </tr>
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <div className="sb" style={{ maxWidth: 280 }}>
          <span className="si-icon" style={{ fontSize: 14 }}>🔍</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar…" />
          {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><X size={14} /></button>}
        </div>

        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>Ordenar:</span>
          <button className={`btn btn-xs ${sortBy === "name" ? "btn-primary" : "btn-ghost"}`} onClick={() => setSortBy("name")}>Família</button>
          {showGroup  && <button className={`btn btn-xs ${sortBy === "group"  ? "btn-primary" : "btn-ghost"}`} onClick={() => setSortBy("group")}>Grupo</button>}
          {showChurch && <button className={`btn btn-xs ${sortBy === "church" ? "btn-primary" : "btn-ghost"}`} onClick={() => setSortBy("church")}>Igreja</button>}
        </div>

        {(showGroup || showChurch) && (
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Agrupar:</span>
            <button className={`btn btn-xs ${groupBy === "none"   ? "btn-primary" : "btn-ghost"}`} onClick={() => setGroupBy("none")}>Nenhum</button>
            {showGroup  && <button className={`btn btn-xs ${groupBy === "group"  ? "btn-primary" : "btn-ghost"}`} onClick={() => setGroupBy("group")}>Grupo</button>}
            {showChurch && <button className={`btn btn-xs ${groupBy === "church" ? "btn-primary" : "btn-ghost"}`} onClick={() => setGroupBy("church")}>Igreja</button>}
          </div>
        )}
      </div>

      {editing !== null && (
        <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && setEditing(null)}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, marginBottom: 18 }}>{isNew ? "Nova Família" : "Editar Família"}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><label>Nome *</label><input value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Família Silva" /></div>
              <div>
                <label>Membros</label>
                <SearchSelect
                  value=""
                  onSelect={(id) => {
                    if (!id) return;
                    const sel = (members || []).find((m) => m.id === id);
                    if (!sel) return;
                    const cur = formData.selectedMembers || [];
                    if (cur.find((m) => m.id === id)) return;
                    setFormData({ ...formData, selectedMembers: [...cur, sel] });
                  }}
                  items={(members || []).filter((m) => !(formData.selectedMembers || []).find((s) => s.id === m.id))}
                  getLabel={(m) => m.name}
                  getId={(m) => m.id}
                  placeholder="Buscar membro…"
                />
                {(formData.selectedMembers || []).length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {(formData.selectedMembers || []).map((m) => (
                      <span key={m.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "var(--sidebar-active-bg)", border: "1px solid var(--primary)", borderRadius: 12, padding: "2px 8px", fontSize: 12 }}>
                        {m.name}
                        <button onClick={() => setFormData({ ...formData, selectedMembers: (formData.selectedMembers || []).filter((x) => x.id !== m.id) })} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditing(null)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 2 }} disabled={saving} onClick={saveFamily}>{saving ? "Salvando…" : "Salvar"}</button>
            </div>
          </div>
        </div>
      )}

      {deleting && <ConfirmDelete label={deleting.label} count={deleting.ids.length}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleteFamilies(deleting.ids)} />}

      {selected.length > 0 && (
        <BulkBar selected={selected.length} total={allIds.length} label="famílias"
          onSelectAll={() => selAll(allIds)} onClearAll={clearSel}
          onDeleteSelected={() => setDeleting({ ids: selected, label: "" })} />
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input type="checkbox" checked={allIds.length > 0 && allIds.every((id) => selected.includes(id))}
                  onChange={(e) => e.target.checked ? selAll(allIds) : clearSel()} />
              </th>
              <th>Nome</th>
              {showChurch && <th>Igreja</th>}
              {showGroup  && <th>Grupo</th>}
              <th>Membros</th>
              <th style={{ width: 90 }}></th>
            </tr>
          </thead>
          <tbody>
            {groupedList ? groupedList.flatMap((grp) => [
              <tr key={`grp-${grp.key}`} style={{ background: "var(--bg2)" }}>
                <td colSpan={colCount} style={{ fontWeight: 700, fontSize: 12, padding: "6px 10px" }}>
                  {groupBy === "church" ? "🏛" : "👥"} {grp.key} <span style={{ opacity: .65, fontWeight: 400 }}>({grp.items.length})</span>
                </td>
              </tr>,
              ...grp.items.map(renderRow),
            ]) : sorted.map(renderRow)}
            {sorted.length === 0 && (
              <tr><td colSpan={colCount} style={{ textAlign: "center", color: "var(--muted)", padding: 20 }}>Nenhum resultado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={() => openNew({ name: "", selectedMembers: [] })}><Plus size={14} /> Nova Família</button>
        {(families || []).length > 0 && (
          <button className="btn btn-danger btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}
            onClick={() => setDeleting({ ids: (families || []).map((f) => f.id).filter(Boolean), label: "" })}>
            <Trash2 size={13} /> Excluir TODAS ({(families || []).length})
          </button>
        )}
      </div>
    </div>
  );
}
