import { useState, useRef } from "react";
import { useT } from "@/i18n/strings";
import {
  CATEGORIES,
  ROLE_GROUPS,
  TEAMS,
  SERVICE_TEAMS,
  CHURCHES,
  ROLE_BADGE,
  STATUS_CFG,
  fmt,
  deadlineStatus,
  daysSince,
  isDeadlineExempt,
} from "@/constants";
import { sb } from "@/lib/supabase";
import Topbar from "@/components/Topbar";
import NavShell from "@/components/NavShell";
import CapBar from "@/components/CapBar";
import StatusBadge from "@/components/StatusBadge";
import RegModal from "@/components/RegModal";
import DetailModal from "@/components/DetailModal";
import ApprovalsPanel from "@/components/ApprovalsPanel";
import RegistrationsTab from "./admin/RegistrationsTab";
import TeamsTab from "./admin/TeamsTab";
import EventsTab from "./admin/EventsTab";
import ReportsTab from "./admin/ReportsTab";

function AdminMode(props) {
  const { event, user, logout, pendingApprovals, lang, setLang, theme, toggleTheme } = props;
  const t = useT();
  const [sec, setSec] = useState("overview");
  const navItems = [
    { id: "overview", icon: "📊", label: t.overview },
    { id: "regs", icon: "📋", label: t.registrations },
    { id: "teams", icon: "👥", label: t.teams },
    { id: "ga", icon: "🏘️", label: t.groups },
    {
      id: "approvals",
      icon: "⏳",
      label: `${t.approvals}${pendingApprovals.length > 0 ? ` (${pendingApprovals.length})` : ""}`,
    },
    { id: "reports", icon: "📈", label: t.reports },
    { id: "events", icon: "🗓️", label: t.events },
    { id: "import", icon: "⬆️", label: "Importar" },
  ];
  return (
    <div className="app-shell">
      <Topbar
        title={t.adminTitle}
        sub={event?.name}
        user={user}
        logout={logout}
        pendingCount={pendingApprovals.length}
        lang={lang}
        setLang={setLang}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <NavShell navItems={navItems} activeId={sec} onSelect={setSec}>
        {sec === "overview" && <AdminOverview {...props} />}
        {sec === "regs" && <RegistrationsTab {...props} />}
        {sec === "teams" && <TeamsTab {...props} />}
        {sec === "ga" && <AdminGA {...props} />}
        {sec === "approvals" && <ApprovalsPanel {...props} />}
        {sec === "reports" && <ReportsTab {...props} />}
        {sec === "events" && (
          <EventsTab
            events={props.events}
            setEvents={props.setEvents}
            event={props.event}
            setEvent={props.setEvent}
            lang={props.lang}
            notify={props.notify}
          />
        )}
        {sec === "import" && (
          <AdminImport
            members={props.members}
            setMembers={props.setMembers}
            families={props.families}
            setFamilies={props.setFamilies}
            gas={props.gas}
            setGas={props.setGas}
            rosters={props.rosters}
            setRosters={props.setRosters}
            churches={props.churches}
            setChurches={props.setChurches}
            notify={props.notify}
          />
        )}
      </NavShell>
    </div>
  );
}

