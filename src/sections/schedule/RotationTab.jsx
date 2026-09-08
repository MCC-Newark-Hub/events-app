import { useState, useEffect } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { sb } from "@/lib/supabase";
import { useAppDataContext } from "@/context/AppDataContext";

const SERVICE_LABELS = ["Único", "Manhã", "Tarde", "Noite"];

const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export default function RotationTab({ type, lang }) {
  const pt = lang !== "en";
  const { members = [] } = useAppDataContext() || {};

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ service_date: "", service_label: "Único", member_id: "", member_name: "", notes: "" });
  const [query, setQuery] = useState("");

  useEffect(() => {
    load();
  }, [type]);

  const load = async () => {
    setLoading(true);
    const { data } = await sb.from("schedule_rotations").select("*").eq("type", type).order("service_date", { ascending: false }).order("service_label");
    setRows(data || []);
    setLoading(false);
  };

  const memberResults = query.length > 1
    ? members.filter((m) => norm(m.name).includes(norm(query))).slice(0, 6)
    : [];

  const openModal = () => {
    setForm({ service_date: "", service_label: "Único", member_id: "", member_name: "", notes: "" });
    setQuery("");
    setShowModal(true);
  };

  const selectMember = (m) => {
    setForm((f) => ({ ...f, member_id: m.id, member_name: m.name }));
    setQuery(m.name);
  };

  const save = async () => {
    if (!form.service_date || (!form.member_name && !form.member_id)) return;
    setSaving(true);
    const row = {
      type,
      service_date: form.service_date,
      service_label: form.service_label,
      member_id: form.member_id || null,
      member_name: form.member_name || query,
      notes: form.notes || null,
    };
    const { data, error } = await sb.from("schedule_rotations").insert(row).select().single();
    if (!error && data) {
      setRows((prev) => [data, ...prev]);
    }
    setSaving(false);
    setShowModal(false);
  };

  const remove = async (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    await sb.from("schedule_rotations").delete().eq("id", id);
  };

  const typePT = type === "portaria" ? "Portaria" : "Flores";
  const typeEN = type === "portaria" ? "Door Duty" : "Flowers";
  const title = pt ? typePT : typeEN;

  const grouped = rows.reduce((acc, r) => {
    const key = r.service_date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>
            {pt ? `Escala de ${typePT}` : `${typeEN} Rotation`}
          </h3>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>
            {pt
              ? type === "portaria"
                ? "Quem fica na porta durante os cultos."
                : "Quem coloca e retira as flores do púlpito."
              : type === "portaria"
              ? "Who staffs the door during services."
              : "Who places and removes flowers from the pulpit."}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openModal} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={16} /> {pt ? "Nova atribuição" : "New assignment"}
        </button>
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)", fontSize: 14 }}>{pt ? "Carregando…" : "Loading…"}</p>
      ) : sortedDates.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>
          <p style={{ fontSize: 14 }}>{pt ? "Nenhuma atribuição cadastrada." : "No assignments yet."}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sortedDates.map((date) => (
            <div key={date} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ background: "var(--bg2)", padding: "10px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700, fontSize: 13, color: "var(--text)" }}>
                {new Date(date + "T12:00:00").toLocaleDateString(pt ? "pt-BR" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </div>
              {grouped[date].map((r) => (
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", background: "var(--bg2)", borderRadius: 99, padding: "2px 10px" }}>
                      {r.service_label}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{r.member_name}</span>
                    {r.notes && <span style={{ fontSize: 12, color: "var(--muted)" }}>— {r.notes}</span>}
                  </div>
                  <button onClick={() => remove(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: 4 }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, fontWeight: 700 }}>
                {pt ? `Nova atribuição — ${typePT}` : `New ${typeEN} assignment`}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} color="var(--muted)" />
              </button>
            </div>

            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4, color: "var(--muted)" }}>
              {pt ? "Data do culto" : "Service date"}
            </label>
            <input
              type="date"
              value={form.service_date}
              onChange={(e) => setForm((f) => ({ ...f, service_date: e.target.value }))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid var(--border)", fontSize: 14, marginBottom: 14, boxSizing: "border-box", background: "var(--card)", color: "var(--text)" }}
            />

            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4, color: "var(--muted)" }}>
              {pt ? "Culto" : "Service"}
            </label>
            <select
              value={form.service_label}
              onChange={(e) => setForm((f) => ({ ...f, service_label: e.target.value }))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid var(--border)", fontSize: 14, marginBottom: 14, boxSizing: "border-box", background: "var(--card)", color: "var(--text)" }}
            >
              {SERVICE_LABELS.map((l) => <option key={l}>{l}</option>)}
            </select>

            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4, color: "var(--muted)" }}>
              {pt ? "Membro" : "Member"}
            </label>
            <div style={{ position: "relative", marginBottom: 14 }}>
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setForm((f) => ({ ...f, member_id: "", member_name: "" })); }}
                placeholder={pt ? "Buscar membro…" : "Search member…"}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid var(--border)", fontSize: 14, boxSizing: "border-box", background: "var(--card)", color: "var(--text)" }}
              />
              {memberResults.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--card)", border: "1.5px solid var(--border)", borderRadius: 8, zIndex: 10, boxShadow: "var(--shadow-md)" }}>
                  {memberResults.map((m) => (
                    <div key={m.id} onClick={() => selectMember(m)}
                      style={{ padding: "10px 12px", cursor: "pointer", fontSize: 14, borderBottom: "1px solid var(--border)" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg2)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = ""}>
                      <div style={{ fontWeight: 600 }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>{m.church}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4, color: "var(--muted)" }}>
              {pt ? "Observações (opcional)" : "Notes (optional)"}
            </label>
            <input
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder={pt ? "Ex.: chegar 30min antes" : "e.g., arrive 30min early"}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid var(--border)", fontSize: 14, marginBottom: 20, boxSizing: "border-box", background: "var(--card)", color: "var(--text)" }}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)} style={{ flex: 1 }}>
                {pt ? "Cancelar" : "Cancel"}
              </button>
              <button className="btn btn-primary" onClick={save} disabled={saving || !form.service_date || (!form.member_id && !query)} style={{ flex: 1 }}>
                {saving ? (pt ? "Salvando…" : "Saving…") : (pt ? "Salvar" : "Save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
