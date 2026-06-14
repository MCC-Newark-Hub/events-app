import { useState } from "react";
import { Search, ArrowLeft, XCircle, CheckCircle2, AlertTriangle, UserPlus } from "lucide-react";
import { fmt, CATEGORIES, ROLE_BADGE } from "@/constants";

const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function extractBatchId(note) {
  const m = (note || "").match(/\[B\d+\]/);
  return m ? m[0] : null;
}

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
        {reg.fee === 0 && (
          <div>
            <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 1, textTransform: "uppercase", letterSpacing: ".5px" }}>Taxa</div>
            <div style={{ fontSize: 13, color: "#065f46" }}>{reg.exempt ? "Isento" : "Grátis"}</div>
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

export default function RegistrationLookup({ event, regs, members, updateReg, addReg, lang, onBack }) {
  const [searchMode, setSearchMode] = useState("number"); // "number" | "name"
  const [query, setQuery] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [found, setFound] = useState(null);
  const [related, setRelated] = useState([]);
  const [notFound, setNotFound] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelDone, setCancelDone] = useState(false);

  // Add family state
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [famSearch, setFamSearch] = useState("");
  const [famSelected, setFamSelected] = useState(null);
  const [showManual, setShowManual] = useState(false);
  const [manualMember, setManualMember] = useState({ name: "", category: "Adulto" });
  const [addDone, setAddDone] = useState(false);

  const registeredIds = (regs || [])
    .filter((r) => r.eventId === event?.id && !r.cancelled)
    .map((r) => r.memberId);

  const famResults =
    famSearch.length > 1
      ? (members || [])
          .filter((m) => norm(m.name).includes(norm(famSearch)) && !registeredIds.includes(m.id))
          .slice(0, 8)
      : [];

  const nameResults =
    nameQuery.length > 1
      ? (regs || [])
          .filter((r) => r.eventId === event?.id && norm(r.memberName).includes(norm(nameQuery)))
          .slice(0, 10)
      : [];

  const resolveRelated = (reg) => {
    const batchId = extractBatchId(reg.note);
    return batchId
      ? (regs || []).filter(
          (r) => r.id !== reg.id && r.eventId === reg.eventId && extractBatchId(r.note) === batchId && !r.cancelled
        )
      : reg.note
      ? (regs || []).filter(
          (r) => r.id !== reg.id && r.eventId === reg.eventId && r.note === reg.note && !r.cancelled
        )
      : [];
  };

  const selectReg = (reg) => {
    setFound(reg);
    setRelated(resolveRelated(reg));
    setNotFound(false);
    setCancelDone(false);
    setAddDone(false);
    setShowAddFamily(false);
    setNameQuery("");
  };

  const handleSearch = () => {
    const q = query.trim().toUpperCase();
    if (!q) return;
    const reg = (regs || []).find((r) => r.regNumber === q);
    if (!reg) {
      setFound(null);
      setRelated([]);
      setNotFound(true);
      setCancelDone(false);
      setAddDone(false);
      return;
    }
    selectReg(reg);
  };

  const switchMode = (mode) => {
    setSearchMode(mode);
    setFound(null);
    setRelated([]);
    setNotFound(false);
    setQuery("");
    setNameQuery("");
    setCancelDone(false);
    setAddDone(false);
  };

  const doCancel = (ids) => {
    ids.forEach((id) => {
      updateReg(id, { cancelled: true }, { status: "Cancelado", note: "Cancelado pelo portal público" }, { silent: true });
    });
    if (found && ids.includes(found.id)) setFound((prev) => ({ ...prev, cancelled: true }));
    setRelated((prev) => prev.filter((r) => !ids.includes(r.id)));
    setCancelTarget(null);
    setCancelDone(true);
  };

  const handleAddFamily = () => {
    if (!famSelected || !found || !addReg) return;
    const isVerified = !famSelected.id?.startsWith("MANUAL-");
    const newReg = addReg({
      memberId: isVerified ? famSelected.id : "GUEST",
      memberName: famSelected.name,
      badgeName: famSelected.name,
      category: famSelected.category || "Adulto",
      church: famSelected.church || "",
      role: famSelected.role || "",
      familyId: null,
      team: "Participante",
      paid: false,
      exempt: false,
      note: found.note, // inherit batch token + contact info from existing registration
    });
    setRelated((prev) => [...prev, newReg]);
    setAddDone(true);
    setShowAddFamily(false);
    setFamSelected(null);
    setFamSearch("");
    setManualMember({ name: "", category: "Adulto" });
    setShowManual(false);
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
              ? "Enter your registration number to check your status, cancel, or add family members."
              : "Digite seu número de inscrição para consultar, cancelar ou adicionar familiares."}
          </p>
        </div>

        <div style={{ background: "#fff", borderRadius: 20, padding: "24px 20px" }}>
          {/* Mode tabs */}
          <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 8, padding: 3, marginBottom: 16, gap: 2 }}>
            {[
              { key: "number", label: lang === "en" ? "By reg number" : "Por número" },
              { key: "name",   label: lang === "en" ? "By name"       : "Por nome" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => switchMode(key)}
                style={{
                  flex: 1, padding: "7px 0", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", borderRadius: 6,
                  background: searchMode === key ? "#fff" : "transparent",
                  color: searchMode === key ? "#1a1e2e" : "#6b7280",
                  boxShadow: searchMode === key ? "0 1px 3px rgba(0,0,0,.1)" : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search by number */}
          {searchMode === "number" && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                <input
                  value={query}
                  onChange={(e) => { setQuery(e.target.value.toUpperCase()); setNotFound(false); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder={event?.prefix ? `ex: ${event.prefix}-20260614-0001` : "ex: MCC-20260614-0001"}
                  style={{ flex: 1, fontFamily: "monospace", letterSpacing: ".04em", textTransform: "uppercase" }}
                />
                <button className="btn btn-primary" onClick={handleSearch} style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <Search size={15} /> {lang === "en" ? "Search" : "Buscar"}
                </button>
              </div>
              <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 16 }}>
                {lang === "en" ? "Your reg number was shown on the confirmation screen." : "O número foi exibido na tela de confirmação."}
              </p>
            </>
          )}

          {/* Search by name */}
          {searchMode === "name" && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                <input
                  value={nameQuery}
                  onChange={(e) => { setNameQuery(e.target.value); setNotFound(false); setFound(null); }}
                  placeholder={lang === "en" ? "Type your name..." : "Digite seu nome..."}
                  style={{ flex: 1 }}
                  autoFocus
                />
              </div>
              <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: nameResults.length ? 8 : 16 }}>
                {lang === "en" ? "Type at least 2 characters to search." : "Digite ao menos 2 caracteres para buscar."}
              </p>
              {nameResults.length > 0 && !found && (
                <div style={{ border: "1.5px solid var(--border)", borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
                  {nameResults.map((r) => {
                    const st = getRegStatus(r);
                    return (
                      <div
                        key={r.id}
                        onClick={() => selectReg(r)}
                        style={{ padding: "11px 14px", cursor: "pointer", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f8faff")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{r.memberName}</div>
                          <div style={{ fontFamily: "monospace", fontSize: 11, color: "#b41926", marginTop: 1 }}>{r.regNumber}</div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: st.bg, color: st.color, whiteSpace: "nowrap" }}>
                          {st.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              {nameQuery.length > 1 && nameResults.length === 0 && !found && (
                <div style={{ padding: "12px 14px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, fontSize: 13, color: "#991b1b", marginBottom: 12 }}>
                  {lang === "en" ? "No registrations found for that name." : "Nenhuma inscrição encontrada com esse nome."}
                </div>
              )}
            </>
          )}

          {notFound && (
            <div style={{ padding: "12px 14px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, fontSize: 13, color: "#991b1b", marginBottom: 12 }}>
              {lang === "en" ? "Registration not found. Check the number and try again." : "Inscrição não encontrada. Verifique o número e tente novamente."}
            </div>
          )}

          {cancelDone && (
            <div style={{ padding: "12px 14px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, fontSize: 13, color: "#065f46", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={15} /> {lang === "en" ? "Registration cancelled successfully." : "Inscrição cancelada com sucesso."}
            </div>
          )}

          {addDone && (
            <div style={{ padding: "12px 14px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, fontSize: 13, color: "#065f46", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={15} /> {lang === "en" ? "Family member added successfully." : "Familiar adicionado com sucesso."}
            </div>
          )}

          {found && (
            <div>
              <RegCard reg={found} onCancel={() => setCancelTarget([found.id])} lang={lang} />

              {/* Family / same group */}
              {(activeRelated.length > 0 || found.cancelled === false) && (
                <div style={{ marginTop: 4 }}>
                  {activeRelated.length > 0 && (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".5px", margin: "12px 0 8px" }}>
                        {lang === "en" ? "Family / Same group" : "Família / Mesmo grupo"}
                      </div>
                      {activeRelated.map((r) => (
                        <RegCard key={r.id} reg={r} onCancel={() => setCancelTarget([r.id])} lang={lang} />
                      ))}
                      {!found.cancelled && (
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
                      )}
                    </>
                  )}

                  {/* Add family member */}
                  {!found.cancelled && !showAddFamily && (
                    <button
                      className="btn btn-ghost"
                      style={{ width: "100%", marginTop: 8, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                      onClick={() => { setShowAddFamily(true); setAddDone(false); }}
                    >
                      <UserPlus size={14} />
                      {lang === "en" ? "Add family member" : "Adicionar familiar"}
                    </button>
                  )}
                </div>
              )}

              {/* Add family member panel */}
              {showAddFamily && !found.cancelled && (
                <div style={{ marginTop: 12, border: "1.5px solid #bfdbfe", borderRadius: 10, padding: "16px" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1e40af", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <UserPlus size={16} /> {lang === "en" ? "Add family member" : "Adicionar familiar"}
                  </div>

                  {!famSelected && (
                    <>
                      <label style={{ fontSize: 13 }}>{lang === "en" ? "Search by name" : "Buscar pelo nome"}</label>
                      <div style={{ position: "relative", marginTop: 4, marginBottom: 8 }}>
                        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}><Search size={14} /></span>
                        <input
                          value={famSearch}
                          onChange={(e) => setFamSearch(e.target.value)}
                          placeholder={lang === "en" ? "Type name..." : "Digite o nome..."}
                          style={{ paddingLeft: 32, width: "100%", boxSizing: "border-box" }}
                          autoFocus
                        />
                      </div>

                      {famResults.length > 0 && (
                        <div style={{ border: "1.5px solid var(--border)", borderRadius: 8, overflow: "hidden", maxHeight: 180, overflowY: "auto", marginBottom: 8 }}>
                          {famResults.map((m) => (
                            <div
                              key={m.id}
                              onClick={() => { setFamSelected(m); setFamSearch(""); }}
                              style={{ padding: "9px 14px", cursor: "pointer", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                            >
                              <div>
                                <span style={{ fontWeight: 600 }}>{m.name}</span>
                                <span style={{ marginLeft: 8, fontSize: 12, color: "#6b7280" }}>{m.church}</span>
                              </div>
                              <span className="badge badge-blue">{m.category}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {famSearch.length > 1 && famResults.length === 0 && (
                        <p style={{ fontSize: 12, color: "#b45309", background: "#fef3c7", borderRadius: 6, padding: "8px 10px", marginBottom: 8 }}>
                          {lang === "en" ? "Not found in directory." : "Não encontrado no diretório."}
                        </p>
                      )}

                      <div className="cb" style={{ marginTop: 4 }}>
                        <input type="checkbox" id="lk-manual" checked={showManual} onChange={(e) => setShowManual(e.target.checked)} />
                        <label htmlFor="lk-manual" style={{ fontSize: 13 }}>
                          {lang === "en" ? "Member not found — add manually" : "Membro não encontrado — adicionar manualmente"}
                        </label>
                      </div>

                      {showManual && (
                        <div style={{ marginTop: 10, background: "#fffbeb", border: "1px solid #f59e0b", borderRadius: 8, padding: "12px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div>
                              <label style={{ fontSize: 13 }}>{lang === "en" ? "Full name" : "Nome completo"}</label>
                              <input value={manualMember.name} onChange={(e) => setManualMember({ ...manualMember, name: e.target.value })} />
                            </div>
                            <div>
                              <label style={{ fontSize: 13 }}>{lang === "en" ? "Category" : "Categoria"}</label>
                              <select value={manualMember.category} onChange={(e) => setManualMember({ ...manualMember, category: e.target.value })}>
                                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>
                            <button
                              className="btn btn-warn btn-sm"
                              onClick={() => {
                                if (!manualMember.name.trim()) return;
                                setFamSelected({ id: "MANUAL-" + Date.now(), name: manualMember.name.trim(), category: manualMember.category, church: "", role: "", verified: false });
                                setShowManual(false);
                              }}
                            >
                              {lang === "en" ? "Use this name" : "Usar este nome"}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Selected member preview */}
                  {famSelected && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <span style={{ fontWeight: 600 }}>{famSelected.name}</span>
                          {famSelected.verified === false && (
                            <span style={{ marginLeft: 6, fontSize: 10, background: "#fef3c7", color: "#92400e", padding: "1px 6px", borderRadius: 99, fontWeight: 700 }}>Não verificado</span>
                          )}
                          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{famSelected.category}{famSelected.church ? ` · ${famSelected.church}` : ""}</div>
                        </div>
                        <button onClick={() => { setFamSelected(null); setFamSearch(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 18 }}>×</button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, marginTop: famSelected ? 0 : 12 }}>
                    <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setShowAddFamily(false); setFamSelected(null); setFamSearch(""); setShowManual(false); }}>
                      {lang === "en" ? "Cancel" : "Cancelar"}
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 2 }}
                      disabled={!famSelected}
                      onClick={handleAddFamily}
                    >
                      <UserPlus size={14} style={{ marginRight: 4 }} />
                      {lang === "en" ? "Add to registration" : "Adicionar à inscrição"}
                    </button>
                  </div>
                </div>
              )}

              {/* Cancel confirmation */}
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

              {!cancelTarget && !showAddFamily && (
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
