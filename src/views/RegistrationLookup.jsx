import { useState } from "react";
import { Search, ArrowLeft, XCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { fmt } from "@/constants";

function getRegStatus(reg) {
  if (reg.cancelled)  return { label: "Cancelado",       color: "#6b7280", bg: "#f3f4f6" };
  if (reg.waitlisted) return { label: "Lista de Espera", color: "#92400e", bg: "#fef3c7" };
  if (reg.excedente)  return { label: "Excedente",       color: "#7c3aed", bg: "#ede9fe" };
  if (reg.exempt)     return { label: "Isento",          color: "#065f46", bg: "#d1fae5" };
  if (reg.paid)       return { label: "Pago",            color: "#065f46", bg: "#d1fae5" };
  return               { label: "Pendente",              color: "#b45309", bg: "#fef3c7" };
}

function dateFromRegNumber(regNumber) {
  const d = (regNumber || "").split("-")[1] || "";
  return d.length === 8 ? `${d.slice(6, 8)}/${d.slice(4, 6)}/${d.slice(0, 4)}` : "";
}

function RegCard({ reg, onCancel, lang }) {
  const status = getRegStatus(reg);
  const date = dateFromRegNumber(reg.regNumber);
  const canCancel = !reg.cancelled && !reg.paid;

  return (
    <div style={{ border: "1.5px solid var(--border)", borderRadius: 10, padding: "14px 16px", marginBottom: 8, background: reg.cancelled ? "#f9fafb" : "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{reg.memberName || reg.badgeName}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
            {reg.category}{reg.church ? ` · ${reg.church}` : ""}
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: status.bg, color: status.color, whiteSpace: "nowrap", flexShrink: 0 }}>
          {status.label}
        </span>
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 1, textTransform: "uppercase", letterSpacing: ".5px" }}>Número</div>
          <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: "#b41926" }}>{reg.regNumber}</div>
        </div>
        {date && (
          <div>
            <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 1, textTransform: "uppercase", letterSpacing: ".5px" }}>Data</div>
            <div style={{ fontSize: 13 }}>{date}</div>
          </div>
        )}
        {reg.fee > 0 && (
          <div>
            <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 1, textTransform: "uppercase", letterSpacing: ".5px" }}>Taxa</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: reg.paid ? "#065f46" : "#b45309" }}>
              {reg.paid ? `✓ Pago (${fmt(reg.fee)})` : fmt(reg.fee)}
            </div>
          </div>
        )}
        {reg.fee === 0 && !reg.exempt && (
          <div>
            <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 1, textTransform: "uppercase", letterSpacing: ".5px" }}>Taxa</div>
            <div style={{ fontSize: 13, color: "#065f46" }}>Grátis</div>
          </div>
        )}
      </div>

      {canCancel && (
        <button
          onClick={onCancel}
          style={{ marginTop: 12, background: "none", border: "1px solid #fca5a5", borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: "#dc2626", display: "flex", alignItems: "center", gap: 4 }}
        >
          <XCircle size={13} /> {lang === "en" ? "Cancel registration" : "Cancelar inscrição"}
        </button>
      )}
      {reg.paid && !reg.cancelled && (
        <p style={{ fontSize: 11, color: "#6b7280", marginTop: 8, marginBottom: 0 }}>
          {lang === "en"
            ? "Paid registrations cannot be cancelled here. Please speak with a clerk."
            : "Inscrições pagas não podem ser canceladas aqui. Fale com um atendente."}
        </p>
      )}
    </div>
  );
}

