import { useState } from "react";
import { Search } from "lucide-react";
import { useT } from "@/i18n/strings";
import { ROLE_BADGE, fmt } from "@/constants";
import Topbar from "@/components/Topbar";
import CapBar from "@/components/CapBar";
import StatusBadge from "@/components/StatusBadge";
import RegModal from "@/components/RegModal";
import DetailModal from "@/components/DetailModal";

function ClerkView(props) {
  const { event, regs, members, families, addReg, updateReg, promoteFromWaitlist, submitApproval, approvals, user, logout, activeCount, isFull, wlRegs, exRegs, lang, setLang, pendingApprovals, theme, toggleTheme, notify } = props;
  const t = useT();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("active");
  const [showReg, setShowReg] = useState(false);
  const [detail, setDetail] = useState(null);
  const [prefill, setPrefill] = useState(null);

  const myPending = approvals.filter((a) => a.eventId === event?.id && a.requestedById === user?.id && a.status === "pending");
  const allActive = regs.filter((r) => r.eventId === event?.id && !r.cancelled && !r.waitlisted);
  const viewRegs = (tab === "active" ? allActive : tab === "waitlist" ? wlRegs : regs.filter((r) => r.eventId === event?.id && r.cancelled)).filter((r) => r.memberName.toLowerCase().includes(search.toLowerCase()) || r.regNumber.toLowerCase().includes(search.toLowerCase()) || r.church.toLowerCase().includes(search.toLowerCase()));
  const suggestions = search.length > 1 ? members.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()) && !allActive.find((r) => r.memberId === m.id)).slice(0, 5) : [];

  return (
    <div className="app-shell">
      <Topbar title={t.clerkTitle} sub={event?.name} user={user} logout={logout} pendingCount={myPending.length} lang={lang} setLang={setLang} theme={theme} toggleTheme={toggleTheme} />
      <div className="main-scroll">
        <div className="page-pad">
          {myPending.length > 0 && (
            <div style={{ background: "#fffbeb", border: "1.5px solid #f59e0b", borderRadius: 10, padding: "12px 16px", marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{t.myRequests}</div>
              {myPending.map((a) => (
                <div key={a.id} style={{ fontSize: 13, display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #fde68a", flexWrap: "wrap", gap: 4 }}>
                  <span><strong>{a.memberName}</strong> ({a.category})</span>
                  <span style={{ color: "#92400e", fontWeight: 600 }}>{t.awaitingPastor}</span>
                </div>
              ))}
            </div>
          )}

          <CapBar event={event} activeCount={activeCount} wlCount={wlRegs.length} exCount={exRegs.length} />

          <div className="stat-grid-4" style={{ marginBottom: 18 }}>
            {[
              { label: t.registered, value: allActive.length, color: "#1a3a6b" },
              { label: t.paid, value: allActive.filter((r) => r.paid || r.exempt).length, color: "#2d8a4e" },
              { label: t.pending, value: allActive.filter((r) => !r.paid && !r.exempt).length, color: "#d4820a" },
              { label: t.waitlist, value: wlRegs.length, color: "#92400e" },
            ].map((s) => (
              <div className="stat-card" key={s.label} style={{ textAlign: "center", borderTop: `3px solid ${s.color}` }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <div className="sb" style={{ flex: 1 }}>
              <span className="si-icon"><Search size={16} /></span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${t.searchMember}...`} />
            </div>
            <button className="btn btn-primary" onClick={() => { setPrefill(null); setShowReg(true); }}>{t.addNew}</button>
          </div>

          {suggestions.length > 0 && (
            <div style={{ background: "#fff", border: "1.5px solid var(--border)", borderRadius: 10, marginBottom: 10, overflow: "hidden" }}>
              <div style={{ padding: "6px 14px", background: "#f8f9fb", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>{t.notRegistered}</div>
              {suggestions.map((m) => (
                <div key={m.id} onClick={() => { setPrefill(m); setShowReg(true); }} style={{ padding: "9px 14px", borderTop: "1px solid var(--border)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")} onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                  <div><span style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</span><span style={{ marginLeft: 8, fontSize: 12, color: "#6b7280" }}>{m.church}</span></div>
                  <div style={{ display: "flex", gap: 5 }}><span className="badge badge-blue">{m.category}</span>{m.role && <span className={`badge ${ROLE_BADGE[m.role]}`}>{m.role}</span>}</div>
                </div>
              ))}
            </div>
          )}

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "11px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {[{ k: "active", l: `${t.activeTab} (${allActive.length})` }, { k: "waitlist", l: `${t.waitlistTab} (${wlRegs.length})` }, { k: "cancelled", l: t.cancelledTab }].map(({ k, l }) => (
                  <button key={k} className={`tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{l}</button>
                ))}
              </div>
              <span style={{ fontSize: 12, color: "#6b7280" }}>{viewRegs.length}</span>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>{t.regNum}</th><th>{t.memberName}</th><th>{t.cargo}</th><th>{t.cat}</th><th>{t.teamH}</th><th>{t.feeH}</th><th>{t.statusH}</th><th>{t.actions}</th></tr></thead>
                <tbody>
                  {viewRegs.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center", color: "#6b7280", padding: 28 }}>{t.noRecords}</td></tr>}
                  {viewRegs.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontFamily: "monospace", fontSize: 11, color: "#1a3a6b", fontWeight: 600, whiteSpace: "nowrap" }}>{r.regNumber}</td>
                      <td><div style={{ fontWeight: 600 }}>{r.memberName}</div></td>
                      <td>{r.role ? <span className={`badge ${ROLE_BADGE[r.role]}`}>{r.role}</span> : <span style={{ color: "#9ca3af", fontSize: 12 }}>—</span>}</td>
                      <td><span className="badge badge-blue">{r.category}</span></td>
                      <td style={{ fontSize: 12 }}>{r.team}</td>
                      <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{r.exempt ? <span style={{ color: "#6b7280" }}>{t.exempt}</span> : fmt(r.fee)}</td>
                      <td><StatusBadge r={r} event={event} allRegs={allActive} /></td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          {r.waitlisted && <button className="btn btn-ok btn-sm" onClick={() => promoteFromWaitlist(r.id)}>{t.confirm}</button>}
                          {!r.waitlisted && !r.paid && !r.exempt && !r.cancelled && <button className="btn btn-ok btn-sm" onClick={() => updateReg(r.id, { paid: true })}>{t.markPaid}</button>}
                          <button className="btn btn-ghost btn-sm" onClick={() => setDetail(r)}>{t.edit}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {showReg && <RegModal event={event} members={members} families={families} isFull={isFull} existingRegs={allActive} prefill={prefill} onClose={() => { setShowReg(false); setPrefill(null); }} onSave={(d) => { addReg(d); setShowReg(false); setPrefill(null); }} onRequestOverride={(d) => submitApproval({ ...d, requestedBy: user?.name, requestedById: user?.id })} />}
      {detail && <DetailModal reg={detail} event={event} canEditPayment={true} onClose={() => setDetail(null)} lang={lang} onUpdate={(u) => { updateReg(detail.id, u); setDetail(null); }} />}
    </div>
  );
}

export default ClerkView;
