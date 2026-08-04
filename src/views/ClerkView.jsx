import { useState } from "react";
import { Search, ClipboardList, Users, Home, HeartHandshake, BarChart2 } from "lucide-react";
import { useT } from "@/i18n/strings";
import { ROLE_BADGE, fmt, deadlineStatus } from "@/constants";
import { sb } from "@/lib/supabase";
import { eventSubtitle } from "@/lib/registrationDeadline";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import CapBar from "@/components/CapBar";
import StatusBadge from "@/components/StatusBadge";
import RegModal from "@/components/RegModal";
import DetailModal from "@/components/DetailModal";
import Modal from "@/components/Modal";
import FamiliesPanel from "@/components/directory/FamiliesPanel";
import GroupsPanel from "@/components/directory/GroupsPanel";
import MemberEditModal from "@/components/directory/MemberEditModal";
import RoleBadges from "@/components/directory/RoleBadges";
import ReportsTab from "./admin/ReportsTab";
import { newMemberForm, memberToForm } from "@/lib/memberForm";
import { resendConfirmation } from "@/lib/resendConfirmation";
import { useSortable } from "@/hooks/useSortable";

const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const statusSortOf = (r) => r.cancelled ? "cancelado" : r.waitlisted ? "lista de espera" : r.excedente ? "excedente" : r.exempt ? "isento" : r.paid ? "pago" : "pendente";

