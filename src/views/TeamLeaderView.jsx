import { useState } from "react";
import { useT } from "@/i18n/strings";

const norm = (s) => (s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
import { STATUS_CFG, SERVICE_TEAMS, deadlineStatus } from "@/constants";
import { sb } from "@/lib/supabase";
import { canAssignToTeam } from "@/lib/teamAssignment";
import { eventSubtitle } from "@/lib/registrationDeadline";
import Topbar from "@/components/Topbar";
import Modal from "@/components/Modal";
import KitchenTab from "./admin/KitchenTab";
import KitchenPlanningTab from "./admin/KitchenPlanningTab";

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
    submitApproval,
  } = props;
  const t = useT();
  const myTeams = user?.teamLeads || [];
  const joinNames = (names) =>
    names.length === 0 ? "" :
    names.length === 1 ? names[0] :
    names.slice(0, -1).join(", ") + " e " + names[names.length - 1];
  const greetingName = joinNames(myTeams) || user?.name;
  // Includes cancelled rows too, unlike eventRegs — deadlineStatus needs a member's
  // full history, and reactivation needs to find the cancelled row itself.
  const allEventRegs = regs.filter((r) => r.eventId === event?.id);
  const eventRegs = regs.filter((r) => r.eventId === event?.id && !r.cancelled && !r.waitlisted);
  const getStatus = (mid) => {
    const r = eventRegs.find((x) => x.memberId === mid);
    if (!r) return "not_registered";
    return r.paid || r.exempt ? "confirmed" : "pending";
  };
  const getReg = (mid) => eventRegs.find((x) => x.memberId === mid);
  const getCancelledReg = (mid) => allEventRegs.find((x) => x.memberId === mid && x.cancelled);
  // Flat pool of everyone on any of this leader's teams, for the scoped reports view.
  const isCozinhaLeader = myTeams.includes("Cozinha");
  const isCIALeader = myTeams.includes("Professoras");
  const [kitchenView, setKitchenView] = useState("equipe");
  const [ciaTab, setCiaTab] = useState("cia");
  const [ciaExpanded, setCiaExpanded] = useState({ "0-3": true, "Criança": true, "Intermediário": true, "Adolescente": true });
  const [editTeam, setEditTeam] = useState(null);
  const [msearch, setMsearch] = useState("");
  const [requestTarget, setRequestTarget] = useState(null); // { reg, type: "reactivation" | "deadline_extension" }
  const [requestNote, setRequestNote] = useState("");
  const submitRequest = () => {
    if (!requestTarget) return;
    const { reg, type } = requestTarget;
    submitApproval({
      eventId: event.id, memberId: reg.memberId, memberName: reg.memberName, regId: reg.id,
      type, category: reg.category, church: reg.church, badgeName: reg.badgeName,
      team: reg.team, role: reg.role, fee: reg.fee, note: requestNote,
      requestedBy: user?.name, requestedById: user?.id,
    });
    setRequestTarget(null);
    setRequestNote("");
  };
  // Read roster data synchronously from current closure state BEFORE calling setRosters —
  // the updater callback runs at React's flush time, not at call time, so any values
  // captured inside the updater are not available for the immediate DB write below.
  const addToRoster = (team, mid, silent) => {
    const ex = rosters.find((r) => r.eventId === event?.id && r.team === team);
    if (ex) {
      if (ex.memberIds.includes(mid)) return;
      const newIds = [...ex.memberIds, mid];
      setRosters((prev) => prev.map((r) =>
        r.eventId === event?.id && r.team === team ? { ...r, memberIds: newIds } : r
      ));
      sb.from("rosters").update({ member_ids: newIds }).eq("id", ex.id)
        .then((res) => { if (res.error) console.error("addToRoster update error:", res.error); });
    } else {
      const newRoster = { eventId: event?.id, team, memberIds: [mid], leaderId: null };
      setRosters((prev) => [...prev, newRoster]);
      sb.from("rosters").insert({
        event_id: newRoster.eventId, team: newRoster.team,
        member_ids: newRoster.memberIds, leader_id: null,
      }).select().single().then(({ data }) => {
        if (data) {
          setRosters((prev) => prev.map((r) =>
            r.eventId === newRoster.eventId && r.team === newRoster.team && !r.id
              ? { ...r, id: data.id } : r
          ));
        }
      });
    }
    if (!silent) notify("✓ Added!");
  };
  const removeFromRoster = (team, mid, silent) => {
    const roster = rosters.find((r) => r.eventId === event?.id && r.team === team);
    if (!roster) return;
    const updatedIds = roster.memberIds.filter((x) => x !== mid);
    setRosters((prev) => prev.map((r) =>
      r.eventId === event?.id && r.team === team ? { ...r, memberIds: updatedIds } : r
    ));
    if (roster.id) sb.from("rosters").update({ member_ids: updatedIds }).eq("id", roster.id);
    if (!silent) notify("Removed.");
  };
  const transferMember = (fromTeam, member, toTeam) => {
    const check = canAssignToTeam({ rosters, eventId: event?.id, memberId: member.id, targetTeam: toTeam, memberRoles: member.roles, ignoreTeam: fromTeam });
    if (!check.allowed) {
      notify(`Não é possível transferir ${member.name}: já está na equipe ${check.conflictTeam}.`);
      return;
    }
    removeFromRoster(fromTeam, member.id, true);
    addToRoster(toTeam, member.id, true);
    notify(`${member.name} transferido(a) para ${toTeam}.`);
  };
  const searchR =
    msearch.length > 1
      ? members.filter((m) => norm(m.name).includes(norm(msearch))).slice(0, 6)
      : [];
  return (
    <div className="app-shell">
      <Topbar
        title={t.teamTitle}
        sub={eventSubtitle(event, lang)}
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
              {t.hello}, {greetingName}!
            </h2>
            <p style={{ color: "#6b7280", fontSize: 13 }}>{t.teamReadOnly}</p>
          </div>

          {/* Tab bar — Cozinha and/or CIA leaders */}
          {(isCozinhaLeader || isCIALeader) && (
            <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "2px solid var(--border)", paddingBottom: 0 }}>
              {(isCIALeader
                ? [{ id: "cia", label: "📚 CIA — Classes" }, { id: "equipe", label: "Equipe" }]
                : [{ id: "equipe", label: "Equipe" }, { id: "planejamento", label: "🍽️ Planejamento" }]
              ).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => isCIALeader ? setCiaTab(id) : setKitchenView(id)}
                  style={{
                    background: "none", border: "none", cursor: "pointer", padding: "6px 14px",
                    fontWeight: (isCIALeader ? ciaTab : kitchenView) === id ? 700 : 400,
                    color: (isCIALeader ? ciaTab : kitchenView) === id ? "var(--primary)" : "var(--muted)",
                    borderBottom: (isCIALeader ? ciaTab : kitchenView) === id ? "2px solid var(--primary)" : "2px solid transparent",
                    marginBottom: -2, fontSize: 14,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* CIA Classes tab */}
          {isCIALeader && ciaTab === "cia" ? (() => {
            const CIA_CATS = [
              { cat: "0-3",           label: "0-3",            color: "#be185d" },
              { cat: "Criança",       label: "Crianças",       color: "#7c3aed" },
              { cat: "Intermediário", label: "Intermediários",  color: "#2563eb" },
              { cat: "Adolescente",   label: "Adolescentes",    color: "#0891b2" },
            ];
            const ciaRegs = eventRegs.filter((r) => CIA_CATS.some((c) => c.cat === r.category));
            return (
              <>
                {/* Per-class totals */}
                <div className="stat-grid-4" style={{ marginBottom: 20 }}>
                  {CIA_CATS.map(({ cat, label, color }) => {
                    const count = ciaRegs.filter((r) => r.category === cat).length;
                    return (
                      <div key={cat} className="card" style={{ textAlign: "center", borderTop: `3px solid ${color}`, padding: "14px 10px" }}>
                        <div style={{ fontSize: 26, fontWeight: 700, color }}>{count}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Per-category sections */}
                {CIA_CATS.map(({ cat, label, color }) => {
                  const rows = eventRegs.filter((r) => r.category === cat).sort((a, b) => norm(a.memberName).localeCompare(norm(b.memberName)));
                  const conf = rows.filter((r) => r.paid || r.exempt).length;
                  const pend = rows.filter((r) => !r.paid && !r.exempt).length;
                  const open = ciaExpanded[cat];
                  return (
                    <div key={cat} className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
                      <div
                        onClick={() => setCiaExpanded((p) => ({ ...p, [cat]: !p[cat] }))}
                        style={{ padding: "12px 16px", background: "var(--bg2)", borderBottom: open ? "1px solid var(--border)" : "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />
                          <span style={{ fontWeight: 700, fontSize: 15 }}>{label}</span>
                          <span className="badge badge-blue" style={{ fontSize: 10 }}>{rows.length} total</span>
                          {conf > 0 && <span className="badge badge-green" style={{ fontSize: 10 }}>{conf}✓</span>}
                          {pend > 0 && <span className="badge badge-yellow" style={{ fontSize: 10 }}>{pend}⏳</span>}
                        </div>
                        <span style={{ color: "var(--muted)", fontSize: 13 }}>{open ? "▲" : "▼"}</span>
                      </div>
                      {open && (
                        rows.length === 0 ? (
                          <p style={{ padding: "14px 16px", color: "var(--muted)", fontSize: 13 }}>Nenhum inscrito nesta classe.</p>
                        ) : (
                          <div style={{ overflowX: "auto" }}>
                            <table className="table" style={{ minWidth: 480 }}>
                              <thead>
                                <tr>
                                  <th>Nome</th>
                                  <th>Igreja</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map((r) => {
                                  const paid = r.paid || r.exempt;
                                  return (
                                    <tr key={r.id}>
                                      <td style={{ fontWeight: 500 }}>{r.memberName}</td>
                                      <td style={{ fontSize: 12, color: "#6b7280" }}>{r.church || "—"}</td>
                                      <td>
                                        <span className={`badge ${paid ? "badge-green" : "badge-yellow"}`} style={{ fontSize: 10 }}>
                                          {paid ? "Confirmado" : "Pendente"}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </>
            );
          })() : null}

          {/* Planejamento tab */}
          {isCozinhaLeader && kitchenView === "planejamento" ? (
            <>
              <div style={{ marginBottom: 24 }}>
                <KitchenTab regs={regs} event={event} />
              </div>
              <KitchenPlanningTab regs={regs} event={event} events={props.events} notify={notify} />
            </>
          ) : (!isCIALeader || ciaTab !== "cia") ? (
            <>
              {myTeams.length === 0 && (
                <div style={{ padding: "24px", background: "var(--card)", borderRadius: 10, border: "1px solid var(--border)", color: "var(--muted)", textAlign: "center" }}>
                  Nenhuma equipe cadastrada para este evento.
                </div>
              )}
          {myTeams.map((team) => {
            const roster = rosters.find((r) => r.eventId === event?.id && r.team === team);
            const mids = roster?.memberIds || [];
            const teamMembers = mids
              .map((mid) => members.find((m) => m.id === mid))
              .filter(Boolean)
              .sort((a, b) => norm(a.name).localeCompare(norm(b.name)));
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
                        const check = already ? null : canAssignToTeam({ rosters, eventId: event?.id, memberId: m.id, targetTeam: team, memberRoles: m.roles });
                        const regStatus = getStatus(m.id);
                        return (
                          <div
                            key={m.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "6px 0",
                              borderTop: "1px solid var(--border)",
                              gap: 8,
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 13 }}>
                                {m.name}{" "}
                                <span style={{ color: "#6b7280", fontSize: 11 }}>({m.category})</span>
                              </div>
                              <div style={{ fontSize: 11, marginTop: 2 }}>
                                {regStatus === "confirmed" && <span style={{ color: "#2d8a4e" }}>● {t.confirmed}</span>}
                                {regStatus === "pending" && <span style={{ color: "#d4820a" }}>● {t.pendPayment}</span>}
                                {regStatus === "not_registered" && <span style={{ color: "#9ca3af" }}>○ {t.notRegistered}</span>}
                              </div>
                            </div>
                            {already ? (
                              <span className="badge badge-gray" style={{ whiteSpace: "nowrap" }}>{t.teams}</span>
                            ) : !check.allowed ? (
                              <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>
                                Equipe {check.conflictTeam}
                              </span>
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
                  {!roster ? (
                    <p style={{ padding: 24, color: "#6b7280", textAlign: "center" }}>
                      Nenhuma equipe cadastrada para este evento.
                    </p>
                  ) : teamMembers.length === 0 ? (
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
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {teamMembers.map((m) => {
                            const s = getStatus(m.id);
                            const cfg = STATUS_CFG[s];
                            const reg = getReg(m.id);
                            const cancelledReg = !reg ? getCancelledReg(m.id) : null;
                            const overdueStatus = reg ? deadlineStatus(reg, event, allEventRegs) : null;
                            return (
                              <tr key={m.id}>
                                <td style={{ fontWeight: 600 }}>
                                  <span className={`dot ${cfg.dot}`}></span>
                                  {m.name}
                                  {(m.roles || []).includes("Professor de Seminário") && (
                                    <span className="badge badge-purple" style={{ fontSize: 9, marginLeft: 5, verticalAlign: "middle" }} title="Professor de Seminário">Prof</span>
                                  )}
                                  {(m.translationLanguages || []).map((lang) => (
                                    <span key={lang} className="badge badge-blue" style={{ fontSize: 9, marginLeft: 4, verticalAlign: "middle" }} title={lang}>
                                      {lang.slice(0, 3).toUpperCase()}
                                    </span>
                                  ))}
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
                                  <select
                                    value=""
                                    onChange={(e) => {
                                      const dest = e.target.value;
                                      if (dest) transferMember(team, m, dest);
                                      e.target.value = "";
                                    }}
                                    style={{ fontSize: 11, padding: "3px 6px", width: "auto" }}
                                  >
                                    <option value="">Transferir…</option>
                                    {SERVICE_TEAMS.filter((tm) => tm !== team).map((tm) => (
                                      <option key={tm} value={tm}>{tm}</option>
                                    ))}
                                  </select>
                                </td>
                                <td>
                                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                    {cancelledReg && (
                                      <button
                                        className="btn btn-ghost btn-xs"
                                        onClick={() => setRequestTarget({ reg: cancelledReg, type: "reactivation" })}
                                        title={t.requestReactivation}
                                      >
                                        ♻️
                                      </button>
                                    )}
                                    {reg && overdueStatus && (overdueStatus.overdue || overdueStatus.urgent) && (
                                      <button
                                        className="btn btn-ghost btn-xs"
                                        onClick={() => setRequestTarget({ reg, type: "deadline_extension" })}
                                        title={t.requestExtension}
                                      >
                                        ⏰
                                      </button>
                                    )}
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
                                  </div>
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
            </>
          ) : null}
        </div>
      </div>
      {requestTarget && (
        <Modal onClose={() => { setRequestTarget(null); setRequestNote(""); }} maxWidth={380}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>{requestTarget.type === "reactivation" ? "♻️" : "⏰"}</div>
            <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 17, marginBottom: 10 }}>
              {requestTarget.type === "reactivation" ? t.requestReactivation : t.requestExtension}
            </h3>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 14 }}>
              {requestTarget.reg.memberName}
            </p>
            <textarea
              rows={2}
              value={requestNote}
              onChange={(e) => setRequestNote(e.target.value)}
              placeholder={t.pastorNote}
              style={{ marginBottom: 14, fontSize: 13, width: "100%", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setRequestTarget(null); setRequestNote(""); }}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={submitRequest}>Enviar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
export default TeamLeaderView;
