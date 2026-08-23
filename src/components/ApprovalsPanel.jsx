import { useState } from "react";
import { useT } from "@/i18n/strings";
import { fmt } from "@/constants";

const typeLabel = (a, t) =>
  a.type === "capacity_override" ? t.capacityOverride
  : a.type === "late_registration" ? t.lateRegistrationReq
  : a.type === "reactivation" ? t.reactivationReq
  : a.type === "deadline_extension" ? t.deadlineExtensionReq
  : a.type === "replacement" ? "🔄 Substituição"
  : a.type === "replacement_request" ? "🔄 Solicitação de Substituição"
  : a.type === "cia_excedente" ? "📚 CIA — Participante Excedente"
  : t.exemptionReq;

const historyTypeLabel = (a, t) =>
  a.type === "capacity_override" ? t.excedente
  : a.type === "late_registration" ? t.lateRegistrationReq
  : a.type === "reactivation" ? t.reactivationReq
  : a.type === "deadline_extension" ? t.deadlineExtensionReq
  : a.type === "replacement" || a.type === "replacement_request" ? "🔄 Substituição"
  : a.type === "cia_excedente" ? "📚 CIA — Excedente"
  : t.exempt;

// Replacement-type approvals just need "Ciente" — exclude from bulk selection
const isBulkable = (a) => a.type !== "replacement";