function ClerkView(props) {
  const { event, regs, setRegs, members, setMembers, families, setFamilies, gas, setGas, churches, dbTeams, addReg, updateReg, updatePresence, promoteFromWaitlist, submitApproval, approvals, user, logout, activeCount, isFull, wlRegs, exRegs, lang, setLang, pendingApprovals, theme, toggleTheme, notify } = props;
  const t = useT();
  const [sec, setSec] = useState("regs");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("active");
  const [showReg, setShowReg] = useState(false);
  const [detail, setDetail] = useState(null);
  const [prefill, setPrefill] = useState(null);
  const [resendingId, setResendingId] = useState(null);
  const [bulkSel, setBulkSel] = useState([]);
  const [confirmBulkCancel, setConfirmBulkCancel] = useState(false);
  const toggleBulk = (id) => setBulkSel((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const handleResend = async (reg) => {
    setResendingId(reg.id);
    const result = await resendConfirmation(reg.id);
    setResendingId(null);
    if (result.ok) notify(t.resendSuccess);
    else if (result.reason === "no_email") notify(t.resendNoEmail);
    else notify(t.resendError);
  };
  const [editingMember, setEditingMember] = useState(null);
  const [savingMember, setSavingMember] = useState(false);
  const [confirmDeleteMember, setConfirmDeleteMember] = useState(null);
  const [deletingMember, setDeletingMember] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState("");

  const cityOf = (s) => (s || "").split(",")[0].trim().toLowerCase();
  const myChurch = user?.church || "";
  const myCity = cityOf(myChurch);
  const myMembers = members.filter((m) => cityOf(m.church) === myCity);

  const eventApprovals = (approvals || []).filter((a) => a.eventId === event?.id);
  const pendingApprovalList = eventApprovals.filter((a) => a.status === "pending");
  const resolvedApprovalList = eventApprovals.filter((a) => a.status !== "pending");
  const allActiveAll = regs.filter((r) => r.eventId === event?.id && !r.cancelled && !r.waitlisted);
  const allActive = allActiveAll.filter((r) => cityOf(r.church) === myCity);
  // Includes cancelled rows too, unlike allActive — deadlineStatus needs a member's
  // full history to anchor the payment countdown to their earliest attempt.
  const allForCity = regs.filter((r) => r.eventId === event?.id && cityOf(r.church) === myCity);
  const myWlRegs = (wlRegs || []).filter((r) => cityOf(r.church) === myCity);
  const myExRegs = allActive.filter((r) => r.excedente);
  const isOverdue = (r) => deadlineStatus(r, event, allForCity)?.overdue;
  const myOverdueRegs = allActive.filter(isOverdue);
  const viewRegsBase = (
    tab === "active" ? allActive
    : tab === "waitlist" ? myWlRegs
    : tab === "overdue" ? myOverdueRegs
    : regs.filter((r) => r.eventId === event?.id && r.cancelled && cityOf(r.church) === myCity)
  ).filter((r) => {
    const q = norm(search);
    return norm(r.memberName).includes(q) || norm(r.regNumber).includes(q) || norm(r.church).includes(q) ||
      norm(r.role).includes(q) || norm(r.category).includes(q) || norm(r.team).includes(q) || norm(statusSortOf(r)).includes(q);
  }).map((r) => ({ ...r, statusSort: statusSortOf(r) }));
  const { sorted: viewRegs, Th } = useSortable(viewRegsBase, "memberName");
  const suggestions = sec === "regs" && tab !== "approvals" && search.length > 1 ? myMembers.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()) && !allActiveAll.find((r) => r.memberId === m.id)).slice(0, 5) : [];
  const memberList = myMembers
    .filter((m) => (m.name || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  const tabs = [
    { k: "active", l: `${t.activeTab} (${allActive.length})` },
    { k: "waitlist", l: `${t.waitlistTab} (${myWlRegs.length})` },
    { k: "overdue", l: `${t.overdueTab} (${myOverdueRegs.length})` },
    { k: "cancelled", l: t.cancelledTab },
    { k: "approvals", l: `Solicitações${pendingApprovalList.length > 0 ? ` (${pendingApprovalList.length})` : ""}` },
  ];

  const myFamilies = families.filter((f) => (f.memberIds || []).some((id) => myMembers.some((m) => m.id === id)));
  const myGas = (gas || []).filter((g) => cityOf(g.church) === myCity);

  const navItems = [
    { id: "regs", icon: <ClipboardList size={16} />, label: t.registrations || "Inscrições" },
    { id: "reports", icon: <BarChart2 size={16} />, label: t.reports },
    { id: "members", icon: <Users size={16} />, label: `Membros (${myMembers.length})` },
    { id: "families", icon: <Home size={16} />, label: `Famílias (${myFamilies.length})` },
    { id: "groups", icon: <HeartHandshake size={16} />, label: `Grupos (${myGas.length})` },
  ];
  const switchSec = (id) => { setSec(id); setSearch(""); };

  const openNewMember = () => { setEditingMember(newMemberForm()); setNewFamilyName(""); };
  const openEditMember = (m) => { setEditingMember(memberToForm(m)); setNewFamilyName(""); };

  const requestDeleteMember = (m) => {
    const regCount = regs.filter((r) => r.memberId === m.id && !r.cancelled).length;
    setConfirmDeleteMember({ id: m.id, name: m.name, regCount });
  };

  const confirmDeleteMemberNow = async () => {
    if (!confirmDeleteMember || confirmDeleteMember.regCount > 0) return;
    setDeletingMember(true);
    try {
      const { error } = await sb.from("members").delete().eq("id", confirmDeleteMember.id);
      if (error) throw error;
      setMembers((prev) => prev.filter((m) => m.id !== confirmDeleteMember.id));
      notify("Membro removido.");
      setConfirmDeleteMember(null);
    } catch (err) {
      notify("Erro ao remover membro: " + (err?.message || "erro desconhecido"));
    } finally {
      setDeletingMember(false);
    }
  };

  return (
    <div className="app-shell">
      <Topbar title={user?.name || t.clerkTitle} sub={`${t.clerkTitle} · ${eventSubtitle(event, lang)}`} user={user} logout={logout} pendingCount={pendingApprovalList.length} lang={lang} setLang={setLang} theme={theme} toggleTheme={toggleTheme} />
      <div className="body-with-sidebar">
        <Sidebar navItems={navItems} activeId={sec} onSelect={switchSec} />
        <div className="main-scroll">
        <div className="page-pad">
          {pendingApprovalList.length > 0 && (
            <div onClick={() => { switchSec("regs"); setTab("approvals"); }} style={{ background: "#fffbeb", border: "1.5px solid #f59e0b", borderRadius: 10, padding: "10px 16px", marginBottom: 14, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#92400e" }}>
              ⏳ Você tem {pendingApprovalList.length} solicitaç{pendingApprovalList.length === 1 ? "ão pendente" : "ões pendentes"}.
            </div>
          )}

          {sec === "regs" ? (
            <>
              <CapBar event={event} activeCount={activeCount} wlCount={wlRegs.length} exCount={exRegs.length} />

              <div className="stat-grid-4" style={{ marginBottom: 18 }}>
                {[
                  { label: t.registered, value: allActive.length, color: "#1a3a6b" },
                  { label: t.paid, value: allActive.filter((r) => r.paid || r.exempt).length, color: "#2d8a4e" },
                  { label: t.pending, value: allActive.filter((r) => !r.paid && !r.exempt).length, color: "#d4820a" },
                  { label: t.waitlist, value: myWlRegs.length, color: "#92400e" },
                ].map((s) => (
                  <div className="stat-card" key={s.label} style={{ textAlign: "center", borderTop: `3px solid ${s.color}` }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {tab !== "approvals" && (
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <div className="sb" style={{ flex: 1 }}>
                    <span className="si-icon"><Search size={16} /></span>
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${t.searchMember}...`} />
                  </div>
                  {bulkSel.length > 0 && (
                    <button className="btn btn-warn btn-sm" onClick={() => setConfirmBulkCancel(true)}>
                      🚫 {t.bulkCancelBtn} {bulkSel.length}
                    </button>
                  )}
                  <button className="btn btn-primary" onClick={() => { setPrefill(null); setShowReg(true); }}>{t.addNew}</button>
                </div>
              )}

              {suggestions.length > 0 && (
                <div style={{ background: "#fff", border: "1.5px solid var(--border)", borderRadius: 10, marginBottom: 10, overflow: "hidden" }}>
                  <div style={{ padding: "6px 14px", background: "#f8f9fb", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>{t.notRegistered}</div>
                  {suggestions.map((m) => (
                    <div key={m.id} onClick={() => { setPrefill(m); setShowReg(true); }} style={{ padding: "9px 14px", borderTop: "1px solid var(--border)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")} onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                      <div><span style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</span><span style={{ marginLeft: 8, fontSize: 12, color: "#6b7280" }}>{m.church}</span></div>
                      <div style={{ display: "flex", gap: 5 }}><span className="badge badge-blue">{m.category}</span><RoleBadges member={m} /></div>
                    </div>
                  ))}
                </div>
              )}

              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "11px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {tabs.map(({ k, l }) => (
                      <button key={k} className={`tab ${tab === k ? "active" : ""}`} onClick={() => { setTab(k); setBulkSel([]); }}>{l}</button>
                    ))}
                  </div>
                  {tab !== "approvals" && <span style={{ fontSize: 12, color: "#6b7280" }}>{viewRegs.length}</span>}
                </div>

                {tab === "approvals" ? (
                  <div>
                    {pendingApprovalList.length === 0 && (
                      <div style={{ textAlign: "center", color: "#6b7280", padding: 28 }}>Nenhuma solicitação pendente.</div>
                    )}
                    {pendingApprovalList.map((a) => (
                      <div key={a.id} style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6, background: "#fffbeb" }}>
                        <div>
                          <span style={{ fontWeight: 600 }}>{a.memberName}</span>
                          <span style={{ marginLeft: 8, fontSize: 12, color: "#6b7280" }}>{a.type === "capacity_override" ? "Excedente" : "Isenção"} · {a.category}</span>
                          <span style={{ marginLeft: 8, fontSize: 11, color: "#92400e" }}>por {a.requestedBy}</span>
                        </div>
                        <span className="badge badge-yellow">Aguardando Pastor</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead><tr>
                        <th style={{ width: 32 }}>
                          <input type="checkbox"
                            checked={viewRegs.length > 0 && viewRegs.every((r) => bulkSel.includes(r.id))}
                            onChange={(e) => setBulkSel(e.target.checked ? viewRegs.map((r) => r.id) : [])} />
                        </th>
                        <th>{t.regNum}</th><Th k="memberName">{t.memberName}</Th><Th k="role">{t.cargo}</Th><Th k="category">{t.cat}</Th><Th k="church">{t.churchH}</Th><Th k="team">{t.teamH}</Th><Th k="fee">{t.feeH}</Th><Th k="registeredAt">{t.regDate}</Th><Th k="statusSort">{t.statusH}</Th><th>Presença</th><th>{t.actions}</th></tr></thead>
                      <tbody>
                        {viewRegs.length === 0 && <tr><td colSpan={12} style={{ textAlign: "center", color: "#6b7280", padding: 28 }}>{t.noRecords}</td></tr>}
                        {viewRegs.map((r) => (
                          <tr key={r.id}>
                            <td><input type="checkbox" checked={bulkSel.includes(r.id)} onChange={() => toggleBulk(r.id)} /></td>
                            <td style={{ fontFamily: "monospace", fontSize: 11, color: "#1a3a6b", fontWeight: 600, whiteSpace: "nowrap" }}>{r.regNumber || "—"}</td>
                            <td><div style={{ fontWeight: 600 }}>{r.memberName || "—"}</div></td>
                            <td>{r.role ? <span className={`badge ${ROLE_BADGE[r.role] || "badge-gray"}`}>{r.role}</span> : <span style={{ color: "#9ca3af", fontSize: 12 }}>—</span>}</td>
                            <td><span className="badge badge-blue">{r.category || "—"}</span></td>
                            <td style={{ fontSize: 12, color: "#6b7280" }}>{r.church || "—"}</td>
                            <td style={{ fontSize: 12 }}>{r.team || "—"}</td>
                            <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{r.exempt ? <span style={{ color: "#6b7280" }}>{t.exempt}</span> : fmt(r.fee ?? 0)}</td>
                            <td style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>{r.registeredAt || "—"}</td>
                            <td><StatusBadge r={r} event={event} allRegs={allForCity} /></td>
                            <td>
                              <select
                                value={r.presence || 'unknown'}
                                onChange={(e) => updatePresence && updatePresence(r.id, e.target.value, 'manual')}
                                style={{ fontSize: 11, padding: "2px 4px", borderRadius: 4, border: "1px solid var(--border)", background: r.presence === 'present' ? '#d1fae5' : r.presence === 'absent' ? '#fee2e2' : r.presence === 'walk_in' ? '#dbeafe' : '#f3f4f6', color: r.presence === 'present' ? '#065f46' : r.presence === 'absent' ? '#991b1b' : r.presence === 'walk_in' ? '#1e3a8a' : '#374151' }}
                              >
                                <option value="unknown">🔲 Desconhecida</option>
                                <option value="present">✅ Presente</option>
                                <option value="absent">❌ Ausente</option>
                                <option value="walk_in">🚶 Walk-in</option>
                              </select>
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: 4 }}>
                                {r.waitlisted && <button className="btn btn-ok btn-sm" onClick={() => promoteFromWaitlist(r.id)}>{t.confirm}</button>}
                                {!r.waitlisted && !r.paid && !r.exempt && !r.cancelled && <button className="btn btn-ok btn-sm" onClick={() => updateReg(r.id, { paid: true })}>{t.markPaid}</button>}
                                <button className="btn btn-ghost btn-sm" onClick={() => setDetail(r)}>{t.edit}</button>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  disabled={resendingId === r.id}
                                  onClick={() => handleResend(r)}
                                  title={t.resendConfirmation}
                                >
                                  {resendingId === r.id ? "…" : "📧"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : sec === "reports" ? (
            <ReportsTab regs={allForCity} event={event} wlRegs={myWlRegs} exRegs={myExRegs} lang={lang} />
          ) : sec === "members" ? (
            <>
              <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                <div className="sb" style={{ flex: 1 }}>
                  <span className="si-icon"><Search size={16} /></span>
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar membro..." />
                </div>
                <button className="btn btn-primary" onClick={openNewMember}>+ Novo Membro</button>
              </div>

              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "11px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 16 }}>Membros</h3>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>{memberList.length}</span>
                </div>
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>{t.memberName}</th><th>{t.cargo}</th><th>{t.cat}</th><th>Família</th><th>{t.actions}</th></tr></thead>
                    <tbody>
                      {memberList.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: "#6b7280", padding: 28 }}>{t.noRecords}</td></tr>}
                      {memberList.map((m) => (
                        <tr key={m.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{m.name}</div>
                            {m.badgeName && m.badgeName !== m.name && <div style={{ fontSize: 11, color: "#6b7280" }}>🏷 {m.badgeName}</div>}
                          </td>
                          <td><RoleBadges member={m} /></td>
                          <td><span className="badge badge-blue">{m.category}</span></td>
                          <td style={{ fontSize: 12 }}>{families.find((f) => f.id === m.familyId)?.name || <span style={{ color: "#9ca3af" }}>—</span>}</td>
                          <td>
                            <div style={{ display: "flex", gap: 4 }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => openEditMember(m)}>{t.edit}</button>
                              <button className="btn btn-danger btn-sm" onClick={() => requestDeleteMember(m)}>🗑</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : sec === "families" ? (
            <FamiliesPanel members={myMembers} families={myFamilies} setFamilies={setFamilies} notify={notify} />
          ) : (
            <GroupsPanel members={myMembers} setMembers={setMembers} gas={myGas} setGas={setGas} churches={churches} notify={notify} defaultChurch={myChurch} lockChurch />
          )}
        </div>
        </div>
      </div>
      {showReg && <RegModal event={event} members={myMembers} setMembers={setMembers} families={families} dbTeams={dbTeams} isFull={isFull} existingRegs={allActive} prefill={prefill} onClose={() => { setShowReg(false); setPrefill(null); }} onSave={(d) => { addReg(d); setShowReg(false); setPrefill(null); }} onRequestOverride={(d) => submitApproval({ ...d, requestedBy: user?.name, requestedById: user?.id })} />}
      {detail && (
        <DetailModal
          reg={detail}
          event={event}
          dbTeams={dbTeams}
          regs={regs}
          members={members}
          gas={gas}
          canEditPayment={true}
          canDirectGrant={false}
          allEventRegs={allForCity}
          onRequestReactivation={() => submitApproval({
            eventId: event.id, memberId: detail.memberId, memberName: detail.memberName, regId: detail.id,
            type: "reactivation", category: detail.category, church: detail.church, badgeName: detail.badgeName,
            team: detail.team, role: detail.role, fee: detail.fee, requestedBy: user?.name, requestedById: user?.id,
          })}
          onRequestExtension={() => submitApproval({
            eventId: event.id, memberId: detail.memberId, memberName: detail.memberName, regId: detail.id,
            type: "deadline_extension", category: detail.category, church: detail.church, badgeName: detail.badgeName,
            team: detail.team, role: detail.role, fee: detail.fee, requestedBy: user?.name, requestedById: user?.id,
          })}
          onClose={() => setDetail(null)}
          lang={lang}
          onUpdate={(u) => {
            // Secretaria can only request reactivation (via the button above), not
            // grant it directly by unchecking this box — strip that specific change
            // rather than silently reactivating.
            if (detail.cancelled && u.cancelled === false) {
              const rest = { ...u };
              delete rest.cancelled;
              notify("Use \"Solicitar Reativação\" para reativar esta inscrição.");
              if (Object.keys(rest).length) updateReg(detail.id, rest);
            } else {
              updateReg(detail.id, u);
            }
            setDetail(null);
          }}
        />
      )}

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
        gas={myGas}
        churches={churches}
        defaultChurch={myChurch}
        notify={notify}
        setRegs={setRegs}
      />

      {confirmBulkCancel && (
        <Modal onClose={() => setConfirmBulkCancel(false)} maxWidth={360}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🚫</div>
            <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, marginBottom: 8 }}>{t.bulkCancelConfirmTitle}</h3>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>
              {t.bulkCancelBtn} <strong>{bulkSel.length}</strong> {t.bulkCancelConfirmBody}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmBulkCancel(false)}>{t.keep}</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => {
                bulkSel.forEach((id) => {
                  updateReg(id, { cancelled: true, cancelReason: "nonpayment_manual" }, { status: "Cancelado", note: "Cancelado em lote — pagamento em atraso" }, { silent: true });
                });
                notify(`${bulkSel.length} ${t.bulkCancelDone}`);
                setBulkSel([]);
                setConfirmBulkCancel(false);
              }}>{t.bulkCancelBtn}</button>
            </div>
          </div>
        </Modal>
      )}

      {confirmDeleteMember && (
        <Modal onClose={() => !deletingMember && setConfirmDeleteMember(null)} maxWidth={360}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, marginBottom: 8 }}>Confirmar exclusão</h3>
            {confirmDeleteMember.regCount > 0 ? (
              <p style={{ color: "#c0392b", fontSize: 14, marginBottom: 20 }}>
                <strong>{confirmDeleteMember.name}</strong> tem <strong>{confirmDeleteMember.regCount}</strong> inscrição(ões) e não pode ser removido(a).
              </p>
            ) : (
              <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>
                Remover <strong>{confirmDeleteMember.name}</strong>? Esta ação não pode ser desfeita.
              </p>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmDeleteMember(null)} disabled={deletingMember}>
                {confirmDeleteMember.regCount > 0 ? "Fechar" : "Cancelar"}
              </button>
              {confirmDeleteMember.regCount === 0 && (
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={confirmDeleteMemberNow} disabled={deletingMember}>
                  {deletingMember ? "Removendo..." : "Excluir"}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ClerkView;
