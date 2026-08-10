import { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Pencil, Trash2, Printer } from "lucide-react";
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
  return type === "utensílio" ? Math.ceil(n) : Math.round(n * 10) / 10;
}
function fmtN(n) { return Math.round(n * 10) / 10; }
function fmtCost(n) { return n > 0 ? "$" + Number(n).toFixed(2) : "—"; }

function getDelta(current, prev) {
  if (prev == null) return null;
  const diff = current - prev;
  const pct = prev > 0 ? Math.abs(diff / prev) * 100 : 0;
  if (pct < 3) return { label: "= igual",  color: "#6b7280" };
  if (diff > 0) return { label: `↑ mais`,  color: "#d97706", diff: fmtN(diff) };
  return            { label: `↓ menos`, color: "#2563eb", diff: -fmtN(Math.abs(diff)) };
}

export default function KitchenPlanningTab({ regs, event, events, notify }) {
  const [items,         setItems]         = useState([]);
  const [loaded,        setLoaded]        = useState(false);
  const [meta,          setMeta]          = useState({ actual_attendance: "", notes: "" });
  const [metaSaving,    setMetaSaving]    = useState(false);
  const [pastPlans,     setPastPlans]     = useState([]);
  const [importEventId, setImportEventId] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [seeding,       setSeeding]       = useState(false);
  const [editingItem,   setEditingItem]   = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [view,          setView]          = useState("plano"); // "plano" | "pos" | "compras"
  const [actuals,       setActuals]       = useState({});
  const [actualsSaving, setActualsSaving] = useState(false);
  const [showCost,      setShowCost]      = useState(false);
  const [shopChecked,   setShopChecked]   = useState({});
  const actualsInited = useRef(false);

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

  // Load plan + meta for this event
  useEffect(() => {
    if (!event?.id) return;
    setLoaded(false);
    actualsInited.current = false;
    Promise.all([
      sb.from("kitchen_plan").select("*").eq("event_id", event.id).order("sort_order"),
      sb.from("kitchen_meta").select("*").eq("event_id", event.id).maybeSingle(),
    ]).then(([{ data: planData }, { data: metaData }]) => {
      setItems(planData || []);
      setMeta(metaData
        ? { actual_attendance: metaData.actual_attendance ?? "", notes: metaData.notes ?? "" }
        : { actual_attendance: "", notes: "" }
      );
      setLoaded(true);
    });
  }, [event?.id]);

  // Seed actuals input from loaded items (once)
  useEffect(() => {
    if (!actualsInited.current && items.length > 0) {
      const init = {};
      items.forEach((it) => { if (it.actual_qty != null) init[it.id] = String(it.actual_qty); });
      setActuals(init);
      actualsInited.current = true;
    }
  }, [items]);

  // Past events that have a plan (for import dropdown)
  useEffect(() => {
    if (!event?.id) return;
    sb.from("kitchen_plan").select("event_id").neq("event_id", event.id).then(({ data }) => {
      if (!data?.length) return;
      const counts = {};
      data.forEach((r) => { counts[r.event_id] = (counts[r.event_id] || 0) + 1; });
      const evMap = Object.fromEntries((events || []).map((e) => [e.id, e.name || e.title || e.id]));
      setPastPlans(
        Object.entries(counts)
          .map(([eid, n]) => ({ eventId: eid, eventName: evMap[eid] || eid, count: n }))
          .sort((a, b) => b.count - a.count)
      );
    });
  }, [event?.id, events]);

  // ── Actions ────────────────────────────────────────────────────────────────────

  const seedDefaults = async () => {
    setSeeding(true);
    const rows = DEFAULT_ITEMS.map((d, i) => ({
      id: "KP" + String(Date.now() + i).slice(-9),
      event_id: event.id, name: d.name, type: d.type, unit: d.unit,
      per_person: d.per_person, per_category: null, use_per_category: false,
      sort_order: d.sort_order, notes: null,
      actual_qty: null, prev_actual_qty: null, prev_attendance: null, unit_cost: null,
    }));
    const { data, error } = await sb.from("kitchen_plan").insert(rows).select();
    if (error) { notify?.("Erro: " + error.message); setSeeding(false); return; }
    setItems(data || rows);
    setSeeding(false);
  };

  const importFrom = async () => {
    if (!importEventId) return;
    setImportLoading(true);
    const [{ data: srcMeta }, { data: srcItems }] = await Promise.all([
      sb.from("kitchen_meta").select("*").eq("event_id", importEventId).maybeSingle(),
      sb.from("kitchen_plan").select("*").eq("event_id", importEventId).order("sort_order"),
    ]);
    if (!srcItems?.length) { notify?.("Nenhum item encontrado."); setImportLoading(false); return; }
    const srcAttendance = srcMeta?.actual_attendance || null;
    const rows = srcItems.map((r, i) => {
      const hasActual = r.actual_qty != null && srcAttendance > 0;
      const perPerson = hasActual
        ? Math.round((r.actual_qty / srcAttendance) * 1000) / 1000
        : r.per_person;
      return {
        id: "KP" + String(Date.now() + i).slice(-9),
        event_id: event.id, name: r.name, type: r.type, unit: r.unit,
        per_person: perPerson, per_category: r.per_category, use_per_category: r.use_per_category,
        sort_order: r.sort_order, notes: r.notes, unit_cost: r.unit_cost,
        actual_qty: null,
        prev_actual_qty: r.actual_qty ?? null,
        prev_attendance: srcAttendance,
      };
    });
    const { data: inserted, error } = await sb.from("kitchen_plan").insert(rows).select();
    if (error) { notify?.("Erro ao importar."); setImportLoading(false); return; }
    setItems((prev) => [...prev, ...(inserted || rows)]);
    setImportEventId("");
    setImportLoading(false);
    const recal = rows.filter((r) => r.prev_actual_qty != null).length;
    notify?.(recal > 0
      ? `${rows.length} itens importados — ${recal} recalibrados com base nos reais do último evento.`
      : `${rows.length} itens importados!`
    );
  };

  const saveMeta = async () => {
    setMetaSaving(true);
    await sb.from("kitchen_meta").upsert(
      { event_id: event.id, actual_attendance: Number(meta.actual_attendance) || null, notes: meta.notes || null },
      { onConflict: "event_id" }
    );
    setMetaSaving(false);
    notify?.("Salvo!");
  };

  const saveActuals = async () => {
    setActualsSaving(true);
    for (const it of items) {
      const raw = actuals[it.id];
      const qty = raw != null && raw !== "" ? Number(raw) : null;
      await sb.from("kitchen_plan").update({ actual_qty: qty }).eq("id", it.id);
    }
    setItems((prev) => prev.map((it) => {
      const raw = actuals[it.id];
      return { ...it, actual_qty: raw != null && raw !== "" ? Number(raw) : null };
    }));
    setActualsSaving(false);
    notify?.("Consumo real salvo!");
  };

  const saveItem = async () => {
    if (!editingItem?.name?.trim()) { notify?.("Nome obrigatório."); return; }
    setSaving(true);
    const row = {
      event_id: event.id,
      name: editingItem.name.trim(), type: editingItem.type || "outro", unit: editingItem.unit || "un.",
      per_person: Number(editingItem.per_person) || 0,
      per_category: editingItem.use_per_category ? editingItem.per_category : null,
      use_per_category: !!editingItem.use_per_category,
      sort_order: editingItem.sort_order ?? items.length * 10,
      notes: editingItem.notes || null,
      unit_cost: editingItem.unit_cost !== "" && editingItem.unit_cost != null ? Number(editingItem.unit_cost) : null,
    };
    if (editingItem.id) {
      const { error } = await sb.from("kitchen_plan").update(row).eq("id", editingItem.id);
      if (error) { notify?.("Erro: " + error.message); setSaving(false); return; }
      setItems((prev) => prev.map((it) => it.id === editingItem.id ? { ...it, ...row } : it));
    } else {
      row.id = "KP" + String(Date.now()).slice(-9);
      row.actual_qty = null; row.prev_actual_qty = null; row.prev_attendance = null;
      const { data, error } = await sb.from("kitchen_plan").insert(row).select().single();
      if (error) { notify?.("Erro: " + error.message); setSaving(false); return; }
      setItems((prev) => [...prev, data || row]);
    }
    setSaving(false); setEditingItem(null); notify?.("Salvo!");
  };

  const deleteItem = async (id) => {
    const { error } = await sb.from("kitchen_plan").delete().eq("id", id);
    if (error) { notify?.("Erro: " + error.message); return; }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const openNew  = () => setEditingItem({ name: "", type: "utensílio", unit: "un.", per_person: 1, unit_cost: "", use_per_category: false, per_category: null, sort_order: (items.length + 1) * 10, notes: "" });
  const openEdit = (item) => setEditingItem({ ...item, unit_cost: item.unit_cost ?? "", per_category: item.per_category || Object.fromEntries(CATEGORIES.map((c) => [c, item.per_person ?? 1])) });

  const printList = () => {
    const el = document.getElementById("kp-print-content");
    if (!el) return;
    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>Lista de Compras</title><style>
      body{font-family:sans-serif;padding:24px;color:#111}
      h1{font-size:20px;margin:0 0 4px}p.sub{color:#6b7280;font-size:13px;margin:0 0 20px}
      h2{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;margin:18px 0 4px}
      table{width:100%;border-collapse:collapse}
      td{padding:8px 6px;border-bottom:1px solid #e5e7eb;font-size:14px}
      .qty{font-weight:700;text-align:right;white-space:nowrap}
    </style></head><body>${el.innerHTML}</body></html>`);
    w.document.close(); w.print();
  };

  // ── Guards ─────────────────────────────────────────────────────────────────────
  if (!event) return <p style={{ color: "var(--muted)", padding: 20 }}>Nenhum evento selecionado.</p>;
  if (!loaded) return <p style={{ color: "var(--muted)", padding: 20 }}>Carregando…</p>;

  // ── Empty state ────────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px", background: "var(--card)", borderRadius: 12, border: "1px solid var(--border)" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
        <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, marginBottom: 6 }}>Nenhum plano de cozinha para este evento</h3>
        <p style={{ color: "var(--muted)", fontSize: 13, maxWidth: 360, margin: "0 auto 24px" }}>
          Crie um plano com itens padrão ou importe de um evento anterior.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
          <button className="btn btn-primary" disabled={seeding} onClick={seedDefaults}>
            {seeding ? "Criando…" : "✨ Criar do zero"}
          </button>
          {pastPlans.length > 0 && (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <select value={importEventId} onChange={(e) => setImportEventId(e.target.value)} style={{ minWidth: 220 }}>
                <option value="">Importar de evento anterior…</option>
                {pastPlans.map((p) => <option key={p.eventId} value={p.eventId}>{p.eventName} ({p.count} itens)</option>)}
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

  const grouped = TYPES
    .map((type) => ({ type, label: TYPE_LABEL[type], items: items.filter((it) => it.type === type).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) }))
    .filter((g) => g.items.length > 0);

  const hasPrev     = items.some((it) => it.prev_actual_qty != null);
  const totalCost   = items.reduce((s, it) => it.unit_cost ? s + calcTotal(it) * it.unit_cost : s, 0);

  // ── Main render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, fontWeight: 700, marginBottom: 2 }}>Plano de Cozinha</h3>
          <p style={{ fontSize: 12, color: "var(--muted)" }}>
            <strong>{totalActive}</strong> participantes ativos
            {meta.actual_attendance ? ` · ${meta.actual_attendance} presentes (registrado)` : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {pastPlans.length > 0 && (
            <>
              <select value={importEventId} onChange={(e) => setImportEventId(e.target.value)} style={{ fontSize: 12, padding: "4px 8px" }}>
                <option value="">Importar de…</option>
                {pastPlans.map((p) => <option key={p.eventId} value={p.eventId}>{p.eventName}</option>)}
              </select>
              {importEventId && <button className="btn btn-ghost btn-sm" disabled={importLoading} onClick={importFrom}>{importLoading ? "…" : "Importar"}</button>}
            </>
          )}
          <button className="btn btn-primary btn-sm" style={{ display: "flex", alignItems: "center", gap: 4 }} onClick={openNew}><Plus size={13} /> Item</button>
        </div>
      </div>

      {/* Sub-tab bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 18, borderBottom: "2px solid var(--border)" }}>
        {[{ id: "plano", label: "Planejamento" }, { id: "pos", label: "Pós-Evento" }, { id: "compras", label: "🛒 Lista de Compras" }].map(({ id, label }) => (
          <button key={id} onClick={() => setView(id)} style={{
            background: "none", border: "none", cursor: "pointer", padding: "6px 14px", fontSize: 13,
            fontWeight: view === id ? 700 : 400,
            color: view === id ? "var(--primary)" : "var(--muted)",
            borderBottom: view === id ? "2px solid var(--primary)" : "2px solid transparent",
            marginBottom: -2,
          }}>{label}</button>
        ))}
        {view === "plano" && (
          <button className={`btn btn-xs ${showCost ? "btn-primary" : "btn-ghost"}`} style={{ marginLeft: "auto", marginBottom: 6 }} onClick={() => setShowCost((v) => !v)}>
            💰 Custos
          </button>
        )}
        {view === "compras" && (
          <button className="btn btn-ghost btn-xs" style={{ marginLeft: "auto", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }} onClick={printList}>
            <Printer size={13} /> Imprimir
          </button>
        )}
      </div>

      {/* ── PLANEJAMENTO ────────────────────────────────────────────────────────── */}
      {view === "plano" && (
        <>
          {grouped.map((grp) => (
            <div key={grp.type} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)", marginBottom: 6 }}>{grp.label}</div>
              <div className="card" style={{ padding: 0, overflow: "auto" }}>
                <table className="table" style={{ minWidth: hasPrev ? 580 : 380 }}>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th style={{ textAlign: "right", width: 110 }}>Por pessoa</th>
                      <th style={{ textAlign: "right", width: 120 }}>Estimado</th>
                      {hasPrev && <th style={{ textAlign: "right", width: 130 }}>Real (anterior)</th>}
                      {hasPrev && <th style={{ width: 90 }}>Δ</th>}
                      {showCost && <th style={{ textAlign: "right", width: 80 }}>Custo/un.</th>}
                      {showCost && <th style={{ textAlign: "right", width: 90 }}>Total $</th>}
                      <th style={{ width: 72 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {grp.items.map((item) => {
                      const est  = calcTotal(item);
                      const estF = fmtQty(est, item.type);
                      const d    = getDelta(est, item.prev_actual_qty);
                      const cost = item.unit_cost ? est * item.unit_cost : null;
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
                            <span style={{ fontWeight: 700, fontSize: 15 }}>{estF}</span>
                            <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 3 }}>{item.unit}</span>
                          </td>
                          {hasPrev && (
                            <td style={{ textAlign: "right", fontSize: 13, color: "var(--muted)" }}>
                              {item.prev_actual_qty != null ? `${fmtQty(item.prev_actual_qty, item.type)} ${item.unit}` : "—"}
                            </td>
                          )}
                          {hasPrev && (
                            <td>
                              {d
                                ? <span style={{ fontSize: 12, fontWeight: 600, color: d.color }}>{d.label}{d.diff != null ? ` (${d.diff > 0 ? "+" : ""}${d.diff})` : ""}</span>
                                : <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>
                              }
                            </td>
                          )}
                          {showCost && <td style={{ textAlign: "right", fontSize: 12, color: "var(--muted)" }}>{item.unit_cost ? `$${Number(item.unit_cost).toFixed(2)}` : "—"}</td>}
                          {showCost && <td style={{ textAlign: "right", fontSize: 13, fontWeight: 600 }}>{cost != null ? fmtCost(cost) : "—"}</td>}
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
          {showCost && totalCost > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div className="card" style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "10px 20px" }}>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>Custo total estimado:</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: "var(--primary)" }}>{fmtCost(totalCost)}</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── PÓS-EVENTO ──────────────────────────────────────────────────────────── */}
      {view === "pos" && (
        <>
          <div className="card" style={{ padding: "14px 18px", marginBottom: 18 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontWeight: 600, fontSize: 13, display: "block", marginBottom: 2 }}>Pessoas presentes no evento</label>
                <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>
                  Usado para calibrar estimativas ao importar este plano no próximo evento.
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="number" min={0} style={{ width: 100 }}
                  value={meta.actual_attendance}
                  onChange={(e) => setMeta((m) => ({ ...m, actual_attendance: e.target.value }))}
                  placeholder={String(totalActive)}
                />
                <button className="btn btn-primary btn-sm" disabled={metaSaving} onClick={saveMeta}>
                  {metaSaving ? "…" : "Salvar"}
                </button>
              </div>
            </div>
          </div>

          {grouped.map((grp) => (
            <div key={grp.type} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)", marginBottom: 6 }}>{grp.label}</div>
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th style={{ textAlign: "right", width: 130 }}>Estimado</th>
                      <th style={{ textAlign: "right", width: 160 }}>Real (consumido)</th>
                      <th style={{ textAlign: "right", width: 120 }}>Δ vs estimado</th>
                      <th style={{ textAlign: "right", width: 100 }}>% utilizado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grp.items.map((item) => {
                      const est      = calcTotal(item);
                      const estF     = fmtQty(est, item.type);
                      const rawAct   = actuals[item.id];
                      const actualN  = rawAct != null && rawAct !== "" ? Number(rawAct) : null;
                      const diff     = actualN != null ? actualN - est : null;
                      const diffF    = diff != null ? (diff >= 0 ? `+${fmtN(diff)}` : `${fmtN(diff)}`) : null;
                      const diffCol  = diff == null ? undefined : diff > 0 ? "#dc2626" : diff < -est * 0.1 ? "#d97706" : "#16a34a";
                      const pctUsed  = actualN != null && est > 0 ? Math.round((actualN / est) * 100) : null;
                      const pctColor = pctUsed == null ? undefined : pctUsed > 100 ? "#dc2626" : pctUsed < 80 ? "#d97706" : "#16a34a";
                      return (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 500 }}>{item.name}</td>
                          <td style={{ textAlign: "right", color: "var(--muted)", fontSize: 13 }}>{estF} {item.unit}</td>
                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                              <input type="number" min={0} step={0.05} style={{ width: 80, textAlign: "right" }}
                                value={rawAct ?? ""}
                                onChange={(e) => setActuals((a) => ({ ...a, [item.id]: e.target.value }))}
                                placeholder="—"
                              />
                              <span style={{ fontSize: 12, color: "var(--muted)" }}>{item.unit}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: "right", fontSize: 13, fontWeight: 600, color: diffCol }}>
                            {diffF != null ? `${diffF} ${item.unit}` : "—"}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {pctUsed != null
                              ? <span style={{ fontWeight: 700, fontSize: 13, color: pctColor }}>{pctUsed}%</span>
                              : <span style={{ color: "var(--muted)" }}>—</span>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-primary" disabled={actualsSaving} onClick={saveActuals}>
              {actualsSaving ? "Salvando…" : "Salvar Consumo Real"}
            </button>
          </div>
        </>
      )}

      {/* ── LISTA DE COMPRAS ────────────────────────────────────────────────────── */}
      {view === "compras" && (
        <div id="kp-print-content">
          <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, margin: "0 0 2px" }}>Lista de Compras</h3>
          <p style={{ color: "var(--muted)", fontSize: 12, marginBottom: 18 }}>
            {event?.name || event?.title || ""} · {totalActive} participantes
          </p>
          {grouped.map((grp) => (
            <div key={grp.type} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)", marginBottom: 6 }}>{grp.label}</div>
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <table className="table">
                  <tbody>
                    {grp.items.map((item) => {
                      const qty     = fmtQty(calcTotal(item), item.type);
                      const checked = !!shopChecked[item.id];
                      return (
                        <tr key={item.id} style={{ opacity: checked ? 0.4 : 1 }}>
                          <td style={{ width: 36 }}>
                            <input type="checkbox" checked={checked} onChange={() => setShopChecked((s) => ({ ...s, [item.id]: !s[item.id] }))} />
                          </td>
                          <td style={{ fontWeight: checked ? 400 : 500, textDecoration: checked ? "line-through" : undefined }}>
                            {item.name}
                            {item.notes && <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 6 }}>({item.notes})</span>}
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 700, fontSize: 15, whiteSpace: "nowrap" }}>
                            {qty} <span style={{ fontSize: 12, fontWeight: 400, color: "var(--muted)" }}>{item.unit}</span>
                          </td>
                          {showCost && item.unit_cost && (
                            <td style={{ textAlign: "right", fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>
                              {fmtCost(calcTotal(item) * item.unit_cost)}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {showCost && totalCost > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Total estimado: {fmtCost(totalCost)}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Edit / New modal ────────────────────────────────────────────────────── */}
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
                <div>
                  <label>Custo/un. ($)</label>
                  <input type="number" min={0} step={0.01}
                    value={editingItem.unit_cost}
                    onChange={(e) => setEditingItem({ ...editingItem, unit_cost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <label className="cb" style={{ fontWeight: 400, textTransform: "none", fontSize: 13 }}>
                <input type="checkbox" checked={!!editingItem.use_per_category}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setEditingItem({
                      ...editingItem, use_per_category: on,
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
                  <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>Quantidade por pessoa em cada faixa etária.</p>
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
              <button className="btn btn-primary" style={{ flex: 2 }} disabled={saving} onClick={saveItem}>{saving ? "Salvando…" : "Salvar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
