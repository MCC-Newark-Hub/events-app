import { useT } from "@/i18n/strings";
import { ROLE_BADGE } from "@/constants";
import Topbar from "@/components/Topbar";

function GALeaderView(props) {
  const { event, regs, members, gas, user, logout, lang, setLang, theme, toggleTheme } = props;
  const t = useT();
  const myGAs = gas.filter((g) => user?.gaIds?.includes(g.id));
  const eventRegs = regs.filter((r) => r.eventId === event?.id && !r.cancelled && !r.waitlisted);
  const getStatus = (mid) => {
    const r = eventRegs.find((x) => x.memberId === mid);
    if (!r) return "not_registered";
    return r.paid || r.exempt ? "confirmed" : "pending";
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
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 22 }}>
              {t.hello}, {user?.name}!
            </h2>
            <p style={{ color: "#6b7280", fontSize: 13 }}>{t.readOnlyNote}</p>
          </div>

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
                  <div style={{ display: "flex", gap: 6 }}>
                    <span className="badge badge-green">{conf.length}✓</span>
                    <span className="badge badge-yellow">{pendG.length}⏳</span>
                    <span className="badge badge-gray">{notR.length}○</span>
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
                        </tr>
                      </thead>
                      <tbody>
                        {gam.map((m) => {
                          const s = getStatus(m.id);
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
    </div>
  );
}

// ── TEAM LEADER VIEW ──────────────────────────────────────────────────────────
export default GALeaderView;