function AdminOverview({ event, regs, activeCount, wlRegs, exRegs }) {
  const t = useT();
  const er = regs.filter((r) => r.eventId === event?.id && !r.cancelled && !r.waitlisted);
  const paid = er.filter((r) => r.paid && !r.exempt);
  const pend = er.filter((r) => !r.paid && !r.exempt);
  const coll = paid.reduce((s, r) => s + r.fee, 0);
  const pendA = pend.reduce((s, r) => s + r.fee, 0);
  const byCat = CATEGORIES.map((c) => ({ c, n: er.filter((r) => r.category === c).length })).filter(
    (x) => x.n > 0
  );
  const byCh = [...new Set(er.map((r) => r.church))]
    .map((ch) => ({
      ch,
      total: er.filter((r) => r.church === ch).length,
      paid: er.filter((r) => r.church === ch && r.paid).length,
    }))
    .sort((a, b) => b.total - a.total);
  return (
    <div>
      <h2
        style={{
          fontFamily: "'Lora',Georgia,serif",
          fontSize: 22,
          fontWeight: 700,
          marginBottom: 14,
          color: "var(--text)",
        }}
      >
        {t.overview}
      </h2>
      <CapBar
        event={event}
        activeCount={activeCount}
        wlCount={wlRegs.length}
        exCount={exRegs.length}
      />
      <div className="stat-grid-4" style={{ marginBottom: 18 }}>
        {[
          {
            label: t.registered,
            value: er.length,
            sub: `${t.cia}:${er.filter((r) => ["0-3", "Criança", "Intermediário"].includes(r.category)).length} · ${t.ya}:${er.filter((r) => ["Adolescente", "Jovem", "Adulto"].includes(r.category)).length}`,
            color: "#1a3a6b",
            icon: "👥",
          },
          {
            label: t.collected,
            value: fmt(coll),
            sub: `${paid.length} ${t.payers}`,
            color: "#2d8a4e",
            icon: "💵",
          },
          {
            label: t.pendingAmt,
            value: fmt(pendA),
            sub: `${pend.length} ${t.people}`,
            color: "#d4820a",
            icon: "⏳",
          },
          {
            label: t.waitlist,
            value: wlRegs.length,
            sub: `${exRegs.length} ${t.overCapacity}`,
            color: "#92400e",
            icon: "🎫",
          },
        ].map((s) => (
          <div className="stat-card" key={s.label} style={{ borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div className="two-col">
        <div className="card">
          <h4 style={{ fontWeight: 700, marginBottom: 12 }}>{t.category}</h4>
          {byCat.map((x) => (
            <div
              key={x.c}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "7px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span style={{ fontSize: 14 }}>{x.c}</span>
              <span className="badge badge-blue">{x.n}</span>
            </div>
          ))}
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "2px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{t.cia}</span>
              <span className="badge badge-purple">
                {er.filter((r) => ["0-3", "Criança", "Intermediário"].includes(r.category)).length}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{t.ya}</span>
              <span className="badge badge-blue">
                {er.filter((r) => ["Adolescente", "Jovem", "Adulto"].includes(r.category)).length}
              </span>
            </div>
          </div>
        </div>
        <div className="card">
          <h4 style={{ fontWeight: 700, marginBottom: 12 }}>{t.church}</h4>
          {byCh.map((x) => (
            <div
              key={x.ch}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "7px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span style={{ fontSize: 13 }}>{x.ch}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <span className="badge badge-green">{x.paid}✓</span>
                <span className="badge badge-blue">{x.total}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminGA({ gas, setGas, members, regs, event, notify }) {
  const t = useT();
  const [showNew, setShowNew] = useState(false);
  const [newGA, setNewGA] = useState({ name: "", church: "", leaderId: "" });
  const [open, setOpen] = useState(null);
  const eventRegs = regs.filter((r) => r.eventId === event?.id && !r.cancelled && !r.waitlisted);
  const getStatus = (mid) => {
    const r = eventRegs.find((x) => x.memberId === mid);
    if (!r) return "not_registered";
    return r.paid || r.exempt ? "confirmed" : "pending";
  };
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
        <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 22 }}>{t.groups}</h2>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>
          {t.newGA}
        </button>
      </div>
      <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 14 }}>
        One church can have multiple groups.
      </p>
      {gas.map((ga) => {
        const gam = members.filter((m) => m.gaId === ga.id);
        const lead = members.find((m) => m.id === ga.leaderId);
        const counts = { confirmed: 0, pending: 0, not_registered: 0 };
        gam.forEach((m) => counts[getStatus(m.id)]++);
        const isOpen = open === ga.id;
        return (
          <div
            className="card"
            key={ga.id}
            style={{ marginBottom: 10, padding: 0, overflow: "hidden" }}
          >
            <div
              style={{
                padding: "12px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                flexWrap: "wrap",
                gap: 8,
              }}
              onClick={() => setOpen(isOpen ? null : ga.id)}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{ga.name}</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                  {ga.church} · {t.leader}: {lead?.name || t.noLeader} · {gam.length} {t.members}
                </div>
                {ga.description && (
                  <div
                    style={{ fontSize: 12, color: "#9ca3af", marginTop: 2, fontStyle: "italic" }}
                  >
                    {ga.description}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {counts.confirmed > 0 && (
                  <span className="badge badge-green">{counts.confirmed}✓</span>
                )}
                {counts.pending > 0 && (
                  <span className="badge badge-yellow">{counts.pending}⏳</span>
                )}
                {counts.not_registered > 0 && (
                  <span className="badge badge-gray">{counts.not_registered}○</span>
                )}
                <span style={{ color: "#6b7280" }}>{isOpen ? "▲" : "▼"}</span>
              </div>
            </div>
            {isOpen && (
              <div style={{ borderTop: "1px solid var(--border)" }}>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{t.memberName}</th>
                        <th>{t.cat}</th>
                        <th>{t.cargo}</th>
                        <th>{t.regH}</th>
                        <th>{t.payH}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gam.map((m) => {
                        const s = getStatus(m.id);
                        const r = eventRegs.find((x) => x.memberId === m.id);
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
                                <span className="badge badge-gray">○ {t.notRegistered}</span>
                              ) : s === "pending" ? (
                                <span className="badge badge-yellow">⏳</span>
                              ) : (
                                <span className="badge badge-green">✓</span>
                              )}
                            </td>
                            <td>
                              {!r ? (
                                "—"
                              ) : r.exempt ? (
                                <span style={{ color: "#6b7280" }}>{t.exempt}</span>
                              ) : r.paid ? (
                                <span style={{ color: "#2d8a4e", fontWeight: 600 }}>
                                  ✓ {fmt(r.fee)}
                                </span>
                              ) : (
                                <span style={{ color: "#d4820a", fontWeight: 600 }}>
                                  ⏳ {fmt(r.fee)}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {showNew && (
        <div
          className="modal-bg"
          onClick={(e) => e.target === e.currentTarget && setShowNew(false)}
        >
          <div className="modal">
            <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 20, marginBottom: 18 }}>
              {t.newGA}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <div>
                <label>{t.fullName} *</label>
                <input
                  value={newGA.name}
                  onChange={(e) => setNewGA({ ...newGA, name: e.target.value })}
                />
              </div>
              <div>
                <label>{t.church} *</label>
                <select
                  value={newGA.church}
                  onChange={(e) => setNewGA({ ...newGA, church: e.target.value, leaderId: "" })}
                >
                  <option value="">{t.selectChurch}</option>
                  {CHURCHES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>{t.leader}</label>
                <select
                  value={newGA.leaderId}
                  onChange={(e) => setNewGA({ ...newGA, leaderId: e.target.value })}
                >
                  <option value="">{t.noLeader}</option>
                  {members
                    .filter((m) => m.church === newGA.church)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="fr">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    if (!newGA.name || !newGA.church) return;
                    setGas((p) => [
                      ...p,
                      { id: `GA${String(p.length + 1).padStart(3, "0")}`, ...newGA },
                    ]);
                    notify(`GA "${newGA.name}" created!`);
                    setShowNew(false);
                    setNewGA({ name: "", church: "", leaderId: "" });
                  }}
                >
                  {t.create}
                </button>
                <button className="btn btn-ghost" onClick={() => setShowNew(false)}>
                  {t.cancel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── IMPORT MODULE ─────────────────────────────────────────────────────────────

// CSV templates — one per importable entity
const CSV_TEMPLATES = {
  members: {
    label: "Membros",
    filename: "template-membros.csv",
    headers: [
      "id",
      "name",
      "badgeName",
      "gender",
      "category",
      "church",
      "role",
      "familyId",
      "gaId",
    ],
    example: [
      "M100",
      "Silva, João Pedro",
      "João",
      "M",
      "Adulto",
      "Newark, NJ - EUA",
      "Diácono",
      "F005",
      "GA001",
    ],
    notes: [
      "id: código único (ex: M100). Deixe em branco para geração automática.",
      "badgeName: nome exibido no crachá (primeiro nome ou apelido).",
      "gender: M ou F.",
      "category: 0-3, Criança, Intermediário, Adolescente, Jovem, Adulto.",
      "church: exatamente como na lista de igrejas (ex: Newark, NJ - EUA).",
      "role: função SGI (ex: Diácono). Deixe em branco se Participante.",
      "familyId: código da família (ex: F005). Opcional.",
      "gaId: código do GA (ex: GA001). Opcional.",
    ],
    validate: (row) => {
      var errs = [];
      if (!row.name) errs.push("name obrigatório");
      if (!row.badgeName) errs.push("badgeName obrigatório");
      if (!["M", "F"].includes(row.gender)) errs.push("gender deve ser M ou F");
      if (
        !["0-3", "Criança", "Intermediário", "Adolescente", "Jovem", "Adulto"].includes(
          row.category
        )
      )
        errs.push("category inválida: " + row.category);
      return errs;
    },
    transform: (row, idx, existing) => {
      var id = row.id || "M" + String(existing.length + idx + 1).padStart(3, "0");
      return {
        id,
        name: row.name,
        badgeName: row.badgeName || row.name.split(",")[1]?.trim() || row.name,
        gender: row.gender,
        category: row.category,
        church: row.church || "",
        role: row.role || "",
        familyId: row.familyId || null,
        gaId: row.gaId || null,
      };
    },
  },
  families: {
    label: "Famílias",
    filename: "template-familias.csv",
    headers: ["id", "name", "memberIds"],
    example: ["F010", "Família Silva", "M100,M101,M102"],
    notes: [
      "id: código único (ex: F010). Deixe em branco para geração automática.",
      "name: nome da família.",
      "memberIds: IDs dos membros separados por vírgula (ex: M100,M101).",
    ],
    validate: (row) => {
      var errs = [];
      if (!row.name) errs.push("name obrigatório");
      if (!row.memberIds) errs.push("memberIds obrigatório");
      return errs;
    },
    transform: (row, idx, existing) => {
      var id = row.id || "F" + String(existing.length + idx + 1).padStart(3, "0");
      var memberIds = row.memberIds
        ? row.memberIds.split(",").map(function (s) {
            return s.trim();
          })
        : [];
      return { id, name: row.name, memberIds };
    },
  },
  assistanceGroups: {
    label: "Grupos de Assistência",
    filename: "template-grupos-assistencia.csv",
    headers: ["id", "name", "church", "leaderId"],
    example: ["GA010", "GA Newark", "Newark, NJ - EUA", "M100"],
    notes: [
      "id: código único (ex: GA010). Deixe em branco para geração automática.",
      "name: nome do grupo (ex: GA Newark).",
      "church: igreja do grupo.",
      "leaderId: ID do membro líder. Deve ser homem.",
    ],
    validate: (row) => {
      var errs = [];
      if (!row.name) errs.push("name obrigatório");
      if (!row.leaderId) errs.push("leaderId obrigatório");
      return errs;
    },
    transform: (row, idx, existing) => {
      var id = row.id || "GA" + String(existing.length + idx + 1).padStart(3, "0");
      return { id, name: row.name, church: row.church || "", leaderId: row.leaderId };
    },
  },
  teams: {
    label: "Equipes",
    filename: "template-equipes.csv",
    headers: ["eventId", "team", "memberIds"],
    example: ["EVT001", "Cozinha", "M100,M101"],
    notes: [
      "eventId: ID do evento (ex: EVT001).",
      "team: nome da equipe exatamente como cadastrado.",
      "memberIds: IDs dos membros separados por vírgula.",
    ],
    validate: (row) => {
      var errs = [];
      if (!row.eventId) errs.push("eventId obrigatório");
      if (!row.team) errs.push("team obrigatório");
      if (!row.memberIds) errs.push("memberIds obrigatório");
      return errs;
    },
    transform: (row) => {
      var memberIds = row.memberIds
        ? row.memberIds.split(",").map(function (s) {
            return s.trim();
          })
        : [];
      return { eventId: row.eventId, team: row.team, memberIds };
    },
  },
  churches: {
    label: "Igrejas",
    filename: "template-igrejas.csv",
    headers: ["display", "code"],
    example: ["São Paulo, SP", "BRA"],
    notes: [
      "display: cidade e estado (ex: São Paulo, SP).",
      "code: código do país — EUA, CAN ou BRA.",
    ],
    validate: (row) => {
      var errs = [];
      if (!row.display) errs.push("display obrigatório");
      if (!["EUA", "CAN", "BRA"].includes(row.code)) errs.push("code deve ser EUA, CAN ou BRA");
      return errs;
    },
    transform: (row) => ({ display: row.display.trim(), code: row.code.trim() }),
  },
};

// Parse CSV text into array of objects
function parseCSV(text) {
  var lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  var headers = lines[0].split(",").map(function (h) {
    return h.trim().replace(/^"|"$/g, "");
  });
  var rows = [];
  for (var i = 1; i < lines.length; i++) {
    var cells = lines[i].split(",").map(function (c) {
      return c.trim().replace(/^"|"$/g, "");
    });
    if (
      cells.every(function (c) {
        return !c;
      })
    )
      continue; // skip blank rows
    var obj = {};
    headers.forEach(function (h, j) {
      obj[h] = cells[j] || "";
    });
    rows.push(obj);
  }
  return rows;
}

// Generate CSV text from headers + rows
function makeCSV(headers, rows) {
  var lines = [headers.join(",")];
  rows.forEach(function (row) {
    lines.push(
      headers
        .map(function (h) {
          var v = String(row[h] || "");
          return v.includes(",") ? '"' + v + '"' : v;
        })
        .join(",")
    );
  });
  return lines.join("\n");
}

function downloadCSV(filename, text) {
  var blob = new Blob([text], { type: "text/csv" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function AdminImport({
  members,
  setMembers,
  families,
  setFamilies,
  gas,
  setGas,
  rosters,
  setRosters,
  churches,
  setChurches,
  notify,
}) {
  const t = useT();
  const [activeTab, setActiveTab] = useState("members");
  const [preview, setPreview] = useState(null); // {rows, errors, template}
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(null); // {count, label}
  const fileRef = useRef(null);

  const tpl = CSV_TEMPLATES[activeTab];

  const handleDownload = () => {
    var csv = makeCSV(tpl.headers, [
      tpl.headers.reduce(function (o, h, i) {
        o[h] = tpl.example[i] || "";
        return o;
      }, {}),
    ]);
    downloadCSV(tpl.filename, csv);
  };

  const handleFile = (e) => {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      var rows = parseCSV(ev.target.result);
      var results = rows.map(function (row, i) {
        var errs = tpl.validate(row);
        return { row, errs, idx: i };
      });
      setPreview({ rows: results, template: activeTab });
      setImportDone(null);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImport = () => {
    if (!preview) return;
    var valid = preview.rows.filter(function (r) {
      return r.errs.length === 0;
    });
    setImporting(true);
    var items = valid.map(function (r, i) {
      return tpl.transform(
        r.row,
        i,
        activeTab === "members"
          ? members
          : activeTab === "families"
            ? families
            : activeTab === "assistanceGroups"
              ? gas
              : rosters
      );
    });
    var dbTable =
      activeTab === "members"
        ? "members"
        : activeTab === "families"
          ? "families"
          : activeTab === "assistanceGroups"
            ? "assistance_groups"
            : activeTab === "teams"
              ? "rosters"
              : "churches";
    // Map app fields to DB fields
    var dbRows = items.map(function (item) {
      if (activeTab === "members")
        return {
          id: item.id,
          name: item.name,
          badge_name: item.badgeName,
          gender: item.gender,
          category: item.category,
          church: item.church,
          role: item.role || "",
          family_id: item.familyId || null,
          ga_id: item.gaId || null,
        };
      if (activeTab === "families") return { id: item.id, name: item.name };
      if (activeTab === "assistanceGroups")
        return {
          id: item.id,
          name: item.name,
          church: item.church || "",
          leader_id: item.leaderId || null,
          description: item.description || "",
        };
      if (activeTab === "teams")
        return { event_id: item.eventId, team: item.team, member_ids: item.memberIds };
      if (activeTab === "churches")
        return { display: item.display, code: item.code, allow_custom: false };
      return item;
    });
    sb.from(dbTable)
      .upsert(dbRows)
      .then(function (res) {
        if (res.error) {
          console.error("import error:", res.error);
          notify("Erro: " + res.error.message);
          setImporting(false);
          return;
        }
        // Update local state
        if (activeTab === "members")
          setMembers(function (p) {
            var u = [...p];
            items.forEach(function (m) {
              var i = u.findIndex(function (x) {
                return x.id === m.id;
              });
              if (i >= 0) u[i] = m;
              else u.push(m);
            });
            return u;
          });
        else if (activeTab === "families")
          setFamilies(function (p) {
            var u = [...p];
            items.forEach(function (m) {
              var i = u.findIndex(function (x) {
                return x.id === m.id;
              });
              if (i >= 0) u[i] = m;
              else u.push(m);
            });
            return u;
          });
        else if (activeTab === "assistanceGroups")
          setGas(function (p) {
            var u = [...p];
            items.forEach(function (m) {
              var i = u.findIndex(function (x) {
                return x.id === m.id;
              });
              if (i >= 0) u[i] = m;
              else u.push(m);
            });
            return u;
          });
        else if (activeTab === "teams")
          setRosters(function (p) {
            var u = [...p];
            items.forEach(function (m) {
              var i = u.findIndex(function (x) {
                return x.eventId === m.eventId && x.team === m.team;
              });
              if (i >= 0) u[i] = m;
              else u.push(m);
            });
            return u;
          });
        else if (activeTab === "churches")
          setChurches(function (p) {
            var u = [...p];
            items.forEach(function (m) {
              var i = u.findIndex(function (x) {
                return x.display === m.display;
              });
              if (i >= 0) u[i] = m;
              else u.push(m);
            });
            return u;
          });
        setImporting(false);
        setImportDone({ count: items.length, label: tpl.label });
        setPreview(null);
        notify(
          "Importacao concluida: " + items.length + " " + tpl.label.toLowerCase() + " importados."
        );
      });
  };

  const errorCount = preview
    ? preview.rows.filter(function (r) {
        return r.errs.length > 0;
      }).length
    : 0;
  const validCount = preview
    ? preview.rows.filter(function (r) {
        return r.errs.length === 0;
      }).length
    : 0;

  return (
    <div>
      <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 20, marginBottom: 4 }}>
        Importação de Dados
      </h2>
      <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>
        Baixe o template CSV, preencha os dados e faça o upload para importar em lote.
      </p>

      {/* Tab selector */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {Object.keys(CSV_TEMPLATES).map(function (key) {
          return (
            <button
              key={key}
              className={"btn btn-sm " + (activeTab === key ? "btn-primary" : "btn-ghost")}
              onClick={function () {
                setActiveTab(key);
                setPreview(null);
                setImportDone(null);
              }}
            >
              {CSV_TEMPLATES[key].label}
            </button>
          );
        })}
      </div>

      {/* Template card */}
      <div
        style={{
          background: "var(--bg2)",
          borderRadius: 12,
          padding: "18px 20px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{tpl.label}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
              Colunas:{" "}
              <code
                style={{
                  background: "var(--bg)",
                  padding: "1px 5px",
                  borderRadius: 4,
                  fontSize: 11,
                }}
              >
                {tpl.headers.join(", ")}
              </code>
            </div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "var(--muted)" }}>
              {tpl.notes.map(function (n, i) {
                return (
                  <li key={i} style={{ marginBottom: 3 }}>
                    {n}
                  </li>
                );
              })}
            </ul>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleDownload}
            style={{ whiteSpace: "nowrap" }}
          >
            ⬇ Baixar Template
          </button>
        </div>
      </div>

      {/* Upload area */}
      <div
        style={{
          border: "2px dashed var(--border)",
          borderRadius: 12,
          padding: "24px",
          textAlign: "center",
          marginBottom: 16,
          cursor: "pointer",
          background: "var(--bg2)",
        }}
        onClick={function () {
          fileRef.current && fileRef.current.click();
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 8 }}>📂</div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Clique para selecionar o CSV</div>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>Somente arquivos .csv</div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          style={{ display: "none" }}
          onChange={handleFile}
        />
      </div>

      {/* Success banner */}
      {importDone && (
        <div
          style={{
            background: "#d1fae5",
            border: "1px solid #6ee7b7",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 16,
            color: "#065f46",
            fontWeight: 600,
          }}
        >
          Importação concluída: {importDone.count} {importDone.label.toLowerCase()} importados.
        </div>
      )}

      {/* Preview table */}
      {preview && (
        <div>
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
            <div style={{ fontSize: 13 }}>
              <strong>{preview.rows.length}</strong> linhas lidas —{" "}
              <span style={{ color: "#2d8a4e", fontWeight: 700 }}>{validCount} válidas</span>
              {errorCount > 0 && (
                <span style={{ color: "#c4390a", fontWeight: 700 }}>, {errorCount} com erros</span>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={function () {
                  setPreview(null);
                }}
              >
                Cancelar
              </button>
              {validCount > 0 && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleImport}
                  disabled={importing}
                >
                  {importing ? "Importando..." : "Importar " + validCount + " registros"}
                </button>
              )}
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="tbl" style={{ fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ width: 32 }}>#</th>
                  {tpl.headers.map(function (h) {
                    return <th key={h}>{h}</th>;
                  })}
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map(function (item, i) {
                  return (
                    <tr key={i} style={{ background: item.errs.length > 0 ? "#fff8f6" : "" }}>
                      <td style={{ color: "var(--muted)", fontSize: 11 }}>{i + 1}</td>
                      {tpl.headers.map(function (h) {
                        return <td key={h}>{item.row[h] || ""}</td>;
                      })}
                      <td>
                        {item.errs.length === 0 ? (
                          <span style={{ color: "#2d8a4e", fontWeight: 700 }}>OK</span>
                        ) : (
                          <span style={{ color: "#c4390a", fontSize: 11 }}>
                            {item.errs.join("; ")}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── PASTOR VIEW ───────────────────────────────────────────────────────────────
export default AdminMode;
