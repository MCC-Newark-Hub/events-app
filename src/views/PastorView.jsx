import { useState } from "react";
import { LayoutDashboard, Clock } from "lucide-react";
import { useT } from "@/i18n/strings";
import { CATEGORIES, fmt } from "@/constants";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import CapBar from "@/components/CapBar";
import ApprovalsPanel from "@/components/ApprovalsPanel";

function PastorView(props) {
  const { event, regs, approvals, resolveApproval, user, logout, activeCount, wlRegs, exRegs, pendingApprovals, lang, setLang, theme, toggleTheme } = props;
  const t = useT();
  const [sec, setSec] = useState("dashboard");
  const er = regs.filter((r) => r.eventId === event?.id && !r.cancelled && !r.waitlisted);
  const paid = er.filter((r) => r.paid && !r.exempt);
  const pend = er.filter((r) => !r.paid && !r.exempt);
  const coll = paid.reduce((s, r) => s + r.fee, 0);
  const pendA = pend.reduce((s, r) => s + r.fee, 0);
  const pct = Math.round((coll / (coll + pendA)) * 100 || 0);
  const byCat = CATEGORIES.map((c) => ({ c, n: er.filter((r) => r.category === c).length })).filter((x) => x.n > 0);
  const byCh = [...new Set(er.map((r) => r.church))].map((ch) => ({ ch, total: er.filter((r) => r.church === ch).length, paid: er.filter((r) => r.church === ch && r.paid).length })).sort((a, b) => b.total - a.total);
  const navItems = [
    { id: "dashboard", icon: <LayoutDashboard size={16} />, label: t.dashboard },
    { id: "approvals", icon: <Clock size={16} />, label: `${t.approvals}${pendingApprovals.length > 0 ? ` (${pendingApprovals.length})` : ""}` },
  ];
  return (
    <div className="app-shell">
      <Topbar title={t.pastorTitle} sub={event?.name} user={user} logout={logout} pendingCount={pendingApprovals.length} lang={lang} setLang={setLang} theme={theme} toggleTheme={toggleTheme} />
      <div className="body-with-sidebar">
        <Sidebar navItems={navItems} activeId={sec} onSelect={setSec} />
        <div className="main-scroll">
          <div className="page-pad">
            {sec === "dashboard" && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 24 }}>{event?.name}</h2>
                  <p style={{ color: "#6b7280", fontSize: 13 }}>{event?.date} · {event?.location}</p>
                </div>
                <CapBar event={event} activeCount={activeCount} wlCount={wlRegs.length} exCount={exRegs.length} />
                <div className="stat-grid-3" style={{ marginBottom: 18 }}>
                  {[
                    { label: t.registered, value: er.length, color: "#1a3a6b", detail: `${t.cia}:${er.filter((r)=>["0-3","Criança","Intermediário"].includes(r.category)).length} · ${t.ya}:${er.filter((r)=>["Adolescente","Jovem","Adulto"].includes(r.category)).length}` },
                    { label: t.collected, value: fmt(coll), color: "#2d8a4e", detail: `${paid.length} ${t.payers}` },
                    { label: t.pendingAmt, value: fmt(pendA), color: "#d4820a", detail: `${pend.length} ${t.people}` },
                  ].map((s) => (
                    <div className="stat-card" key={s.label} style={{ borderTop: `4px solid ${s.color}`, textAlign: "center", padding: "20px 14px" }}>
                      <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{s.detail}</div>
                    </div>
                  ))}
                </div>
                <div className="two-col" style={{ marginBottom: 14 }}>
                  <div className="card">
                    <h4 style={{ fontWeight: 700, marginBottom: 10 }}>{t.category}</h4>
                    {byCat.map((x) => <div key={x.c} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)" }}><span style={{ fontSize: 14 }}>{x.c}</span><span className="badge badge-blue">{x.n}</span></div>)}
                  </div>
                  <div className="card">
                    <h4 style={{ fontWeight: 700, marginBottom: 10 }}>{t.church}</h4>
                    {byCh.map((x) => <div key={x.ch} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)" }}><span style={{ fontSize: 13 }}>{x.ch}</span><div style={{ display: "flex", gap: 5 }}><span className="badge badge-green">{x.paid}✓</span><span className="badge badge-blue">{x.total}</span></div></div>)}
                  </div>
                </div>
                <div className="card">
                  <h4 style={{ fontWeight: 700, marginBottom: 12 }}>{t.collected}</h4>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                    {[{label:t.expected,value:fmt(coll+pendA),color:"#1a3a6b"},{label:t.received,value:fmt(coll),color:"#2d8a4e"},{label:t.pendingAmt,value:fmt(pendA),color:"#d4820a"},{label:t.exempted,value:`${er.filter(r=>r.exempt).length}`,color:"#6b7280"}].map((x) => (
                      <div key={x.label} style={{ flex: 1, minWidth: 90, textAlign: "center", padding: 12, background: "#f8f9fb", borderRadius: 10 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: x.color }}>{x.value}</div>
                        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{x.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "#e5e7eb", borderRadius: 99, height: 10, overflow: "hidden" }}>
                    <div style={{ background: "#2d8a4e", height: "100%", width: `${pct}%`, borderRadius: 99 }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4, textAlign: "right" }}>{pct}% {t.received}</div>
                </div>
              </div>
            )}
            {sec === "approvals" && <ApprovalsPanel approvals={approvals} resolveApproval={resolveApproval} event={event} activeCount={activeCount} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PastorView;
