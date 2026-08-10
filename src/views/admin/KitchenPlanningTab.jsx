import { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { CATEGORIES } from "@/constants";
import { sb } from "@/lib/supabase";

const TYPES      = ["utensílio", "alimento", "bebida", "outro"];
const TYPE_LABEL = { "utensílio": "Utensílios", "alimento": "Alimentos", "bebida": "Bebidas", "outro": "Outros" };
const UNIT_OPTS  = ["un.", "kg", "g", "L", "mL", "pacote", "caixa", "lata", "saco", "dúzia"];

const DEFAULT_ITEMS = [
  { name: "Pratos",       type: "utensílio", unit: "un.", per_person: 1,    sort_order: 1  },
  { name: "Garfos",       type: "utensílio", unit: "un.", per_person: 1,    sort_order: 2  },
  { name: "Facas",        type: "utensílio", unit: "un.", per_person: 1,    sort_order: 3  },
  { name: "Colheres",     type: "utensílio", unit: "un.", per_person: 1,    sort_order: 4  },
  { name: "Copos",        type: "utensílio", unit: "un.", per_person: 2,    sort_order: 5  },
  { name: "Guardanapos",  type: "utensílio", unit: "un.", per_person: 3,    sort_order: 6  },
  { name: "Arroz",        type: "alimento",  unit: "kg",  per_person: 0.15, sort_order: 10 },
  { name: "Feijão",       type: "alimento",  unit: "kg",  per_person: 0.10, sort_order: 11 },
  { name: "Carne",        type: "alimento",  unit: "kg",  per_person: 0.20, sort_order: 12 },
  { name: "Suco",         type: "bebida",    unit: "L",   per_person: 0.30, sort_order: 20 },
  { name: "Refrigerante", type: "bebida",    unit: "L",   per_person: 0.20, sort_order: 21 },
];

function fmtQty(n, type) {
  if (type === "utensílio") return Math.ceil(n);
  return Math.round(n * 10) / 10;
}

export default function KitchenPlanningTab({ regs, event, events, notify }) {
  const [items,         setItems]         = useState([]);
  const [loaded,        setLoaded]        = useState(false);
  const [pastPlans,     setPastPlans]     = useState([]);
  const [importEventId, setImportEventId] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [seeding,       setSeeding]       = useState(false);
  const [editingItem,   setEditingItem]   = useState(null);
  const [saving,        setSaving]        = useState(false);

  const active = useMemo(
    () => (regs || []).filter((r) => r.eventId === event?.id && !r.cancelled && !r.waitlisted),
    [regs, event?.id]
  );
  const catCounts = useMemo(
    () => Object.fromEntries(CATEGORIES.map((c) => [c, active.filter((r) => r.category === c).length])),
    [active]
  );
  const totalActive = active.length;

  const calcTotal = (item) => {
    if (item.use_per_category && item.per_category) {
      return CATEGORIES.reduce((s, c) => s + (Number(item.per_category[c]) || 0) * (catCounts[c] || 0), 0);
    }
    return (Number(item.per_person) || 0) * totalActive;
  };

  useEffect(() => {
    if (!event?.id) return;
    setLoaded(false);
    sb.from("kitchen_plan").select("*").eq("event_id", event.id).order("sort_order").then(({ data }) => {
      setItems(data || []);
      setLoaded(true);
    });
  }, [event?.id]);

  useEffect(() => {
    if (!event?.id) return;
    sb.from("kitchen_plan").select("event_id").neq("event_id", event.id).then(({ data }) => {
      if (!data?.length) return;
      const counts = {};
      data.forEach((r) => { counts[r.event_id] = (counts[r.event_id] || 0) + 1; });
      const evMap = Object.fromEntries((events || []).map((e) => [e.id, e.name || e.title || e.id]));
      setPastPlans(
        Object.entries(counts)
          .map(([eid, count]) => ({ eventId: eid, eventName: evMap[eid] || eid, count }))
          .sort((a, b) => b.count - a.count)
      );
    });
  }, [event?.id, events]);

  const seedDefaults = async () => {
    setSeeding(true);
    const rows = DEFAULT_ITEMS.map((d, i) => ({
      id: "KP" + String(Date.now() + i).slice(-9),
      event_id: event.id, name: d.name, type: d.type, unit: d.unit,
      per_person: d.per_person, per_category: null, use_per_category: false,
      sort_order: d.sort_order, notes: null,
    }));
    const { data, error } = await sb.from("kitchen_plan").insert(rows).select();
    if (error) { notify?.("Erro: " + error.message); setSeeding(false); return; }
    setItems(data || rows);
    setSeeding(false);
  };

  const importFrom = async () => {
    if (!importEventId) return;
    setImportLoading(true);
    const { data } = await sb.from("kitchen_plan").select("*").eq("event_id", importEventId).order("sort_order");
    if (!data?.length) { notify?.("Nenhum item encontrado."); setImportLoading(false); return; }
    const rows = data.map((r, i) => ({
      id: "KP" + String(Date.now() + i).slice(-9),
      event_id: event.id, name: r.name, type: r.type, unit: r.unit,
      per_person: r.per_person, per_category: r.per_category,
      use_per_category: r.use_per_category, sort_order: r.sort_order, notes: r.notes,
    }));
    const { data: inserted, error } = await sb.from("kitchen_plan").insert(rows).select();
    if (error) { notify?.("Erro ao importar."); setImportLoading(false); return; }
    setItems((prev) => [...prev, ...(inserted || rows)]);
    setImportEventId("");
    setImportLoading(false);
    notify?.(`${rows.length} itens importados!`);
  };

  const saveItem = async () => {
    if (!editingItem?.name?.trim()) { notify?.("Nome obrigatório."); return; }
    setSaving(true);
    const row = {
      event_id: event.id,
      name: editingItem.name.trim(),
      type: editingItem.type || "outro",
      unit: editingItem.unit || "un.",
      per_person: Number(editingItem.per_person) || 0,
      per_category: editingItem.use_per_category ? editingItem.per_category : null,
      use_per_category: !!editingItem.use_per_category,
      sort_order: editingItem.sort_order ?? items.length * 10,
      notes: editingItem.notes || null,
    };
    if (editingItem.id) {
      const { error } = await sb.from("kitchen_plan").update(row).eq("id", editingItem.id);
      if (error) { notify?.("Erro: " + error.message); setSaving(false); return; }
      setItems((prev) => prev.map((it) => it.id === editingItem.id ? { ...it, ...row } : it));
    } else {
      row.id = "KP" + String(Date.now()).slice(-9);
      const { data, error } = await sb.from("kitchen_plan").insert(row).select().single();
      if (error) { notify?.("Erro: " + error.message); setSaving(false); return; }
      setItems((prev) => [...prev, data || row]);
    }
    setSaving(false);
    setEditingItem(null);
    notify?.("Salvo!");
  };

  const deleteItem = async (id) => {
    const { error } = await sb.from("kitchen_plan").delete().eq("id", id);
    if (error) { notify?.("Erro: " + error.message); return; }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const openNew  = () => setEditingItem({ name: "", type: "utensílio", unit: "un.", per_person: 1, use_per_category: false, per_category: null, sort_order: (items.length + 1) * 10, notes: "" });
  const openEdit = (item) => setEditingItem({ ...item, per_category: item.per_category || Object.fromEntries(CATEGORIES.map((c) => [c, item.per_person ?? 1])) });

  if (!event) return <p style={{ color: "var(--muted)", padding: 20 }}>Nenhum evento selecionado.</p>;
  if (!loaded) return <p style={{ color: "var(--muted)", padding: 20 }}>Carregando…</p>;

  // ── Empty state ───────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px", background: "var(--card)", borderRadius: 12, border: "1px solid var(--border)" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
        <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, marginBottom: 6 }}>Nenhum plano de cozinha para este evento</h3>
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 24, maxWidth: 360, margin: "0 auto 24px" }}>
          Crie um plano com itens padrão (pratos, arroz, feijão…) ou importe de um evento anterior.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
          <button className="btn btn-primary" disabled={seeding} onClick={seedDefaults}>
            {seeding ? "Criando…" : "✨ Criar do zero"}
          </button>
          {pastPlans.length > 0 && (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <select value={importEventId} onChange={(e) => setImportEventId(e.target.value)} style={{ minWidth: 220 }}>
                <option value="">Importar de evento anterior…</option>
                {pastPlans.map((p) => (
                  <option key={p.eventId} value={p.eventId}>{p.eventName} ({p.count} itens)</option>
                ))}
              </select>
              <button className="btn btn-ghost" disabled={!importEventId || importLoading} onClick={importFrom}>
                {importLoading ? "…" : "Importar"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Items table ───────────────────────────────────────────────────────────────
  const grouped = TYPES
    .map((type) => ({ type, label: TYPE_LABEL[type], items: items.filter((it) => it.type === type).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) }))
    .filter((g) => g.items.length > 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, fontWeight: 700, marginBottom: 2 }}>Plano de Cozinha</h3>
          <p style={{ fontSize: 12, color: "var(--muted)" }}>
            Baseado em <strong>{totalActive}</strong> participantes ativos
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {pastPlans.length > 0 && (
            <>
              <select value={importEventId} onChange={(e) => setImportEventId(e.target.value)} style={{ fontSize: 12, padding: "4px 8px" }}>
                <option value="">Importar de…</option>
                {pastPlans.map((p) => <option key={p.eventId} value={p.eventId}>{p.eventName}</option>)}
              </select>
              {importEventId && (
                <button className="btn btn-ghost btn-sm" disabled={importLoading} onClick={importFrom}>
                  {importLoading ? "…" : "Importar"}
                </button>
              )}
            </>
          )}
          <button className="btn btn-primary btn-sm" style={{ display: "flex", alignItems: "center", gap: 4 }} onClick={openNew}>
            <Plus size={13} /> Item
          </button>
        </div>
      </div>

      {grouped.map((grp) => (
        <div key={grp.type} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)", marginBottom: 6 }}>
            {grp.label}
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th style={{ textAlign: "right", width: 120 }}>Por pessoa</th>
                  <th style={{ textAlign: "right", width: 140 }}>Total estimado</th>
                  <th style={{ width: 72 }}></th>
                </tr>
              </thead>
              <tbody>
                {grp.items.map((item) => {
                  const total   = calcTotal(item);
                  const display = fmtQty(total, item.type);
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 500 }}>
                        {item.name}
                        {item.use_per_category && <span style={{ marginLeft: 6, fontSize: 10, color: "var(--primary)", fontWeight: 600 }}>por categoria</span>}
                        {item.notes && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{item.notes}</div>}
                      </td>
                      <td style={{ textAlign: "right", color: "var(--muted)", fontSize: 13 }}>
                        {item.use_per_category ? "—" : `${item.per_person} ${item.unit}`}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span style={{ fontWeight: 700, fontSize: 16 }}>{display}</span>
                        <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 4 }}>{item.unit}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button className="btn btn-ghost btn-xs" onClick={() => openEdit(item)}><Pencil size={12} /></button>
                          <button className="btn btn-danger btn-xs" onClick={() => deleteItem(item.id)}><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* ── Edit / New modal ───────────────────────────────────────────────────── */}
      {editingItem && (
        <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && setEditingItem(null)}>
          <div className="modal" style={{ maxWidth: 460 }}>
            <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 17, marginBottom: 16 }}>
              {editingItem.id ? "Editar Item" : "Novo Item"}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="fr">
                <div style={{ flex: 2 }}>
                  <label>Nome *</label>
                  <input value={editingItem.name} onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })} placeholder="Ex: Arroz" />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Tipo</label>
                  <select value={editingItem.type} onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value })}>
                    {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                  </select>
                </div>
              </div>
              <div className="fr">
                <div>
                  <label>Unidade</label>
                  <input list="kp-units" value={editingItem.unit} onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })} placeholder="un." />
                  <datalist id="kp-units">{UNIT_OPTS.map((u) => <option key={u} value={u} />)}</datalist>
                </div>
                {!editingItem.use_per_category && (
                  <div>
                    <label>Por pessoa</label>
                    <input type="number" min={0} step={0.05}
                      value={editingItem.per_person}
                      onChange={(e) => setEditingItem({ ...editingItem, per_person: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <label className="cb" style={{ fontWeight: 400, textTransform: "none", fontSize: 13 }}>
                <input type="checkbox" checked={!!editingItem.use_per_category}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setEditingItem({
                      ...editingItem,
                      use_per_category: on,
                      per_category: on
                        ? Object.fromEntries(CATEGORIES.map((c) => [c, editingItem.per_category?.[c] ?? editingItem.per_person ?? 1]))
                        : null,
                    });
                  }}
                />
                Personalizar quantidade por faixa etária
              </label>

              {editingItem.use_per_category && (
                <div style={{ background: "var(--bg2)", borderRadius: 8, padding: "10px 14px" }}>
                  <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>Quantidade por pessoa em cada faixa.</p>
                  {CATEGORIES.map((c) => (
                    <div key={c} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 13, flex: 1, minWidth: 110 }}>{c}</span>
                      <input type="number" min={0} step={0.05} style={{ width: 80 }}
                        value={(editingItem.per_category || {})[c] ?? 0}
                        onChange={(e) => setEditingItem({ ...editingItem, per_category: { ...(editingItem.per_category || {}), [c]: e.target.value } })}
                      />
                      <span style={{ fontSize: 12, color: "var(--muted)", minWidth: 28 }}>{editingItem.unit}</span>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label>Notas (opcional)</label>
                <input value={editingItem.notes || ""} onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })} placeholder="Ex: adicionar 10% de margem" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditingItem(null)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 2 }} disabled={saving} onClick={saveItem}>
                {saving ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
