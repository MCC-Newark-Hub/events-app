import { useState } from "react";
import { useT } from "@/i18n/strings";

const norm = (s) => (s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
import { STATUS_CFG, SERVICE_TEAMS } from "@/constants";
import { sb } from "@/lib/supabase";
import { canAssignToTeam } from "@/lib/teamAssignment";
import { eventSubtitle } from "@/lib/registrationDeadline";
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
  const joinNames = (names) =>
    names.length === 0 ? "" :
    names.length === 1 ? names[0] :
    names.slice(0, -1).join(", ") + " e " + names[names.length - 1];
  const greetingName = joinNames(myTeams) || user?.name;
  const eventRegs = regs.filter((r) => r.eventId === event?.id && !r.cancelled && !r.waitlisted);
  const getStatus = (mid) => {
    const r = eventRegs.find((x) => x.memberId === mid);
    if (!r) return "not_registered";
    return r.paid || r.exempt ? "confirmed" : "pending";
  };
  const [editTeam, setEditTeam] = useState(null);
  const [msearch, setMsearch] = useState("");
  const addToRoster = (team, mid, silent) => {
    let updatedRoster = null;
    setRosters((prev) => {
      const ex = prev.find((r) => r.eventId === event?.id && r.team === team);
      if (ex) {
        if (ex.memberIds.includes(mid)) return prev;
        updatedRoster = { ...ex, memberIds: [...ex.memberIds, mid] };
        return prev.map((r) =>
          r.eventId === event?.id && r.team === team ? updatedRoster : r
        );
      }
      updatedRoster = { eventId: event?.id, team, memberIds: [mid], leaderId: null };
      return [...prev, updatedRoster];
    });
    setTimeout(async () => {
      if (!updatedRoster) return;
      if (updatedRoster.id) {
        await sb.from("rosters").update({ member_ids: updatedRoster.memberIds }).eq("id", updatedRoster.id);
      } else {
        const { data } = await sb.from("rosters").insert({
          event_id: updatedRoster.eventId,
          team: updatedRoster.team,
          member_ids: updatedRoster.memberIds,
          leader_id: null,
        }).select().single();
        if (data) {
          setRosters((p) =>
            p.map((r) =>
              r.eventId === updatedRoster.eventId && r.team === updatedRoster.team && !r.id
                ? { ...r, id: data.id }
                : r
            )
          );
        }
      }
    }, 0);
    if (!silent) notify("✓ Added!");
  };
  const removeFromRoster = (team, mid, silent) => {
    let updatedIds = [];
    let rosterId = null;
    setRosters((prev) =>
      prev.map((r) => {
        if (r.eventId === event?.id && r.team === team) {
          updatedIds = r.memberIds.filter((x) => x !== mid);
          rosterId = r.id;
          return { ...r, memberIds: updatedIds };
        }
        return r;
      })
    );
    if (rosterId) sb.from("rosters").update({ member_ids: updatedIds }).eq("id", rosterId);
    if (!silent) notify("Removed.");
  };
  const transferMember = (fromTeam, member, toTeam) => {
    const check = canAssignToTeam({ rosters, eventId: event?.id, memberId: member.id, targetTeam: toTeam, memberRole: member.role, ignoreTeam: fromTeam });
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
                                  const check = canAssignToTeam({ rosters, eventId: event?.id, memberId: m.id, targetTeam: team, memberRole: m.role });
                                  if (!check.allowed) {
                                    notify(`Não é possível adicionar ${m.name} à sua equipe porque ele(a) já está na equipe ${check.conflictTeam}.`);
                                    return;
                                  }
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
