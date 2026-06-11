import { useState } from "react";
import { useT } from "@/i18n/strings";

const norm = (s) => (s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
import { SERVICE_TEAMS, STATUS_CFG } from "@/constants";

export default function TeamsTab({ event, regs, members, rosters, setRosters, notify }) {
  const t = useT();
  const [editTeam, setEditTeam] = useState(null);
  const [msearch, setMsearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");
  const [newTeamLeader, setNewTeamLeader] = useState("");
  const [customTeams, setCustomTeams] = useState([]);

  const eventRosters = rosters.filter((r) => r.eventId === event?.id);
  const eventRegs = regs.filter((r) => r.eventId === event?.id && !r.cancelled && !r.waitlisted);
  const customTeamNames = customTeams.map((t) => (typeof t === "string" ? t : t.name));
  const allTeams = [...SERVICE_TEAMS, ...customTeamNames];

  const getStatus = (mid) => {
    const r = eventRegs.find((x) => x.memberId === mid);
    if (!r) return "not_registered";
    return r.paid || r.exempt ? "confirmed" : "pending";
  };

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
    notify("✓");
  };

  const removeFromRoster = (team, mid) =>
    setRosters((prev) =>
      prev.map((r) =>
        r.eventId === event?.id && r.team === team
          ? { ...r, memberIds: r.memberIds.filter((x) => x !== mid) }
          : r
      )
    );

  const removeTeam = (team) => {
    setCustomTeams((p) => p.filter((t) => (typeof t === "string" ? t : t.name) !== team));
    setRosters((p) => p.filter((r) => !(r.eventId === event?.id && r.team === team)));
    notify("Equipe removida.");
  };

  const searchR =
    msearch.length > 1
      ? members.filter((m) => norm(m.name).includes(norm(msearch))).slice(0, 6)
      : [];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <h2
          style={{
            fontFamily: "'Lora',Georgia,serif",
            fontSize: 22,
            fontWeight: 700,
            color: "var(--text)",
          }}
        >
          {t.teams}
        </h2>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            setShowNew(true);
            setNewTeamName("");
          }}
        >
          + Nova Equipe
        </button>
      </div>
      <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>
        Status atualizado automaticamente.
      </p>

      {showNew && (
        <div
          className="modal-bg"
          onClick={(e) => e.target === e.currentTarget && setShowNew(false)}
        >
          <div className="modal">
            <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, marginBottom: 16 }}>
              Nova Equipe
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label>Nome da Equipe *</label>
                <input
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Ex: Apoio, Recepção..."
                  autoFocus
                />
              </div>
              <div>
                <label>Descrição</label>
                <input
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  placeholder="Ex: Equipe responsável por..."
                />
              </div>
              <div>
                <label>Líder</label>
                <select value={newTeamLeader} onChange={(e) => setNewTeamLeader(e.target.value)}>
                  <option value="">Selecionar líder...</option>
                  {members
                    .filter((m) => m.gender === "M")
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="fr" style={{ marginTop: 16 }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const name = newTeamName.trim();
                  if (!name) return;
                  if (allTeams.map((t) => (typeof t === "string" ? t : t.name)).includes(name)) {
                    notify("Equipe ja existe.");
                    return;
                  }
                  setCustomTeams((p) => [
                    ...p,
                    { name, description: newTeamDesc, leaderId: newTeamLeader },
                  ]);
                  notify("Equipe criada: " + name);
                  setShowNew(false);
                  setNewTeamName("");
                  setNewTeamDesc("");
                  setNewTeamLeader("");
                }}
              >
                Criar
              </button>
              <button className="btn btn-ghost" onClick={() => setShowNew(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
          gap: 12,
        }}
      >
        {allTeams.map((team) => {
          const isCustom = customTeamNames.includes(team);
          const customTeamObj = isCustom
            ? customTeams.find((t) => (typeof t === "string" ? t : t.name) === team)
            : null;
          const roster = eventRosters.find((r) => r.team === team);
          const mids = roster?.memberIds || [];
          const counts = { confirmed: 0, pending: 0, not_registered: 0 };
          mids.forEach((mid) => counts[getStatus(mid)]++);
          return (
            <div className="card" key={team} style={{ padding: 0, overflow: "hidden" }}>
              <div
                style={{
                  padding: "10px 14px",
                  background: "#f8f9fb",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>
                    {team}
                    {isCustom && (
                      <span
                        style={{ marginLeft: 6, fontSize: 10, color: "#9ca3af", fontWeight: 400 }}
                      >
                        custom
                      </span>
                    )}
                  </h4>
                  {isCustom && customTeamObj && (
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>
                      {customTeamObj.leaderId &&
                        members.find((m) => m.id === customTeamObj.leaderId) && (
                          <span>
                            Líder: {members.find((m) => m.id === customTeamObj.leaderId).name}
                            {customTeamObj.description ? " · " : ""}
                          </span>
                        )}
                      {customTeamObj.description && (
                        <span style={{ fontStyle: "italic" }}>{customTeamObj.description}</span>
                      )}
                    </div>
                  )}
                </div>
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
                    className="btn btn-ghost btn-xs"
                    onClick={() => {
                      setEditTeam(editTeam === team ? null : team);
                      setMsearch("");
                    }}
                  >
                    {editTeam === team ? t.close : t.add}
                  </button>
                  {isCustom && mids.length === 0 && (
                    <button className="btn btn-danger btn-xs" onClick={() => removeTeam(team)}>
                      ✕
                    </button>
                  )}
                </div>
              </div>
              {editTeam === team && (
                <div
                  style={{
                    padding: "10px 12px",
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
              <div style={{ padding: "4px 12px" }}>
                {mids.length === 0 && (
                  <p style={{ fontSize: 13, color: "#9ca3af", padding: "8px 0" }}>{t.noMembers}</p>
                )}
                {mids.map((mid) => {
                  const m = members.find((x) => x.id === mid);
                  const s = getStatus(mid);
                  const cfg = STATUS_CFG[s];
                  if (!m) return null;
                  return (
                    <div
                      key={mid}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "7px 0",
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      <span className={`dot ${cfg.dot}`}></span>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{m.name}</span>
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
                      <button
                        onClick={() => removeFromRoster(team, mid)}
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
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          marginTop: 12,
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
  );
}