export default function ApprovalsPanel({ approvals, resolveApproval, event, activeCount }) {
  const t = useT();
  const [note, setNote] = useState({});
  const [customDate, setCustomDate] = useState({});
  const [selected, setSelected] = useState(new Set());
  const [bulkNote, setBulkNote] = useState("");

  const pending = approvals.filter((a) => a.eventId === event?.id && a.status === "pending");
  const resolved = approvals.filter((a) => a.eventId === event?.id && a.status !== "pending");
  const bulkable = pending.filter(isBulkable);

  const toggleSelect = (id) =>
    setSelected((p) => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const allSelected = bulkable.length > 0 && bulkable.every((a) => selected.has(a.id));
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(bulkable.map((a) => a.id)));

  const handleBulk = (approve) => {
    bulkable.filter((a) => selected.has(a.id)).forEach((a) =>
      resolveApproval(a.id, approve, bulkNote, customDate[a.id] || null)
    );
    setSelected(new Set());
    setBulkNote("");
  };

  return (
    <div>
      <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 22, fontWeight: 700, marginBottom: 18, color: "var(--text)" }}>{t.approvals}</h2>

      {pending.length === 0 && (
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "20px", textAlign: "center", color: "#166534", marginBottom: 14 }}>{t.noPending}</div>
      )}

      {bulkable.length > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "10px 14px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 13, fontWeight: 600, userSelect: "none" }}>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              style={{ width: "auto", accentColor: "#b41926", cursor: "pointer" }}
            />
            {allSelected ? "Desmarcar todos" : `Selecionar todos (${bulkable.length})`}
          </label>
          {selected.size > 0 && (
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{selected.size} selecionado{selected.size !== 1 ? "s" : ""}</span>
          )}
        </div>
      )}

      {selected.size > 0 && (
        <div style={{ marginBottom: 14, padding: "12px 14px", background: "#fff", border: "2px solid #b41926", borderRadius: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
            Ação em massa — {selected.size} aprovação{selected.size !== 1 ? "ões" : ""}
          </div>
          <textarea
            rows={1}
            value={bulkNote}
            onChange={(e) => setBulkNote(e.target.value)}
            placeholder="Nota do pastor (opcional)..."
            style={{ marginBottom: 8, fontSize: 12 }}
          />
          <div className="fr">
            <button className="btn btn-ok" onClick={() => handleBulk(true)}>✓ Aprovar {selected.size} selecionado{selected.size !== 1 ? "s" : ""}</button>
            <button className="btn btn-danger" onClick={() => handleBulk(false)}>✕ Negar {selected.size} selecionado{selected.size !== 1 ? "s" : ""}</button>
          </div>
        </div>
      )}

      {pending.map((a) => {
        if (a.type === "replacement") {
          return (
            <div key={a.id} style={{ background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#1e40af" }}>🔄 Substituição Realizada</span>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{t.requestedBy} {a.requestedBy}</span>
              </div>
              <div style={{ background: "#fff", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
                <div style={{ fontWeight: 700 }}>{a.memberName}</div>
                <div style={{ color: "#6b7280", marginTop: 2 }}>{a.category} · {a.church}</div>
                {a.reason && <div style={{ color: "#374151", marginTop: 4, fontStyle: "italic" }}>{a.reason}</div>}
              </div>
              <div style={{ marginTop: 10 }}>
                <button className="btn btn-ghost btn-sm" style={{ color: "#1e40af", borderColor: "#93c5fd" }} onClick={() => resolveApproval(a.id, true, "")}>
                  ✓ Ciente
                </button>
              </div>
            </div>
          );
        }
        const isSelected = selected.has(a.id);
        return (
          <div
            key={a.id}
            className={`apr-card ${a.type === "exemption" || a.type === "late_registration" || a.type === "reactivation" ? "danger" : ""}`}
            style={isSelected ? { outline: "2px solid #b41926", outlineOffset: 1 } : {}}
          >
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6, marginBottom: 10, alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(a.id)}
                  style={{ width: "auto", accentColor: "#b41926", cursor: "pointer" }}
                />
                <span style={{ fontWeight: 700, fontSize: 14 }}>{typeLabel(a, t)}</span>
              </label>
              <span style={{ fontSize: 12, color: "#6b7280" }}>{t.requestedBy} {a.requestedBy}</span>
            </div>
            <div style={{ background: "#fff", borderRadius: 8, padding: "10px 14px", marginBottom: 10, fontSize: 13 }}>
              <div style={{ fontWeight: 700 }}>{a.memberName}</div>
              <div style={{ color: "#6b7280", marginTop: 2 }}>{a.category} · {a.church}</div>
              {a.type === "capacity_override" && <div style={{ color: "#c4390a", fontWeight: 600, marginTop: 4 }}>Registration #{activeCount + 1} — above capacity of {event?.capacity}</div>}
              {a.type === "exemption" && <div style={{ color: "#7c3aed", fontWeight: 600, marginTop: 4 }}>{t.exempt}: {fmt(a.fee)}</div>}
              {a.type === "late_registration" && <div style={{ color: "#b45309", fontWeight: 600, marginTop: 4 }}>{fmt(a.fee)}</div>}
              {a.type === "reactivation" && <div style={{ color: "#0369a1", fontWeight: 600, marginTop: 4 }}>Inscrição cancelada — solicitação de reativação</div>}
              {a.type === "deadline_extension" && <div style={{ color: "#0369a1", fontWeight: 600, marginTop: 4 }}>Solicitação de extensão de prazo</div>}
              {a.type === "replacement_request" && a.reason && <div style={{ color: "#374151", fontWeight: 600, marginTop: 4 }}>{a.reason}</div>}
              {a.type === "cia_excedente" && <div style={{ color: "#7c3aed", fontWeight: 600, marginTop: 4 }}>Participante não inscrito — classe: {a.category}</div>}
            </div>
            {a.note && <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 10, fontStyle: "italic", padding: "8px 12px", background: "#f9f9f9", borderRadius: 6 }}>"{a.note}"</p>}
            {(a.type === "reactivation" || a.type === "deadline_extension") && (
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 11, color: "#6b7280" }}>{t.customDeadlineOptional}</label>
                <input
                  type="date"
                  value={customDate[a.id] || ""}
                  onChange={(e) => setCustomDate((p) => ({ ...p, [a.id]: e.target.value }))}
                  style={{ fontSize: 12 }}
                />
              </div>
            )}
            <textarea rows={1} value={note[a.id] || ""} onChange={(e) => setNote((p) => ({ ...p, [a.id]: e.target.value }))} placeholder={t.pastorNote} style={{ marginBottom: 8, fontSize: 12 }} />
            <div className="fr">
              <button className="btn btn-ok" onClick={() => resolveApproval(a.id, true, note[a.id] || "", customDate[a.id] || null)}>{t.approve}</button>
              <button className="btn btn-danger" onClick={() => resolveApproval(a.id, false, note[a.id] || "")}>{t.deny}</button>
            </div>
          </div>
        );
      })}

      {resolved.length > 0 && (
        <div>
          <h4 style={{ fontWeight: 700, marginBottom: 10, color: "#6b7280", fontSize: 13, textTransform: "uppercase", letterSpacing: ".5px" }}>{t.history}</h4>
          {resolved.map((a) => (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#fff", borderRadius: 8, marginBottom: 6, border: "1px solid var(--border)", fontSize: 13 }}>
              <div><span style={{ fontWeight: 600 }}>{a.memberName}</span><span style={{ marginLeft: 8, color: "#6b7280" }}>{historyTypeLabel(a, t)}</span></div>
              <span className={a.status === "approved" ? "badge badge-green" : "badge badge-red"}>{a.status === "approved" ? t.approved : t.denied}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
