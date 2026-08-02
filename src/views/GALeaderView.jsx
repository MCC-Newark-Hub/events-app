import { useState } from "react";
import { useT } from "@/i18n/strings";
import { ROLE_BADGE } from "@/constants";
import { sb } from "@/lib/supabase";
import Topbar from "@/components/Topbar";
import Modal from "@/components/Modal";
import SearchSelect from "@/components/SearchSelect";
import FamiliesPanel from "@/components/directory/FamiliesPanel";
import MemberEditModal from "@/components/directory/MemberEditModal";
import { newMemberForm, memberToForm } from "@/lib/memberForm";
import { resendConfirmation } from "@/lib/resendConfirmation";

const cityOf = (s) => (s || "").split(",")[0].trim().toLowerCase();

function GALeaderView(props) {
  const { event, regs, setRegs, members, setMembers, gas, families, setFamilies, user, logout, lang, setLang, theme, toggleTheme, notify } = props;
  const t = useT();
  const [resendingId, setResendingId] = useState(null);
  const [managingGA, setManagingGA] = useState(null);
  const [pendingMove, setPendingMove] = useState(null); // { member, fromGA, toGA }
  const [editingMember, setEditingMember] = useState(null);
  const [savingMember, setSavingMember] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState("");
  const [showFamilies, setShowFamilies] = useState(false);
  const [transferMemberId, setTransferMemberId] = useState("");
  const [transferTargetGaId, setTransferTargetGaId] = useState("");
  const myGAs = gas.filter((g) => user?.gaIds?.includes(g.id));
  const myChurch = user?.church || "";
  const myCity = cityOf(myChurch);
  const myMembers = members.filter((m) => cityOf(m.church) === myCity);
  const myFamilies = families.filter((f) => (f.memberIds || []).some((id) => myMembers.some((m) => m.id === id)));
  const myChurchGAs = gas.filter((g) => cityOf(g.church) === myCity);
  const joinNames = (names) =>
    names.length === 0 ? "" :
    names.length === 1 ? names[0] :
    names.slice(0, -1).join(", ") + " e " + names[names.length - 1];
  const greetingName = joinNames(myGAs.map((g) => g.name)) || user?.name;
  const eventRegs = regs.filter((r) => r.eventId === event?.id && !r.cancelled && !r.waitlisted);
  const getStatus = (mid) => {
    const r = eventRegs.find((x) => x.memberId === mid);
    if (!r) return "not_registered";
    return r.paid || r.exempt ? "confirmed" : "pending";
  };
  const getReg = (mid) => eventRegs.find((x) => x.memberId === mid);

  const handleResend = async (reg) => {
    setResendingId(reg.id);
    const result = await resendConfirmation(reg.id);
    setResendingId(null);
    if (result.ok) notify(t.resendSuccess);
    else if (result.reason === "no_email") notify(t.resendNoEmail);
    else notify(t.resendError);
  };

  const applyMove = async ({ member, toGA }) => {
    const { error } = await sb.from("members").update({ ga_id: toGA.id }).eq("id", member.id);
    if (error) { notify("Erro: " + error.message); return; }
    setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, gaId: toGA.id } : m)));
    notify(`${member.name} movido(a) para ${toGA.name}.`);
    setPendingMove(null);
  };

  // Moving a member who's already in a different group needs confirmation so leaders
  // don't silently pull members out from under another leader.
  const requestMove = (member, toGA) => {
    if (!member || !toGA) return;
    const fromGA = member.gaId && member.gaId !== toGA.id ? gas.find((g) => g.id === member.gaId) : null;
    if (fromGA) {
      setPendingMove({ member, fromGA, toGA });
    } else {
      applyMove({ member, toGA });
    }
  };

  // Summary stats across all my GAs
  const allMyMembers = myGAs.flatMap((ga) => members.filter((m) => m.gaId === ga.id));
  const totalMembers = allMyMembers.length;
  const totalReg = allMyMembers.filter((m) => getStatus(m.id) !== "not_registered").length;
  const totalNotReg = totalMembers - totalReg;
  const pct = totalMembers > 0 ? Math.round((totalReg / totalMembers) * 100) : 0;
  const categories = [...new Set(allMyMembers.map((m) => m.category).filter(Boolean))].sort();

  return (
    <div className="app-shell">
      <Topbar
        title={t.gaTitle}
        sub={event?.name}
        user={user}
        logout={logout}
        lang={lang}
        setLang={setLang}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <div className="main-scroll">
        <div className="page-pad">
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 10 }}>
            <div>
              <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 22 }}>
                {t.hello}, {greetingName}!
              </h2>
              <p style={{ color: "#6b7280", fontSize: 13 }}>{t.readOnlyNote}</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowFamilies((v) => !v)}>
                {showFamilies ? "Ocultar Famílias" : `👪 Famílias (${myFamilies.length})`}
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => { setEditingMember(newMemberForm()); setNewFamilyName(""); }}>
                + Novo Membro
              </button>
            </div>
          </div>

          {showFamilies && (
            <div style={{ marginBottom: 20 }}>
              <FamiliesPanel members={myMembers} families={myFamilies} setFamilies={setFamilies} notify={notify} />
            </div>
          )}

          {/* ── Transfer member between groups (same church only) ── */}
          {myChurchGAs.length > 1 && (
            <div className="card" style={{ marginBottom: 20, padding: "14px 16px" }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>🔀 Transferir Membro Entre Grupos</div>
              <div className="fr" style={{ marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 12 }}>Membro</label>
                  <SearchSelect
                    value={transferMemberId}
                    onSelect={setTransferMemberId}
                    items={myMembers}
                    getLabel={(m) => m?.name || ""}
                    getId={(m) => m?.id || ""}
                    placeholder="Buscar membro…"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12 }}>Grupo de destino</label>
                  <select value={transferTargetGaId} onChange={(e) => setTransferTargetGaId(e.target.value)}>
                    <option value="">Selecione…</option>
                    {myChurchGAs.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                disabled={!transferMemberId || !transferTargetGaId}
                onClick={() => {
                  const member = myMembers.find((m) => m.id === transferMemberId);
                  const toGA = myChurchGAs.find((g) => g.id === transferTargetGaId);
                  if (!member || !toGA) return;
                  if (member.gaId === toGA.id) { notify(`${member.name} já está em ${toGA.name}.`); return; }
                  requestMove(member, toGA);
                  setTransferMemberId("");
                  setTransferTargetGaId("");
                }}
              >
                Transferir
              </button>
            </div>
          )}

          {/* ── Summary card ── */}
          {totalMembers > 0 && (
            <div className="card" style={{ marginBottom: 20, padding: "16px 20px" }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Resumo Geral</div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
                <div style={{ textAlign: "center", minWidth: 80 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#065f46" }}>{pct}%</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>Inscritos</div>
                </div>
                <div style={{ textAlign: "center", minWidth: 80 }}>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>{totalReg}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>de {totalMembers} inscritos</div>
                </div>
                <div style={{ textAlign: "center", minWidth: 80 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: totalNotReg > 0 ? "#b45309" : "#065f46" }}>{totalNotReg}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>não inscritos</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {categories.map((cat) => {
                  const catMembers = allMyMembers.filter((m) => m.category === cat);
                  const catReg = catMembers.filter((m) => getStatus(m.id) !== "not_registered").length;
                  const catPct = catMembers.length > 0 ? Math.round((catReg / catMembers.length) * 100) : 0;
                  return (
                    <div key={cat} style={{ background: "var(--sidebar-active-bg)", borderRadius: 8, padding: "6px 10px", fontSize: 12, minWidth: 100 }}>
                      <div style={{ fontWeight: 600 }}>{cat}</div>
                      <div style={{ color: "#6b7280" }}>{catReg}/{catMembers.length} — {catPct}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {myGAs.map((ga) => {
            const gam = members.filter((m) => m.gaId === ga.id);
            const notR = gam.filter((m) => getStatus(m.id) === "not_registered");
            const pendG = gam.filter((m) => getStatus(m.id) === "pending");
            const conf = gam.filter((m) => getStatus(m.id) === "confirmed");
            return (
              <div key={ga.id} style={{ marginBottom: 22 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: 16 }}>{ga.name}</h3>
                    <p style={{ fontSize: 12, color: "#6b7280" }}>{ga.church}</p>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span className="badge badge-green">{conf.length}✓</span>
                    <span className="badge badge-yellow">{pendG.length}⏳</span>
                    <span className="badge badge-gray">{notR.length}○</span>
                    <button className="btn btn-ghost btn-xs" onClick={() => setManagingGA(ga)}>👥 Gerenciar Membros</button>
                  </div>
                </div>
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>{t.memberName}</th>
                          <th>{t.cat}</th>
                          <th>{t.cargo}</th>
                          <th>{t.regH}</th>
                          <th>{t.situH}</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {gam.map((m) => {
                          const s = getStatus(m.id);
                          const reg = getReg(m.id);
                          return (
                            <tr key={m.id}>
                              <td style={{ fontWeight: 600 }}>{m.name}</td>
                              <td>
                                <span className="badge badge-blue">{m.category}</span>
                              </td>
                              <td>
                                {m.role ? (
                                  <span className={`badge ${ROLE_BADGE[m.role]}`}>{m.role}</span>
                                ) : (
                                  <span style={{ color: "#9ca3af" }}>—</span>
                                )}
                              </td>
                              <td>
                                {s === "not_registered" ? (
                                  <span className="badge badge-gray">○</span>
                                ) : s === "pending" ? (
                                  <span className="badge badge-yellow">⏳</span>
                                ) : (
                                  <span className="badge badge-green">✓</span>
                                )}
                              </td>
                              <td style={{ fontSize: 12, color: "#6b7280" }}>
                                {s === "not_registered"
                                  ? "—"
                                  : s === "pending"
                                    ? t.payAtDesk
                                    : `✓ ${t.confirmed}`}
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: 4 }}>
                                  <button
                                    className="btn btn-ghost btn-xs"
                                    onClick={() => { setEditingMember(memberToForm(m)); setNewFamilyName(""); }}
                                    title="Editar membro"
                                  >
                                    ✏️
                                  </button>
                                  {reg && (
                                    <button
                                      className="btn btn-ghost btn-xs"
                                      disabled={resendingId === reg.id}
                                      onClick={() => handleResend(reg)}
                                      title={t.resendConfirmation}
                                    >
                                      {resendingId === reg.id ? "…" : "📧"}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                {notR.length > 0 && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: "10px 14px",
                      background: "#fef3c7",
                      borderRadius: 8,
                      fontSize: 13,
                      color: "#92400e",
                    }}
                  >
                    ⚠️{" "}
                    <strong>
                      {notR.length} {t.notRegisteredWarn}:
                    </strong>{" "}
                    {notR.map((m) => m.name).join(", ")} — {t.reachOut}
                  </div>
                )}
                {pendG.length > 0 && (
                  <div
                    style={{
                      marginTop: 6,
                      padding: "10px 14px",
                      background: "var(--sidebar-active-bg,#fdf5f5)",
                      borderRadius: 8,
                      fontSize: 13,
                      color: "#1e40af",
                    }}
                  >
                    💵{" "}
                    <strong>
                      {pendG.length} {t.pendPayWarn}
                    </strong>{" "}
                    {t.payAtDesk}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {managingGA && (() => {
        const gaMembers = members.filter((m) => m.gaId === managingGA.id);
        const unassigned = members.filter((m) => cityOf(m.church) === cityOf(managingGA.church) && (!m.gaId || m.gaId !== managingGA.id));
        return (
          <Modal onClose={() => setManagingGA(null)} maxWidth={520}>
            <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, marginBottom: 4 }}>
              {managingGA.name} — Membros
            </h3>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
              {gaMembers.length} membro{gaMembers.length !== 1 ? "s" : ""} neste grupo
            </p>
            <div style={{ marginBottom: 16, position: "relative", zIndex: 10 }}>
              <label style={{ fontWeight: 600, fontSize: 13 }}>Adicionar membro</label>
              <SearchSelect
                value=""
                onSelect={(memberId) => {
                  if (!memberId) return;
                  const member = members.find((m) => m.id === memberId);
                  requestMove(member, managingGA);
                }}
                items={unassigned}
                getLabel={(m) => m.name}
                getId={(m) => m.id}
                placeholder="Buscar membro para adicionar…"
              />
            </div>
            <div style={{ maxHeight: 320, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 8 }}>
              {gaMembers.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--muted)", padding: 20, fontSize: 13 }}>Nenhum membro neste grupo.</p>
              ) : gaMembers.map((m) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{m.name}</span>
                    <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 8 }}>{m.category} · {m.church}</span>
                  </div>
                  <button className="btn btn-ghost btn-xs" title="Remover do grupo" onClick={async () => {
                    const { error } = await sb.from("members").update({ ga_id: null }).eq("id", m.id);
                    if (error) { notify("Erro: " + error.message); return; }
                    setMembers((prev) => prev.map((x) => x.id === m.id ? { ...x, gaId: null } : x));
                  }}>✕</button>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost" style={{ marginTop: 16, width: "100%" }} onClick={() => setManagingGA(null)}>Fechar</button>
          </Modal>
        );
      })()}

      <MemberEditModal
        editingMember={editingMember}
        setEditingMember={setEditingMember}
        savingMember={savingMember}
        setSavingMember={setSavingMember}
        newFamilyName={newFamilyName}
        setNewFamilyName={setNewFamilyName}
        families={myFamilies}
        setFamilies={setFamilies}
        members={members}
        setMembers={setMembers}
        defaultChurch={myChurch}
        notify={notify}
        setRegs={setRegs}
      />

      {pendingMove && (
        <Modal onClose={() => setPendingMove(null)} maxWidth={380}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔀</div>
            <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 17, marginBottom: 10 }}>Mover membro?</h3>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>
              <strong>{pendingMove.member.name}</strong> já está em <strong>{pendingMove.fromGA.name}</strong>.
              Mover para <strong>{pendingMove.toGA.name}</strong>?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setPendingMove(null)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => applyMove(pendingMove)}>Mover</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── TEAM LEADER VIEW ──────────────────────────────────────────────────────────
export default GALeaderView;
