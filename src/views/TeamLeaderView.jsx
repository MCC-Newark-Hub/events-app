import { useState } from "react";
import { useT } from "@/i18n/strings";
import { STATUS_CFG } from "@/constants";
import Topbar from "@/components/Topbar";

function TeamLeaderView(props) {
  const {
    event,
    regs,
    members,
    rosters,
    setRosters,
    user,
    logout,
    notify,
    lang,
    setLang,
    theme,
    toggleTheme,
  } = props;
  const t = useT();
  const myTeams = user?.teamLeads || [];
  const eventRegs = regs.filter((r) => r.eventId === event?.id && !r.cancelled && !r.waitlisted);
  const getStatus = (mid) => {
    const r = eventRegs.find((x) => x.memberId === mid);
    if (!r) return "not_registered";
    return r.paid || r.exempt ? "confirmed" : "pending";
  };
  const [editTeam, setEditTeam] = useState(null);
  const [msearch, setMsearch] = useState("");
  const addToRoster = (team, mid) => {
    setRosters((prev) => {
      const ex = prev.find((r) => r.eventId === event?.id && r.team === team);
      if (ex) {
        if (ex.memberIds.includes(mid)) return prev;
        return prev.map((r) =>
          r.eventId === event?.id && r.team === team
            ? { ...r, memberIds: [...r.memberIds, mid] }
            : r
        );
      }
      return [...prev, { eventId: event?.id, team, memberIds: [mid] }];
    });
    notify("✓ Added!");
  };
  const removeFromRoster = (team, mid) => {
    setRosters((prev) =>
      prev.map((r) =>
        r.eventId === event?.id && r.team === team
          ? { ...r, memberIds: r.memberIds.filter((x) => x !== mid) }
          : r
      )
    );
    notify("Removed.");
  };
  const searchR =
    msearch.length > 1
      ? members.filter((m) => m.name.toLowerCase().includes(msearch.toLowerCase())).slice(0, 6)
      : [];
  return (
    <div className="app-shell">
      <Topbar
        title={t.teamTitle}
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
            <p style={{ color: "#6b7280", fontSize: 13 }}>{t.teamReadOnly}</p>
          </div>
          {myTeams.map((team) => {
            const roster = rosters.find((r) => r.eventId === event?.id && r.team === team);
            const mids = roster?.memberIds || [];
            const teamMembers = mids
              .map((mid) => members.find((m) => m.id === mid))
              .filter(Boolean);
            const counts = { confirmed: 0, pending: 0, not_registered: 0 };
            teamMembers.forEach((m) => counts[getStatus(m.id)]++);
            const notReg = teamMembers.filter((m) => getStatus(m.id) === "not_registered");
            const isEditing = editTeam === team;
            return (
              <div key={team} style={{ marginBottom: 24 }}>
                <div className="stat-grid-3" style={{ marginBottom: 12 }}>
                  {[
                    { label: t.members, value: teamMembers.length, color: "#1a3a6b" },
                    { label: t.confirmed, value: counts.confirmed, color: "#2d8a4e" },
                    { label: t.notRegistered, value: counts.not_registered, color: "#d4820a" },
                  ].map((s) => (
                    <div
                      className="stat-card"
                      key={s.label}
                      style={{ textAlign: "center", borderTop: `3px solid ${s.color}` }}
                    >
                      <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                  <div
                    style={{
                      padding: "11px 16px",
                      background: "#f8f9fb",
                      borderBottom: "1px solid var(--border)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    <h3 style={{ fontWeight: 700, fontSize: 15 }}>{team}</h3>
                    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                      {counts.confirmed > 0 && (
                        <span className="badge badge-green">{counts.confirmed}✓</span>
                      )}
                      {counts.pending > 0 && (
                        <span className="badge badge-yellow">{counts.pending}⏳</span>
                      )}
                      {counts.not_registered > 0 && (
                        <span className="badge badge-gray">{counts.not_registered}○</span>
                      )}
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setEditTeam(isEditing ? null : team);
                          setMsearch("");
                        }}
                      >
                        {isEditing ? t.close : t.add}
                      </button>
                    </div>
                  </div>
                  {isEditing && (
                    <div
                      style={{
                        padding: "10px 14px",
                        background: "#fffbeb",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <input
                        value={msearch}
                        onChange={(e) => setMsearch(e.target.value)}
                        placeholder={`${t.searchMember}...`}
                        autoFocus
                        style={{ marginBottom: 6 }}
                      />
                      {searchR.map((m) => {
                        const already = mids.includes(m.id);
                        return (
                          <div
                            key={m.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "5px 0",
                              borderTop: "1px solid var(--border)",
                            }}
                          >
                            <span style={{ fontSize: 13 }}>
                              {m.name}{" "}
                              <span style={{ color: "#6b7280", fontSize: 11 }}>({m.category})</span>
                            </span>
                            {already ? (
                              <span className="badge badge-gray">{t.teams}</span>
                            ) : (
                              <button
                                className="btn btn-ok btn-xs"
                                onClick={() => {
                                  addToRoster(team, m.id);
                                  setMsearch("");
                                }}
                              >
                                +
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {teamMembers.length === 0 ? (
                    <p style={{ padding: 24, color: "#6b7280", textAlign: "center" }}>
                      {t.noMembers}
                    </p>
                  ) : (
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>{t.memberName}</th>
                            <th>{t.cat}</th>
                            <th>{t.churchH}</th>
                            <th>{t.regH}</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {teamMembers.map((m) => {
                            const s = getStatus(m.id);
                            const cfg = STATUS_CFG[s];
                            return (
                              <tr key={m.id}>
                                <td style={{ fontWeight: 600 }}>
                                  <span className={`dot ${cfg.dot}`}></span>
                                  {m.name}
                                </td>
                                <td>
                                  <span className="badge badge-blue">{m.category}</span>
                                </td>
                                <td style={{ fontSize: 12, color: "#6b7280" }}>{m.church}</td>
                                <td>
                                  <span className={`badge ${cfg.badge}`} style={{ fontSize: 10 }}>
                                    {
                                      t[
                                        s === "not_registered"
                                          ? "notRegistered"
                                          : s === "pending"
                                            ? "pendPayment"
                                            : "confirmed"
                                      ]
                                    }
                                  </span>
                                </td>
                                <td>
                                  <button
                                    onClick={() => removeFromRoster(team, m.id)}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      color: "#9ca3af",
                                      fontSize: 18,
                                      lineHeight: 1,
                                    }}
                                  >
                                    ×
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                {notReg.length > 0 && (
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
                      {notReg.length} {t.notRegisteredWarn}:
                    </strong>{" "}
                    {notReg.map((m) => m.name).join(", ")} — {t.reachOut}
                  </div>
                )}
              </div>
            );
          })}
          <div
            style={{
              padding: "10px 14px",
              background: "#fff",
              borderRadius: 10,
              border: "1px solid var(--border)",
              fontSize: 12,
              color: "#6b7280",
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <span>
              <span className="dot dot-green"></span>
              {t.confirmed}
            </span>
            <span>
              <span className="dot dot-yellow"></span>
              {t.pendPayment}
            </span>
            <span>
              <span className="dot dot-gray"></span>
              {t.notRegistered}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
export default TeamLeaderView;