export default function RegistrationLookup({ event, regs, updateReg, lang, onBack }) {
  const [query, setQuery] = useState("");
  const [found, setFound] = useState(null);
  const [related, setRelated] = useState([]);
  const [notFound, setNotFound] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null); // reg id(s) or "all"
  const [cancelDone, setCancelDone] = useState(false);

  const handleSearch = () => {
    const q = query.trim().toUpperCase();
    if (!q) return;
    const reg = (regs || []).find((r) => r.regNumber === q);
    if (!reg) {
      setFound(null);
      setRelated([]);
      setNotFound(true);
      setCancelDone(false);
      return;
    }
    setNotFound(false);
    setCancelDone(false);
    setFound(reg);
    // Group family by shared phone/contact note from the same portal submission
    if (reg.note) {
      const rels = (regs || []).filter(
        (r) => r.id !== reg.id && r.eventId === reg.eventId && r.note === reg.note && !r.cancelled
      );
      setRelated(rels);
    } else {
      setRelated([]);
    }
  };

  const doCancel = (ids) => {
    ids.forEach((id) => {
      updateReg(id, { cancelled: true }, { status: "Cancelado", note: "Cancelado pelo portal público" });
    });
    // Optimistically update local state
    if (found && ids.includes(found.id)) {
      setFound((prev) => ({ ...prev, cancelled: true }));
    }
    setRelated((prev) => prev.filter((r) => !ids.includes(r.id)));
    setCancelTarget(null);
    setCancelDone(true);
  };

  const activeRelated = related.filter((r) => !r.cancelled);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#8B0000 0%,#b41926 50%,#03223f 100%)", padding: "24px 16px" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,.8)", fontSize: 13, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4, marginBottom: 20 }}
        >
          <ArrowLeft size={14} /> {lang === "en" ? "Home" : "Início"}
        </button>

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <h1 style={{ fontFamily: "'Lora',Georgia,serif", color: "#fff", fontSize: 22, marginBottom: 4 }}>
            {lang === "en" ? "Registration Lookup" : "Consultar Inscrição"}
          </h1>
          <p style={{ color: "rgba(255,255,255,.75)", fontSize: 13 }}>
            {lang === "en"
              ? "Enter your registration number to check your status or cancel."
              : "Digite seu número de inscrição para consultar o status ou cancelar."}
          </p>
        </div>

        <div style={{ background: "#fff", borderRadius: 20, padding: "24px 20px" }}>
          {/* Search input */}
          <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value.toUpperCase()); setNotFound(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={event?.prefix ? `ex: ${event.prefix}-20260613-0001` : "ex: MCC-20260613-0001"}
              style={{ flex: 1, fontFamily: "monospace", letterSpacing: ".04em", textTransform: "uppercase" }}
            />
            <button className="btn btn-primary" onClick={handleSearch} style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <Search size={15} /> {lang === "en" ? "Search" : "Buscar"}
            </button>
          </div>
          <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 16 }}>
            {lang === "en" ? "Your reg number was shown on the confirmation screen." : "O número de inscrição foi exibido na tela de confirmação."}
          </p>

          {notFound && (
            <div style={{ padding: "12px 14px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, fontSize: 13, color: "#991b1b", marginBottom: 12 }}>
              {lang === "en"
                ? "Registration not found. Check the number and try again."
                : "Inscrição não encontrada. Verifique o número e tente novamente."}
            </div>
          )}

          {cancelDone && (
            <div style={{ padding: "12px 14px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, fontSize: 13, color: "#065f46", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={15} />
              {lang === "en" ? "Registration cancelled successfully." : "Inscrição cancelada com sucesso."}
            </div>
          )}

          {/* Result */}
          {found && (
            <div>
              <RegCard reg={found} onCancel={() => setCancelTarget([found.id])} lang={lang} />

              {activeRelated.length > 0 && !found.cancelled && (
                <div style={{ marginTop: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".5px", margin: "12px 0 8px" }}>
                    {lang === "en" ? "Family / Same group" : "Família / Mesmo grupo"}
                  </div>
                  {activeRelated.map((r) => (
                    <RegCard key={r.id} reg={r} onCancel={() => setCancelTarget([r.id])} lang={lang} />
                  ))}
                  <button
                    className="btn btn-ghost"
                    style={{ width: "100%", marginTop: 4, color: "#991b1b", borderColor: "#fca5a5", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                    onClick={() => setCancelTarget([found.id, ...activeRelated.map((r) => r.id)])}
                  >
                    <XCircle size={14} />
                    {lang === "en"
                      ? `Cancel all ${activeRelated.length + 1} registrations`
                      : `Cancelar todas as ${activeRelated.length + 1} inscrições do grupo`}
                  </button>
                </div>
              )}

              {/* Cancel confirmation inline */}
              {cancelTarget && (
                <div style={{ marginTop: 12, padding: "16px", background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 10 }}>
                  <div style={{ fontWeight: 700, color: "#991b1b", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <AlertTriangle size={16} />
                    {lang === "en" ? "Confirm cancellation" : "Confirmar cancelamento"}
                  </div>
                  <p style={{ fontSize: 13, color: "#374151", marginBottom: 14, lineHeight: 1.5 }}>
                    {cancelTarget.length > 1
                      ? (lang === "en"
                          ? `Cancel all ${cancelTarget.length} registrations in this group? This cannot be undone.`
                          : `Cancelar as ${cancelTarget.length} inscrições deste grupo? Esta ação não pode ser desfeita.`)
                      : (lang === "en"
                          ? "Cancel this registration? This cannot be undone."
                          : "Cancelar esta inscrição? Esta ação não pode ser desfeita.")}
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setCancelTarget(null)}>
                      {lang === "en" ? "Keep it" : "Manter"}
                    </button>
                    <button
                      className="btn btn-accent"
                      style={{ flex: 1, background: "#dc2626", borderColor: "#dc2626" }}
                      onClick={() => doCancel(cancelTarget)}
                    >
                      {lang === "en" ? "Yes, cancel" : "Sim, cancelar"}
                    </button>
                  </div>
                </div>
              )}

              {!cancelTarget && (
                <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 14, textAlign: "center" }}>
                  {lang === "en"
                    ? "For other changes, please speak with a registration clerk."
                    : "Para outras alterações, fale com um atendente."}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
