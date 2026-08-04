import { useState, Fragment } from "react";
import { useT } from "@/i18n/strings";
import { fmt, ROLE_BADGE, CATEGORIES, deadlineStatus } from "@/constants";

const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const byName = (a, b) => norm(a.memberName).localeCompare(norm(b.memberName));

export default function ReportsTab({ regs, event, wlRegs, exRegs, lang }) {
  const t = useT();
  const [type, setType] = useState("summary");
  const [repSearch, setRepSearch] = useState("");
  const [repCategory, setRepCategory] = useState("");
  const [repChurch, setRepChurch] = useState("");
  const [repDate, setRepDate] = useState("");
  const [summaryDim, setSummaryDim] = useState("church"); // "church" | "category"
  const [expandedGroups, setExpandedGroups] = useState({});
  const toggleGroup = (key) => setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  const switchSummaryDim = (dim) => { setSummaryDim(dim); setExpandedGroups({}); };
  // Includes cancelled rows too, unlike er \u2014 deadlineStatus needs a member's full
  // history to anchor the payment countdown to their earliest attempt.
  const all = regs.filter((r) => r.eventId === event?.id);
  const er = regs.filter((r) => r.eventId === event?.id && !r.cancelled && !r.waitlisted);
  const wl = wlRegs;
  const pend = er.filter((r) => !r.paid && !r.exempt);
  // Deliberately not reusing StatusBadge's `urgent` flag (remaining <= 2) \u2014 this
  // report's own 3-day threshold is wider, so it's labeled by what it actually is.
  const expiring = er.filter((r) => {
    const s = deadlineStatus(r, event, all);
    return s && !s.overdue && s.remaining <= 3;
  });
  const cancelledNonpayment = all.filter((r) => r.cancelled && (r.cancelReason === "nonpayment_auto" || r.cancelReason === "nonpayment_manual"));

  const applyReportFilters = (rows) => rows.filter((r) => {
    const q = norm(repSearch);
    return (!q || norm(r.memberName).includes(q)) &&
      (!repCategory || r.category === repCategory) &&
      (!repChurch || r.church === repChurch) &&
      (!repDate || r.registeredAt === repDate);
  });
  const reportFilterPool = [...er, ...(wl || [])];
  const reportCategories = [...new Set(reportFilterPool.map((r) => r.category).filter(Boolean))].sort();
  const reportChurches = [...new Set(reportFilterPool.map((r) => r.church).filter(Boolean))].sort();
  const reportDates = [...new Set(reportFilterPool.map((r) => r.registeredAt).filter(Boolean))].sort();

  const pendView = applyReportFilters(pend).sort(byName);
  const wlView = applyReportFilters(wl.map((r, i) => ({ ...r, wlPosition: i + 1 }))).sort(byName);
  const erView = applyReportFilters(er).sort(byName);
  const expiringView = applyReportFilters(expiring).sort(byName);
  const cancelledNonpaymentView = applyReportFilters(cancelledNonpayment).sort(byName);

  const groupStats = (rows, field) => {
    const keys = field === "category"
      ? CATEGORIES.filter((c) => rows.some((r) => r.category === c))
      : [...new Set(rows.map((r) => r.church))];
    const groups = keys.map((key) => {
      const subset = rows.filter((r) => r[field] === key);
      return {
        key,
        rows: subset,
        total: subset.length,
        paid: subset.filter((r) => r.paid).length,
        pendN: subset.filter((r) => !r.paid && !r.exempt).length,
        exempt: subset.filter((r) => r.exempt).length,
        coll: subset.filter((r) => r.paid).reduce((s, r) => s + r.fee, 0),
        pendA: subset.filter((r) => !r.paid && !r.exempt).reduce((s, r) => s + r.fee, 0),
      };
    });
    if (field === "church") groups.sort((a, b) => b.total - a.total);
    return groups;
  };
  const otherDim = summaryDim === "church" ? "category" : "church";
  const summaryGroups = groupStats(er, summaryDim);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 22 }}>{t.reports}</h2>
        <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>
          {t.print}
        </button>
      </div>
      <div style={{ display: "flex", gap: 5, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          [t.summaryTab, "summary"],
          [t.pendPayTab, "pending"],
          [t.waitlistTab, "waitlist"],
          [t.expiringTab, "expiring"],
          [t.cancelledNonpaymentTab, "cancelled_nonpayment"],
          [t.rosterTab, "roster"],
          [t.badgesTab, "badges"],
          ["Check-in", "checkin"],
        ].map(([l, k]) => (
          <button
            key={k}
            className={`tab ${type === k ? "active" : ""}`}
            onClick={() => setType(k)}
          >
            {l}
          </button>
        ))}
      </div>

      {["pending", "waitlist", "expiring", "cancelled_nonpayment", "roster", "badges"].includes(type) && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          <input
            value={repSearch}
            onChange={(e) => setRepSearch(e.target.value)}
            placeholder="Buscar por nome..."
            style={{ flex: 1, minWidth: 160 }}
          />
          <select value={repCategory} onChange={(e) => setRepCategory(e.target.value)}>
            <option value="">Todas as categorias</option>
            {reportCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={repChurch} onChange={(e) => setRepChurch(e.target.value)}>
            <option value="">Todas as igrejas</option>
            {reportChurches.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={repDate} onChange={(e) => setRepDate(e.target.value)}>
            <option value="">Todas as datas</option>
            {reportDates.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      )}

      {type === "summary" && (
        <div>
          <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
            <button className={`btn btn-sm ${summaryDim === "church" ? "btn-primary" : "btn-ghost"}`} onClick={() => switchSummaryDim("church")}>
              Por {t.church}
            </button>
            <button className={`btn btn-sm ${summaryDim === "category" ? "btn-primary" : "btn-ghost"}`} onClick={() => switchSummaryDim("category")}>
              Por {t.category}
            </button>
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{summaryDim === "church" ? t.church : t.category}</th>
                    <th>{t.total}</th>
                    <th>{t.paid}</th>
                    <th>{t.pending}</th>
                    <th>{t.exempt}</th>
                    <th>{t.collected}</th>
                    <th>{t.toReceive}</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryGroups.map((g) => {
                    const isOpen = !!expandedGroups[g.key];
                    const subGroups = isOpen ? groupStats(g.rows, otherDim) : [];
                    return (
                      <Fragment key={g.key}>
                        <tr onClick={() => toggleGroup(g.key)} style={{ cursor: "pointer" }}>
                          <td style={{ fontWeight: 600 }}>
                            <span style={{ display: "inline-block", width: 14, color: "#9ca3af" }}>{isOpen ? "▾" : "▸"}</span>
                            {g.key}
                          </td>
                          <td>{g.total}</td>
                          <td style={{ color: "#2d8a4e", fontWeight: 600 }}>{g.paid}</td>
                          <td style={{ color: "#d4820a", fontWeight: 600 }}>{g.pendN}</td>
                          <td style={{ color: "#6b7280" }}>{g.exempt}</td>
                          <td style={{ color: "#2d8a4e", fontWeight: 600 }}>{fmt(g.coll)}</td>
                          <td style={{ color: "#d4820a", fontWeight: 600 }}>{fmt(g.pendA)}</td>
                        </tr>
                        {subGroups.map((sg) => (
                          <tr key={g.key + ":" + sg.key} style={{ background: "#f8f9fb" }}>
                            <td style={{ paddingLeft: 34, fontSize: 13, color: "#374151" }}>{sg.key}</td>
                            <td style={{ fontSize: 13 }}>{sg.total}</td>
                            <td style={{ color: "#2d8a4e", fontSize: 13 }}>{sg.paid}</td>
                            <td style={{ color: "#d4820a", fontSize: 13 }}>{sg.pendN}</td>
                            <td style={{ color: "#6b7280", fontSize: 13 }}>{sg.exempt}</td>
                            <td style={{ color: "#2d8a4e", fontSize: 13 }}>{fmt(sg.coll)}</td>
                            <td style={{ color: "#d4820a", fontSize: 13 }}>{fmt(sg.pendA)}</td>
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })}
                  <tr style={{ background: "#f8f9fb", fontWeight: 700 }}>
                    <td>{t.total}</td>
                    <td>{er.length}</td>
                    <td>{er.filter((r) => r.paid).length}</td>
                    <td>{pend.length}</td>
                    <td>{er.filter((r) => r.exempt).length}</td>
                    <td>{fmt(er.filter((r) => r.paid).reduce((s, r) => s + r.fee, 0))}</td>
                    <td>{fmt(pend.reduce((s, r) => s + r.fee, 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {type === "pending" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "11px 18px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontWeight: 700 }}>{t.pendPayTab}</span>
            <span className="badge badge-yellow">
              {pend.length} · {fmt(pend.reduce((s, r) => s + r.fee, 0))}
            </span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t.memberName}</th>
                  <th>{t.cat}</th>
                  <th>{t.churchH}</th>
                  <th>{t.feeH}</th>
                  <th>{t.date}</th>
                </tr>
              </thead>
              <tbody>
                {pendView.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: "#6b7280", padding: 20 }}>{t.noRecords}</td></tr>}
                {pendView.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.memberName}</td>
                    <td>
                      <span className="badge badge-blue">{r.category}</span>
                    </td>
                    <td style={{ fontSize: 12, color: "#6b7280" }}>{r.church}</td>
                    <td style={{ color: "#d4820a", fontWeight: 600 }}>{fmt(r.fee)}</td>
                    <td style={{ fontSize: 12, color: "#6b7280" }}>{r.registeredAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {type === "waitlist" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "11px 18px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontWeight: 700 }}>{t.waitlistTab}</span>
            <span className="wl">{wl.length}</span>
          </div>
          {wl.length === 0 ? (
            <p style={{ padding: 24, color: "#6b7280", textAlign: "center" }}>{t.emptyWaitlist}</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t.position}</th>
                    <th>{t.memberName}</th>
                    <th>{t.cat}</th>
                    <th>{t.churchH}</th>
                    <th>{t.feeH}</th>
                    <th>{t.date}</th>
                  </tr>
                </thead>
                <tbody>
                  {wlView.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", color: "#6b7280", padding: 20 }}>{t.noRecords}</td></tr>}
                  {wlView.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 700, color: "#92400e" }}>#{r.wlPosition}</td>
                      <td style={{ fontWeight: 600 }}>{r.memberName}</td>
                      <td>
                        <span className="badge badge-blue">{r.category}</span>
                      </td>
                      <td style={{ fontSize: 12, color: "#6b7280" }}>{r.church}</td>
                      <td style={{ fontWeight: 600 }}>{fmt(r.fee)}</td>
                      <td style={{ fontSize: 12, color: "#6b7280" }}>{r.registeredAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {type === "expiring" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "11px 18px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontWeight: 700 }}>{t.expiringTab}</span>
            <span className="badge badge-yellow">{expiringView.length}</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t.memberName}</th>
                  <th>{t.cat}</th>
                  <th>{t.churchH}</th>
                  <th>{t.feeH}</th>
                  <th>{lang === "en" ? "Deadline in" : "Prazo em"}</th>
                </tr>
              </thead>
              <tbody>
                {expiringView.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: "#6b7280", padding: 20 }}>{t.noRecords}</td></tr>}
                {expiringView.map((r) => {
                  const s = deadlineStatus(r, event, all);
                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.memberName}</td>
                      <td>
                        <span className="badge badge-blue">{r.category}</span>
                      </td>
                      <td style={{ fontSize: 12, color: "#6b7280" }}>{r.church}</td>
                      <td style={{ color: "#d4820a", fontWeight: 600 }}>{fmt(r.fee)}</td>
                      <td style={{ fontWeight: 600, color: s?.urgent ? "#c0392b" : "#d4820a" }}>{s?.label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {type === "cancelled_nonpayment" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "11px 18px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontWeight: 700 }}>{t.cancelledNonpaymentTab}</span>
            <span className="badge badge-gray">{cancelledNonpaymentView.length}</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t.memberName}</th>
                  <th>{t.cat}</th>
                  <th>{t.churchH}</th>
                  <th>{t.feeH}</th>
                  <th>{lang === "en" ? "Reason" : "Motivo"}</th>
                  <th>{t.date}</th>
                </tr>
              </thead>
              <tbody>
                {cancelledNonpaymentView.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", color: "#6b7280", padding: 20 }}>{t.noRecords}</td></tr>}
                {cancelledNonpaymentView.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.memberName}</td>
                    <td>
                      <span className="badge badge-blue">{r.category}</span>
                    </td>
                    <td style={{ fontSize: 12, color: "#6b7280" }}>{r.church}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(r.fee)}</td>
                    <td style={{ fontSize: 12, color: "#6b7280" }}>{r.cancelReason === "nonpayment_auto" ? (lang === "en" ? "Automatic" : "Automático") : (lang === "en" ? "Manual" : "Manual")}</td>
                    <td style={{ fontSize: 12, color: "#6b7280" }}>{r.registeredAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {type === "roster" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t.regNum}</th>
                  <th>{t.memberName}</th>
                  <th>{t.badgeH}</th>
                  <th>{t.cat}</th>
                  <th>M/F</th>
                  <th>{t.churchH}</th>
                  <th>{t.teamH}</th>
                  <th>{t.statusH}</th>
                  <th>🏷</th>
                  <th>{t.presH}</th>
                </tr>
              </thead>
              <tbody>
                {erView.length === 0 && <tr><td colSpan={10} style={{ textAlign: "center", color: "#6b7280", padding: 20 }}>{t.noRecords}</td></tr>}
                {erView.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontFamily: "monospace", fontSize: 11 }}>{r.regNumber}</td>
                    <td style={{ fontWeight: 600 }}>
                      {r.memberName}
                      {r.excedente && (
                        <span className="exc" style={{ marginLeft: 6 }}>
                          ⚡
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: "#6b7280" }}>
                      {r.badgeName || r.memberName}
                    </td>
                    <td>
                      <span className="badge badge-blue">{r.category}</span>
                    </td>
                    <td style={{ fontSize: 12, textAlign: "center" }}>{r.gender || "—"}</td>
                    <td style={{ fontSize: 12, color: "#6b7280" }}>{r.church}</td>
                    <td style={{ fontSize: 12 }}>{r.team}</td>
                    <td>{r.exempt ? t.exempt : r.paid ? `✓ ${t.paid}` : "⏳"}</td>
                    <td style={{ fontSize: 14, textAlign: "center" }}>
                      {r.badgePrinted ? "✓" : "○"}
                    </td>
                    <td style={{ fontSize: 18 }}>☐</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {type === "checkin" && (() => {
        const present = er.filter((r) => r.presence === 'present');
        const absent = er.filter((r) => r.presence === 'absent');
        const walkIn = er.filter((r) => r.presence === 'walk_in');
        const unknown = er.filter((r) => !r.presence || r.presence === 'unknown');
        const pct = er.length > 0 ? Math.round((present.length / er.length) * 100) : 0;

        const methodLabel = (m) => {
          if (m === 'qr_clerk') return 'QR Atendente';
          if (m === 'self') return 'Auto Check-in';
          if (m === 'manual') return 'Manual';
          return m || '—';
        };
        const methodColor = (m) => {
          if (m === 'qr_clerk') return '#1e40af';
          if (m === 'self') return '#2d8a4e';
          return '#6b7280';
        };

        const byMethod = ['qr_clerk', 'self', 'manual'].map((m) => ({
          m, label: methodLabel(m),
          count: present.filter((r) => r.checkinMethod === m).length,
        }));

        const checkedInSorted = [...present].sort((a, b) => {
          if (!a.checkedInAt) return 1;
          if (!b.checkedInAt) return -1;
          return b.checkedInAt.localeCompare(a.checkedInAt);
        });

        return (
          <div>
            {/* Summary stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Presentes', value: present.length, color: '#2d8a4e' },
                { label: 'Ausentes', value: absent.length, color: '#991b1b' },
                { label: 'Desconhecido', value: unknown.length, color: '#6b7280' },
                { label: 'Walk-in', value: walkIn.length, color: '#1e40af' },
                { label: '% Presença', value: pct + '%', color: '#8B0000' },
              ].map((s) => (
                <div className="stat-card" key={s.label} style={{ textAlign: 'center', borderTop: `3px solid ${s.color}` }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Method breakdown */}
            <div className="card" style={{ padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Por método</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {byMethod.map((b) => (
                  <div key={b.m} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ background: methodColor(b.m), color: '#fff', borderRadius: 99, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{b.label}</span>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{b.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13 }}>
                Histórico de check-in ({present.length})
              </div>
              {checkedInSorted.length === 0 ? (
                <p style={{ padding: 20, color: '#6b7280', textAlign: 'center', fontSize: 13 }}>Nenhum check-in registrado.</p>
              ) : (
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {checkedInSorted.map((r) => (
                    <div key={r.id} style={{ padding: '9px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{r.memberName}</span>
                        <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>{r.church}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {r.checkinMethod && (
                          <span style={{ background: methodColor(r.checkinMethod), color: '#fff', borderRadius: 99, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>{methodLabel(r.checkinMethod)}</span>
                        )}
                        <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>
                          {r.checkedInAt ? new Date(r.checkedInAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Not checked in */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13 }}>
                Não confirmados ({unknown.length})
              </div>
              {unknown.length === 0 ? (
                <p style={{ padding: 20, color: '#2d8a4e', textAlign: 'center', fontSize: 13 }}>Todos confirmados!</p>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>{t.regNum}</th><th>{t.memberName}</th><th>{t.cat}</th><th>{t.churchH}</th></tr></thead>
                    <tbody>
                      {unknown.map((r) => (
                        <tr key={r.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{r.regNumber}</td>
                          <td style={{ fontWeight: 600 }}>{r.memberName}</td>
                          <td><span className="badge badge-blue">{r.category}</span></td>
                          <td style={{ fontSize: 12, color: '#6b7280' }}>{r.church}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {type === "badges" && (
        <div>
          <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 12 }}>{t.badgePreview}</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
              gap: 10,
            }}
          >
            {erView.slice(0, 15).map((r) => (
              <div
                key={r.id}
                style={{
                  border: `2px solid ${r.excedente ? "#ff6b35" : "#1a3a6b"}`,
                  borderRadius: 10,
                  padding: "12px 14px",
                  textAlign: "center",
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    fontSize: 8,
                    color: "#6b7280",
                    marginBottom: 3,
                    letterSpacing: ".05em",
                    fontWeight: 700,
                  }}
                >
                  IGREJA CRISTÃ MARANATA
                </div>
                {r.excedente && (
                  <div style={{ fontSize: 9, color: "#c4390a", fontWeight: 700, marginBottom: 2 }}>
                    ⚡ EXCEDENTE
                  </div>
                )}
                <div
                  style={{
                    fontFamily: "'Lora',Georgia,serif",
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#8B0000",
                    marginBottom: 2,
                  }}
                >
                  {r.badgeName || r.memberName}
                </div>
                {r.badgeName && r.badgeName !== r.memberName && (
                  <div style={{ fontSize: 9, color: "#9ca3af", marginBottom: 4 }}>
                    {r.memberName}
                  </div>
                )}
                <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 5 }}>{r.church}</div>
                <div
                  style={{ display: "flex", justifyContent: "center", gap: 3, flexWrap: "wrap" }}
                >
                  <span className="badge badge-blue" style={{ fontSize: 9 }}>
                    {r.category}
                  </span>
                  {r.role && (
                    <span className={`badge ${ROLE_BADGE[r.role]}`} style={{ fontSize: 9 }}>
                      {r.role}
                    </span>
                  )}
                  <span className="badge badge-gray" style={{ fontSize: 9 }}>
                    {r.team}
                  </span>
                </div>
                <div
                  style={{ fontFamily: "monospace", fontSize: 8, color: "#9ca3af", marginTop: 5 }}
                >
                  {r.regNumber}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
