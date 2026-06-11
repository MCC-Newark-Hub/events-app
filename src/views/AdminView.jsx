import { useState, useRef } from "react";
import { LayoutDashboard, ClipboardList, Users, Building2, Clock, BarChart2, Calendar, Upload, Check, Plus, FolderOpen, KeyRound, Eye, EyeOff, BookOpen, Pencil, Trash2, ChevronDown, ChevronUp, X } from "lucide-react";
import { useT } from "@/i18n/strings";
import { CATEGORIES, ROLE_GROUPS, TEAMS, CHURCHES, ROLE_BADGE, fmt } from "@/constants";
import { sb } from "@/lib/supabase";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import CapBar from "@/components/CapBar";
import StatusBadge from "@/components/StatusBadge";
import RegModal from "@/components/RegModal";
import DetailModal from "@/components/DetailModal";
import ApprovalsPanel from "@/components/ApprovalsPanel";
import RegistrationsTab from "./admin/RegistrationsTab";
import TeamsTab from "./admin/TeamsTab";
import EventsTab from "./admin/EventsTab";
import ReportsTab from "./admin/ReportsTab";

// Accent-insensitive search: "joao" matches "João"
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function AdminView(props) {
  const { event, user, logout, pendingApprovals, lang, setLang, theme, toggleTheme } = props;
  const t = useT();
  const [sec, setSec] = useState("overview");
  const navItems = [
    { id: "overview", icon: <LayoutDashboard size={16} />, label: t.overview },
    { id: "regs", icon: <ClipboardList size={16} />, label: t.registrations },
    { id: "teams", icon: <Users size={16} />, label: t.teams },
    { id: "ga", icon: <Building2 size={16} />, label: t.groups },
    { id: "approvals", icon: <Clock size={16} />, label: `${t.approvals}${pendingApprovals.length > 0 ? ` (${pendingApprovals.length})` : ""}` },
    { id: "reports", icon: <BarChart2 size={16} />, label: t.reports },
    { id: "events", icon: <Calendar size={16} />, label: t.events },
    { id: "import", icon: <Upload size={16} />, label: "Importar" },
    { id: "users", icon: <KeyRound size={16} />, label: "Usuários & PINs" },
    { id: "directory", icon: <BookOpen size={16} />, label: "Diretório" },
  ];
  return (
    <div className="app-shell">
      <Topbar title={t.adminTitle} sub={event?.name} user={user} logout={logout} pendingCount={pendingApprovals.length} lang={lang} setLang={setLang} theme={theme} toggleTheme={toggleTheme} />
      <div className="body-with-sidebar">
        <Sidebar navItems={navItems} activeId={sec} onSelect={setSec} />
        <div className="main-scroll">
          <div className="page-pad">
            {sec === "overview" && <AdminOverview {...props} />}
            {sec === "regs" && <RegistrationsTab {...props} />}
            {sec === "teams" && <TeamsTab {...props} />}
            {sec === "ga" && <AdminGA {...props} />}
            {sec === "approvals" && <ApprovalsPanel {...props} />}
            {sec === "reports" && <ReportsTab {...props} />}
            {sec === "events" && <EventsTab events={props.events} setEvents={props.setEvents} event={props.event} setEvent={props.setEvent} lang={props.lang} notify={props.notify} />}
            {sec === "import" && <AdminImport members={props.members} setMembers={props.setMembers} families={props.families} setFamilies={props.setFamilies} gas={props.gas} setGas={props.setGas} rosters={props.rosters} setRosters={props.setRosters} churches={props.churches} setChurches={props.setChurches} notify={props.notify} />}
            {sec === "users" && <AdminUsers dbUsers={props.dbUsers} setDbUsers={props.setDbUsers} notify={props.notify} />}
            {sec === "directory" && <AdminDirectory {...props} dbTeams={props.dbTeams} setDbTeams={props.setDbTeams} />}
          </div>
        </div>
      </div>
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
  const byCat = CATEGORIES.map((c) => ({ c, n: er.filter((r) => r.category === c).length })).filter((x) => x.n > 0);
  const byCh = [...new Set(er.map((r) => r.church))].map((ch) => ({ ch, total: er.filter((r) => r.church === ch).length, paid: er.filter((r) => r.church === ch && r.paid).length })).sort((a, b) => b.total - a.total);
  return (
    <div>
      <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 22, fontWeight: 700, marginBottom: 14, color: "var(--text)" }}>{t.overview}</h2>
      <CapBar event={event} activeCount={activeCount} wlCount={wlRegs.length} exCount={exRegs.length} />
      <div className="stat-grid-4" style={{ marginBottom: 18 }}>
        {[
          { label: t.registered, value: er.length, sub: `${t.cia}:${er.filter((r) => ["0-3","Criança","Intermediário"].includes(r.category)).length} · ${t.ya}:${er.filter((r) => ["Adolescente","Jovem","Adulto"].includes(r.category)).length}`, color: "#1a3a6b", icon: <Users size={22} /> },
          { label: t.collected, value: fmt(coll), sub: `${paid.length} ${t.payers}`, color: "#2d8a4e", icon: "💵" },
          { label: t.pendingAmt, value: fmt(pendA), sub: `${pend.length} ${t.people}`, color: "#d4820a", icon: <Clock size={22} /> },
          { label: t.waitlist, value: wlRegs.length, sub: `${exRegs.length} ${t.overCapacity}`, color: "#92400e", icon: "🎫" },
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
            <div key={x.c} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: 14 }}>{x.c}</span><span className="badge badge-blue">{x.n}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <h4 style={{ fontWeight: 700, marginBottom: 12 }}>{t.church}</h4>
          {byCh.map((x) => (
            <div key={x.ch} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: 13 }}>{x.ch}</span>
              <div style={{ display: "flex", gap: 6 }}><span className="badge badge-green">{x.paid}✓</span><span className="badge badge-blue">{x.total}</span></div>
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
  const getStatus = (mid) => { const r = eventRegs.find((x) => x.memberId === mid); if (!r) return "not_registered"; return r.paid || r.exempt ? "confirmed" : "pending"; };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 22 }}>{t.groups}</h2>
        <button className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={() => setShowNew(true)}><Plus size={14} /> {t.newGA}</button>
      </div>
      <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 14 }}>One church can have multiple groups.</p>
      {gas.map((ga) => {
        const gam = members.filter((m) => m.gaId === ga.id);
        const lead = members.find((m) => m.id === ga.leaderId);
        const counts = { confirmed: 0, pending: 0, not_registered: 0 };
        gam.forEach((m) => counts[getStatus(m.id)]++);
        const isOpen = open === ga.id;
        return (
          <div className="card" key={ga.id} style={{ marginBottom: 10, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", flexWrap: "wrap", gap: 8 }} onClick={() => setOpen(isOpen ? null : ga.id)}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{ga.name}</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{ga.church} · {t.leader}: {lead?.name || t.noLeader} · {gam.length} {t.members}</div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {counts.confirmed > 0 && <span className="badge badge-green">{counts.confirmed}✓</span>}
                {counts.pending > 0 && <span className="badge badge-yellow">{counts.pending} <Clock size={10} /></span>}
                {counts.not_registered > 0 && <span className="badge badge-gray">{counts.not_registered}○</span>}
                <span style={{ color: "#6b7280" }}>{isOpen ? "▲" : "▼"}</span>
              </div>
            </div>
            {isOpen && (
              <div style={{ borderTop: "1px solid var(--border)" }}>
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>{t.memberName}</th><th>{t.cat}</th><th>{t.cargo}</th><th>{t.regH}</th><th>{t.payH}</th></tr></thead>
                    <tbody>
                      {gam.map((m) => {
                        const s = getStatus(m.id);
                        const r = eventRegs.find((x) => x.memberId === m.id);
                        return (
                          <tr key={m.id}>
                            <td style={{ fontWeight: 600 }}>{m.name}</td>
                            <td><span className="badge badge-blue">{m.category}</span></td>
                            <td>{m.role ? <span className={`badge ${ROLE_BADGE[m.role]}`}>{m.role}</span> : <span style={{ color: "#9ca3af" }}>—</span>}</td>
                            <td>{s === "not_registered" ? <span className="badge badge-gray">○ {t.notRegistered}</span> : s === "pending" ? <span className="badge badge-yellow"><Clock size={10} /></span> : <span className="badge badge-green"><Check size={10} /></span>}</td>
                            <td>{!r ? "—" : r.exempt ? <span style={{ color: "#6b7280" }}>{t.exempt}</span> : r.paid ? <span style={{ color: "#2d8a4e", fontWeight: 600 }}><Check size={10} /> {fmt(r.fee)}</span> : <span style={{ color: "#d4820a", fontWeight: 600 }}><Clock size={10} /> {fmt(r.fee)}</span>}</td>
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
        <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && setShowNew(false)}>
          <div className="modal">
            <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 20, marginBottom: 18 }}>{t.newGA}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <div><label>{t.fullName} *</label><input value={newGA.name} onChange={(e) => setNewGA({ ...newGA, name: e.target.value })} /></div>
              <div><label>{t.church} *</label><select value={newGA.church} onChange={(e) => setNewGA({ ...newGA, church: e.target.value, leaderId: "" })}><option value="">{t.selectChurch}</option>{CHURCHES.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div><label>{t.leader}</label><select value={newGA.leaderId} onChange={(e) => setNewGA({ ...newGA, leaderId: e.target.value })}><option value="">{t.noLeader}</option>{members.filter((m) => m.church === newGA.church).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
              <div className="fr">
                <button className="btn btn-primary" onClick={() => { if (!newGA.name || !newGA.church) return; setGas((p) => [...p, { id: `GA${String(p.length + 1).padStart(3, "0")}`, ...newGA }]); notify(`GA "${newGA.name}" created!`); setShowNew(false); setNewGA({ name: "", church: "", leaderId: "" }); }}>{t.create}</button>
                <button className="btn btn-ghost" onClick={() => setShowNew(false)}>{t.cancel}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// CSV Import
const VALID_CATEGORIES = ["0-3","Criança","Intermediário","Adolescente","Jovem","Adulto"];
const VALID_CODES      = ["EUA","CAN","BRA"];

const CSV_TEMPLATES = {
  // ── Members ──────────────────────────────────────────────────────────────
  members: {
    label: "Membros",
    filename: "template-membros.csv",
    headers: ["id","firstName","lastName","badgeName","gender","category","church","role","familyId","gaId","allergies","specialNeeds","notes"],
    example: ["M100","João Pedro","Silva","João","M","Adulto","Newark, NJ - EUA","Diácono","F005","GA001","","",""],
    notes: [
      "id: código único (ex: M100). Deixe em branco para geração automática.",
      "firstName: primeiro nome (ex: João Pedro).",
      "lastName: sobrenome (ex: Silva).",
      "badgeName: nome exibido no crachá (ex: João). Pode ser apelido.",
      "gender: M ou F.",
      "category: 0-3 | Criança | Intermediário | Adolescente | Jovem | Adulto.",
      "church: cidade exatamente como na lista de igrejas (ex: Newark, NJ - EUA).",
      "role: função. Deixe em branco se Participante.",
      "familyId: código da família. Opcional (ex: F005).",
      "gaId: código do Grupo de Assistência. Opcional (ex: GA001).",
      "allergies: alergias e restrições alimentares. Opcional.",
      "specialNeeds: necessidades especiais. Opcional.",
      "notes: observações gerais. Opcional.",
    ],
    validate: (row) => {
      var e = [];
      if (!row.firstName && !row.lastName) e.push("firstName ou lastName obrigatório");
      if (!row.badgeName) e.push("badgeName obrigatório");
      if (!["M","F"].includes(row.gender)) e.push("gender deve ser M ou F");
      if (!row.category) e.push("category obrigatória");
      // Non-standard categories are allowed (warn only, don't block)
      return e;
    },
    transform: (row, idx, existing) => {
      var id = row.id || "M" + String(existing.length + idx + 1).padStart(3, "0");
      var firstName = row.firstName || "";
      var lastName  = row.lastName  || "";
      var fullName  = [firstName, lastName].filter(Boolean).join(" ") || row.name || "";
      return {
        id,
        name:          fullName,
        first_name:    firstName,
        last_name:     lastName,
        badge_name:    row.badgeName || firstName || fullName,
        gender:        row.gender,
        category:      row.category,
        church:        row.church   || "",
        role:          row.role     || "",
        family_id:     row.familyId || null,
        ga_id:         row.gaId     || null,
        allergies:     row.allergies     || null,
        special_needs: row.specialNeeds  || null,
        notes:         row.notes         || null,
      };
    },
  },

  // ── Families ─────────────────────────────────────────────────────────────
  families: {
    label: "Famílias",
    filename: "template-familias.csv",
    headers: ["id","name","memberIds"],
    example: ["F010","Família Silva","M100,M101,M102"],
    notes: [
      "id: código único (ex: F010). Deixe em branco para geração automática.",
      "name: nome da família (ex: Família Silva).",
      "memberIds: IDs dos membros separados por vírgula (ex: M100,M101,M102).",
    ],
    validate: (row) => {
      var e = [];
      if (!row.name) e.push("name obrigatório");
      if (!row.memberIds) e.push("memberIds obrigatório");
      return e;
    },
    transform: (row, idx, existing) => {
      var id = row.id || "F" + String(existing.length + idx + 1).padStart(3, "0");
      return { id, name: row.name, member_ids: row.memberIds ? row.memberIds.split(",").map(s => s.trim()) : [] };
    },
  },

  // ── Assistance Groups ─────────────────────────────────────────────────────
  assistanceGroups: {
    label: "Grupos de Assistência",
    filename: "template-grupos-assistencia.csv",
    headers: ["id","name","church","leaderId","description"],
    example: ["GA010","GA Newark","Newark, NJ - EUA","M100","Grupo da região de Newark"],
    notes: [
      "id: código único (ex: GA010). Deixe em branco para geração automática.",
      "name: nome do grupo.",
      "church: cidade da igreja do grupo.",
      "leaderId: ID do membro líder (ex: M100).",
      "description: descrição opcional.",
    ],
    validate: (row) => {
      var e = [];
      if (!row.name) e.push("name obrigatório");
      if (!row.leaderId) e.push("leaderId obrigatório");
      return e;
    },
    transform: (row, idx, existing) => {
      var id = row.id || "GA" + String(existing.length + idx + 1).padStart(3, "0");
      return { id, name: row.name, church: row.church || "", leader_id: row.leaderId, description: row.description || "" };
    },
  },

  // ── Rosters / Teams ───────────────────────────────────────────────────────
  teams: {
    label: "Equipes (Roster)",
    filename: "template-equipes.csv",
    headers: ["eventId","team","memberIds"],
    example: ["EVT001","Cozinha","M100,M101"],
    notes: [
      "eventId: ID do evento (ex: EVT001).",
      "team: nome da equipe — deve ser um dos valores cadastrados no sistema.",
      "memberIds: IDs dos membros separados por vírgula.",
    ],
    validate: (row) => {
      var e = [];
      if (!row.eventId)   e.push("eventId obrigatório");
      if (!row.team)      e.push("team obrigatório");
      if (!row.memberIds) e.push("memberIds obrigatório");
      return e;
    },
    transform: (row) => ({
      event_id:   row.eventId,
      team:       row.team,
      member_ids: row.memberIds ? row.memberIds.split(",").map(s => s.trim()) : [],
    }),
  },

  // ── Churches ─────────────────────────────────────────────────────────────
  churches: {
    label: "Igrejas",
    filename: "template-igrejas.csv",
    headers: ["display","city","stateCode","stateName","countryCode","country","address","churchName"],
    example: ["Newark, NJ","Newark","NJ","New Jersey","EUA","United States","",""],
    notes: [
      "display: rótulo curto exibido no sistema (ex: Newark, NJ). Obrigatório.",
      "city: cidade (ex: Newark). Obrigatório.",
      "stateCode: sigla do estado/província com 2 letras (ex: NJ, ON, SP). Obrigatório.",
      "stateName: nome completo do estado (ex: New Jersey). Opcional.",
      "countryCode: código do país — EUA | CAN | BRA. Obrigatório.",
      "country: nome completo do país (ex: United States). Opcional.",
      "address: endereço da congregação. Opcional.",
      "churchName: nome oficial da congregação local. Opcional.",
    ],
    validate: (row) => {
      var e = [];
      if (!row.display)     e.push("display obrigatório");
      if (!row.city)        e.push("city obrigatório");
      if (!row.stateCode)   e.push("stateCode obrigatório");
      if (!VALID_CODES.includes(row.countryCode)) e.push("countryCode deve ser EUA, CAN ou BRA. Encontrado: \"" + row.countryCode + "\"");
      return e;
    },
    transform: (row) => ({
      display:      row.display.trim(),
      code:         row.countryCode.trim(),   // keep legacy 'code' column in sync
      city:         row.city.trim(),
      state_code:   row.stateCode.trim(),
      state_name:   row.stateName?.trim()   || null,
      country_code: row.countryCode.trim(),
      country:      row.country?.trim()     || null,
      address:      row.address?.trim()     || null,
      church_name:  row.churchName?.trim()  || null,
    }),
  },
};

function sanitizeText(s) {
  if (typeof s !== "string") return s;
  var result = "";
  for (var i = 0; i < s.length; i++) {
    var c = s.charCodeAt(i);
    // Smart single quotes (U+2018, U+2019) -> straight apostrophe
    if (c === 0x2018 || c === 0x2019) { result += "'"; continue; }
    // Smart double quotes (U+201C, U+201D) -> straight double quote
    if (c === 0x201C || c === 0x201D) { result += '"'; continue; }
    // Unicode replacement character (U+FFFD) -> skip
    if (c === 0xFFFD) { continue; }
    result += s[i];
  }
  return result;
}
function splitCSVLine(line) {
  var cells = [], cur = "", inQ = false;
  for (var i = 0; i < line.length; i++) {
    var ch = line[i];
    if (ch === '"') {
      if (inQ && line[i+1] === '"') { cur += '"'; i++; } // escaped quote
      else inQ = !inQ;
    } else if (ch === ',' && !inQ) {
      cells.push(cur.trim()); cur = "";
    } else cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}
function parseCSV(text) {
  text = sanitizeText(text);
  var lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  var headers = splitCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, "").trim());
  var rows = [];
  for (var i = 1; i < lines.length; i++) {
    var cells = splitCSVLine(lines[i]).map(c => sanitizeText(c.replace(/^"|"$/g, "").trim()));
    if (cells.every(c => !c)) continue;
    var obj = {}; headers.forEach((h, j) => { obj[h] = cells[j] || ""; });
    rows.push(obj);
  }
  return rows;
}
function makeCSV(headers,rows) { var lines=[headers.join(",")]; rows.forEach(row=>{lines.push(headers.map(h=>{var v=String(row[h]||""); return v.includes(",")?'"'+v+'"':v;}).join(","));}); return lines.join("\n"); }
function downloadCSV(filename,text) { var blob=new Blob([text],{type:"text/csv"}); var url=URL.createObjectURL(blob); var a=document.createElement("a"); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url); }

function AdminImport({ members, setMembers, families, setFamilies, gas, setGas, rosters, setRosters, churches, setChurches, notify }) {
  const t = useT();
  const [activeTab, setActiveTab] = useState("members");
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(null);
  const fileRef = useRef(null);
  const tpl = CSV_TEMPLATES[activeTab];

  const handleDownload = () => { downloadCSV(tpl.filename, makeCSV(tpl.headers, [tpl.headers.reduce((o,h,i)=>{o[h]=tpl.example[i]||"";return o;},{})])); };
  const handleFile = (e) => {
    var file = e.target.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = (ev) => {
      // Try UTF-8 first; if replacement chars appear, re-decode as Windows-1252
      var buffer = ev.target.result;
      var text;
      try {
        text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
      } catch (_) {
        text = new TextDecoder("windows-1252").decode(buffer);
      }
      var rows = parseCSV(text);
      setPreview({ rows: rows.map((row, i) => ({ row, errs: tpl.validate(row), idx: i })), template: activeTab });
      setImportDone(null);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };
  const handleImport = () => {
    if(!preview)return;
    var valid=preview.rows.filter(r=>r.errs.length===0);
    setImporting(true);
    var existing=activeTab==="members"?members:activeTab==="families"?families:activeTab==="assistanceGroups"?gas:rosters;
    var items=valid.map((r,i)=>tpl.transform(r.row,i,existing));
    var dbTable=activeTab==="members"?"members":activeTab==="families"?"families":activeTab==="assistanceGroups"?"assistance_groups":activeTab==="teams"?"rosters":"churches";
    // transform() already produces snake_case DB keys; just pass through
    // For churches, add allow_custom flag
    var dbRows = items.map(item =>
      activeTab === "churches" ? { ...item, allow_custom: false } : item
    );
    sb.from(dbTable).upsert(dbRows).then(res=>{
      if(res.error){console.error(res.error);notify("Erro: "+res.error.message);setImporting(false);return;}
      // Re-map snake_case DB rows back to camelCase app objects for local state
      const toApp = (m) => {
        if (activeTab === "members") return { id:m.id, name:m.name, firstName:m.first_name||"", lastName:m.last_name||"", badgeName:m.badge_name||m.name, gender:m.gender, category:m.category, church:m.church, role:m.role||"", familyId:m.family_id, gaId:m.ga_id, allergies:m.allergies||"", specialNeeds:m.special_needs||"", notes:m.notes||"" };
        if (activeTab === "families") return { id:m.id, name:m.name, memberIds:m.member_ids||[] };
        if (activeTab === "assistanceGroups") return { id:m.id, name:m.name, church:m.church, leaderId:m.leader_id, description:m.description||"" };
        if (activeTab === "teams") return { id:m.id, eventId:m.event_id, team:m.team, memberIds:m.member_ids||[] };
        return m;
      };
      const appItems = items.map(toApp);
      const updater = (p) => { var u=[...p]; appItems.forEach(m => { var i=u.findIndex(x=>x.id===m.id); if(i>=0)u[i]=m; else u.push(m); }); return u; };
      if(activeTab==="members")setMembers(updater);
      else if(activeTab==="families")setFamilies(updater);
      else if(activeTab==="assistanceGroups")setGas(updater);
      else if(activeTab==="teams")setRosters(p=>{var u=[...p];items.forEach(m=>{var i=u.findIndex(x=>x.eventId===m.eventId&&x.team===m.team);if(i>=0)u[i]=m;else u.push(m);});return u;});
      else if(activeTab==="churches")setChurches(p=>{var u=[...p];items.forEach(m=>{var i=u.findIndex(x=>x.display===m.display);if(i>=0)u[i]=m;else u.push(m);});return u;});
      setImporting(false);setImportDone({count:items.length,label:tpl.label});setPreview(null);
      notify("Importação concluída: "+items.length+" "+tpl.label.toLowerCase()+" importados.");
    });
  };
  const errorCount=preview?preview.rows.filter(r=>r.errs.length>0).length:0;
  const validCount=preview?preview.rows.filter(r=>r.errs.length===0).length:0;
  return (
    <div>
      <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 20, marginBottom: 4 }}>Importação de Dados</h2>
      <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>Baixe o template CSV, preencha os dados e faça o upload para importar em lote.</p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {Object.keys(CSV_TEMPLATES).map(key=>(
          <button key={key} className={"btn btn-sm "+(activeTab===key?"btn-primary":"btn-ghost")} onClick={()=>{setActiveTab(key);setPreview(null);setImportDone(null);}}>{CSV_TEMPLATES[key].label}</button>
        ))}
      </div>
      <div style={{ background: "var(--bg2)", borderRadius: 12, padding: "18px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{tpl.label}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>Colunas: <code style={{ background: "var(--bg)", padding: "1px 5px", borderRadius: 4, fontSize: 11 }}>{tpl.headers.join(", ")}</code></div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "var(--muted)" }}>{tpl.notes.map((n,i)=><li key={i} style={{ marginBottom: 3 }}>{n}</li>)}</ul>
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleDownload} style={{ whiteSpace: "nowrap" }}>Baixar Template</button>
        </div>
      </div>
      <div style={{ border: "2px dashed var(--border)", borderRadius: 12, padding: "24px", textAlign: "center", marginBottom: 16, cursor: "pointer", background: "var(--bg2)" }} onClick={()=>fileRef.current&&fileRef.current.click()}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}><FolderOpen size={28} color="var(--muted)" /></div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Clique para selecionar o CSV</div>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>Somente arquivos .csv</div>
        <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleFile} />
      </div>
      {importDone && <div style={{ background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: "#065f46", fontWeight: 600 }}>Importação concluída: {importDone.count} {importDone.label.toLowerCase()} importados.</div>}
      {preview && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 13 }}><strong>{preview.rows.length}</strong> linhas lidas — <span style={{ color: "#2d8a4e", fontWeight: 700 }}>{validCount} válidas</span>{errorCount>0&&<span style={{ color: "#c4390a", fontWeight: 700 }}>, {errorCount} com erros</span>}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={()=>setPreview(null)}>Cancelar</button>
              {validCount>0&&<button className="btn btn-primary btn-sm" onClick={handleImport} disabled={importing}>{importing?"Importando...":"Importar "+validCount+" registros"}</button>}
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="tbl" style={{ fontSize: 12 }}>
              <thead><tr><th style={{ width: 32 }}>#</th>{tpl.headers.map(h=><th key={h}>{h}</th>)}<th>Status</th></tr></thead>
              <tbody>
                {preview.rows.map((item,i)=>(
                  <tr key={i} style={{ background: item.errs.length>0?"#fff8f6":"" }}>
                    <td style={{ color: "var(--muted)", fontSize: 11 }}>{i+1}</td>
                    {tpl.headers.map(h=><td key={h}>{item.row[h]||""}</td>)}
                    <td>{item.errs.length===0?<span style={{ color: "#2d8a4e", fontWeight: 700 }}>OK</span>:<span style={{ color: "#c4390a", fontSize: 11 }}>{item.errs.join("; ")}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Users & PINs Management ───────────────────────────────────────────────────
const ROLE_LABELS = {
  admin: "Admin",
  clerk: "Atendente",
  pastor: "Pastor",
  ga_leader: "Líder de GA",
  team_leader: "Líder de Equipe",
};

function AdminUsers({ dbUsers, setDbUsers, notify }) {
  const [editing, setEditing] = useState(null); // { id, name, pin, sysRole, initials, church }
  const [showPin, setShowPin] = useState(false);
  const [saving, setSaving] = useState(false);

  const startEdit = (u) => {
    setEditing({ ...u, newPin: "", confirmPin: "" });
    setShowPin(false);
  };
  const startNew = () => {
    setEditing({ id: null, name: "", sysRole: "clerk", initials: "", church: "", newPin: "", confirmPin: "" });
    setShowPin(false);
  };
  const cancel = () => setEditing(null);

  const save = async () => {
    if (!editing.name.trim()) { notify("Nome é obrigatório."); return; }
    if (editing.newPin && editing.newPin.length !== 4) { notify("PIN deve ter 4 dígitos."); return; }
    if (editing.newPin && editing.newPin !== editing.confirmPin) { notify("PINs não coincidem."); return; }
    setSaving(true);
    const row = {
      name: editing.name.trim(),
      sys_role: editing.sysRole,
      initials: editing.initials || editing.name.slice(0, 2).toUpperCase(),
      church: editing.church || null,
      ...(editing.newPin ? { pin: editing.newPin } : {}),
    };
    if (editing.id) {
      const { error } = await sb.from("app_users").update(row).eq("id", editing.id);
      if (error) { notify("Erro ao salvar: " + error.message); setSaving(false); return; }
      setDbUsers((prev) => prev.map((u) => u.id === editing.id ? { ...u, ...row, pin: editing.newPin || u.pin } : u));
    } else {
      if (!editing.newPin) { notify("PIN é obrigatório para novo usuário."); setSaving(false); return; }
      const { data, error } = await sb.from("app_users").insert({ ...row, pin: editing.newPin }).select().single();
      if (error) { notify("Erro ao criar: " + error.message); setSaving(false); return; }
      setDbUsers((prev) => [...prev, data]);
    }
    notify(editing.id ? "Usuário atualizado!" : "Usuário criado!");
    setSaving(false);
    setEditing(null);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 22, fontWeight: 700 }}>Usuários & PINs</h2>
        <button className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={startNew}>
          <Plus size={14} /> Novo Usuário
        </button>
      </div>
      <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 18 }}>
        Gerencie quem pode acessar o sistema e redefina PINs individualmente.
      </p>

      {editing && (
        <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && cancel()}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, marginBottom: 18 }}>
              {editing.id ? "Editar Usuário" : "Novo Usuário"}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label>Nome completo *</label>
                <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Nome do usuário" />
              </div>
              <div className="fr">
                <div>
                  <label>Iniciais (crachá)</label>
                  <input value={editing.initials} onChange={(e) => setEditing({ ...editing, initials: e.target.value.toUpperCase().slice(0, 3) })} placeholder="LA" maxLength={3} />
                </div>
                <div>
                  <label>Função *</label>
                  <select value={editing.sysRole} onChange={(e) => setEditing({ ...editing, sysRole: e.target.value })}>
                    {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label>Igreja (opcional)</label>
                <input value={editing.church || ""} onChange={(e) => setEditing({ ...editing, church: e.target.value })} placeholder="Newark, NJ - EUA" />
              </div>
              <div>
                <label>{editing.id ? "Novo PIN (deixe em branco para manter)" : "PIN *"}</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPin ? "text" : "password"}
                    maxLength={4}
                    value={editing.newPin}
                    onChange={(e) => setEditing({ ...editing, newPin: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    placeholder="4 dígitos"
                    style={{ paddingRight: 40 }}
                  />
                  <button onClick={() => setShowPin((v) => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {editing.newPin && (
                <div>
                  <label>Confirmar PIN *</label>
                  <input
                    type={showPin ? "text" : "password"}
                    maxLength={4}
                    value={editing.confirmPin}
                    onChange={(e) => setEditing({ ...editing, confirmPin: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    placeholder="Repita o PIN"
                    style={{ border: editing.confirmPin && editing.confirmPin !== editing.newPin ? "2px solid #c0392b" : undefined }}
                  />
                  {editing.confirmPin && editing.confirmPin !== editing.newPin && (
                    <p style={{ color: "#c0392b", fontSize: 12, marginTop: 4 }}>PINs não coincidem.</p>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={cancel} disabled={saving}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</button>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="table" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th style={{ width: 40 }}></th>
              <th>Nome</th>
              <th style={{ width: 130 }}>Função</th>
              <th style={{ width: 160 }}>Igreja</th>
              <th style={{ width: 80 }}>PIN</th>
              <th style={{ width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {dbUsers.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{u.initials || u.name?.slice(0, 2).toUpperCase()}</div>
                </td>
                <td style={{ fontWeight: 600 }}>{u.name}</td>
                <td><span className="badge badge-blue">{ROLE_LABELS[u.sys_role || u.sysRole] || u.sys_role || u.sysRole}</span></td>
                <td style={{ fontSize: 12, color: "var(--muted)" }}>{u.church || "—"}</td>
                <td style={{ fontFamily: "monospace", letterSpacing: 3 }}>••••</td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => startEdit({ id: u.id, name: u.name, sysRole: u.sys_role || u.sysRole, initials: u.initials, church: u.church })}>
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {dbUsers.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>Nenhum usuário cadastrado no banco de dados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// ── Directory ─────────────────────────────────────────────────────────────────
function SearchSelect({ value, onSelect, items, getLabel, getId, placeholder }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const selected = value ? items.find((i) => getId(i) === value) : null;
  const label = selected ? getLabel(selected) : "";
  const results = q.length > 0 ? items.filter((i) =>norm( getLabel(i)).includes(norm(q))).slice(0, 8) : [];
  return (
    <div style={{ position: "relative" }}>
      <input
        value={open ? q : label}
        onFocus={() => { setOpen(true); setQ(""); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder || "Buscar…"}
      />
      {value && <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{value}</div>}
      {open && results.length > 0 && (
        <div style={{ position: "absolute", zIndex: 200, background: "var(--card)", border: "1.5px solid var(--border)", borderRadius: 8, left: 0, right: 0, maxHeight: 200, overflowY: "auto", boxShadow: "var(--shadow-md)" }}>
          <div style={{ padding: "6px 12px", cursor: "pointer", fontSize: 12, color: "var(--muted)" }} onMouseDown={() => { onSelect(""); setOpen(false); setQ(""); }}>— Nenhum —</div>
          {results.map((item) => (
            <div key={getId(item)} onMouseDown={() => { onSelect(getId(item)); setOpen(false); setQ(""); }}
              style={{ padding: "8px 12px", cursor: "pointer", borderTop: "1px solid var(--border)", fontSize: 13 }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--sidebar-active-bg)"}
              onMouseLeave={(e) => e.currentTarget.style.background = ""}>
              {getLabel(item)}
              <span style={{ marginLeft: 8, fontSize: 10, color: "var(--muted)" }}>{getId(item)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ConfirmDelete({ label, count, onConfirm, onCancel }) {
  return (
    <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal" style={{ maxWidth: 360, textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
        <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, marginBottom: 8 }}>Confirmar exclusão</h3>
        <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>
          {count > 1
            ? <>Excluir <strong>{count} itens</strong>? Esta ação não pode ser desfeita.</>
            : <>Remover <strong>{label}</strong>? Esta ação não pode ser desfeita.</>}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel}>Cancelar</button>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={onConfirm}>Excluir</button>
        </div>
      </div>
    </div>
  );
}

// Shared bulk-action bar shown when rows are selected
function BulkBar({ selected, total, onSelectAll, onClearAll, onDeleteSelected, label }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
      background: "var(--sidebar-active-bg)", border: "1.5px solid var(--primary)",
      borderRadius: 8, marginBottom: 10, flexWrap: "wrap",
    }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)" }}>
        {selected} selecionado{selected !== 1 ? "s" : ""}
      </span>
      <button className="btn btn-ghost btn-sm" onClick={onSelectAll} disabled={selected === total}>
        Selecionar todos ({total})
      </button>
      <button className="btn btn-ghost btn-sm" onClick={onClearAll}>Limpar seleção</button>
      <button className="btn btn-danger btn-sm" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}
        onClick={onDeleteSelected}>
        <Trash2 size={13} /> Excluir {selected} {label}
      </button>
    </div>
  );
}

function AdminDirectory({ churches, setChurches, members, setMembers, families, setFamilies, gas, setGas, rosters, setRosters, dbTeams, setDbTeams, notify }) {
  const TABS = [
    { id: "churches",  label: "Igrejas",              count: churches?.length },
    { id: "members",   label: "Membros",              count: members?.length },
    { id: "families",  label: "Famílias",             count: families?.length },
    { id: "groups",    label: "Grupos de Assistência",count: gas?.length },
    { id: "teams",     label: "Equipes / Rosters",    count: rosters?.length },
    { id: "teams_dir", label: "Equipes (Referência)",  count: dbTeams?.length },
  ];
  const [tab, setTab]         = useState("churches");
  const [search, setSearch]   = useState("");
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({});
  const [deleting, setDeleting] = useState(null); // { ids:[], label:"" }
  const [selected, setSelected] = useState([]);
  const [saving, setSaving]   = useState(false);
  const [expanded, setExpanded] = useState(null);

  const switchTab = (id) => { setTab(id); setSearch(""); setEditing(null); setSelected([]); setFormData({}); };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const toggleSel = (id) => setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const selAll    = (ids) => setSelected(ids);
  const clearSel  = () => setSelected([]);

  const openEdit = (row, defaults) => { setEditing(row); setFormData(defaults); };
  const openNew  = (defaults) => { setEditing({ id: null }); setFormData(defaults); };

  const isNew = !editing?.id;

  const saveRow = async (table, row, stateList, setList, mapFn) => {
    setSaving(true);
    if (isNew) {
      const { data, error } = await sb.from(table).insert(row).select().single();
      if (error) { notify("Erro: " + error.message); setSaving(false); return; }
      setList([...stateList, mapFn ? mapFn(data) : data]);
    } else {
      const { error } = await sb.from(table).update(row).eq("id", row.id);
      if (error) { notify("Erro: " + error.message); setSaving(false); return; }
      setList(stateList.map((r) => r.id === row.id ? (mapFn ? mapFn({ ...r, ...row }) : { ...r, ...row }) : r));
    }
    notify(isNew ? "Criado!" : "Atualizado!");
    setSaving(false);
    setEditing(null);
    setFormData({});
  };

  const deleteRows = async (table, ids, stateList, setList) => {
    const { error } = await sb.from(table).delete().in("id", ids);
    if (error) { notify("Erro: " + error.message); setDeleting(null); return; }
    setList(stateList.filter((r) => !ids.includes(r.id)));
    notify(`${ids.length} item(s) excluído(s).`);
    setDeleting(null);
    clearSel();
  };

  const mapMember  = (m) => ({ id: m.id, name: m.name, firstName: m.first_name || m.firstName || '', lastName: m.last_name || m.lastName || '', badgeName: m.badge_name || m.badgeName, gender: m.gender, category: m.category, church: m.church, role: m.role || "", familyId: m.family_id || m.familyId, gaId: m.ga_id || m.gaId, allergies: m.allergies || '', specialNeeds: m.special_needs || m.specialNeeds || '', notes: m.notes || '' });
  const mapFamily  = (f) => ({ id: f.id, name: f.name, memberIds: f.member_ids || f.memberIds || [] });
  const mapGA      = (g) => ({ id: g.id, name: g.name, church: g.church, leaderId: g.leader_id || g.leaderId, description: g.description || "" });
  const mapRoster  = (r) => ({ id: r.id, eventId: r.event_id || r.eventId, team: r.team, leaderId: r.leader_id || r.leaderId, memberIds: r.member_ids || r.memberIds || [] });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 22, fontWeight: 700 }}>Diretório</h2>
      </div>
      <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 16 }}>Visualize e edite todos os dados de referência do sistema.</p>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {TABS.map((tb) => (
          <button key={tb.id} className={`btn btn-sm ${tab === tb.id ? "btn-primary" : "btn-ghost"}`} onClick={() => switchTab(tb.id)}>
            {tb.label} <span style={{ opacity: .65, fontWeight: 400, marginLeft: 4 }}>({tb.count ?? 0})</span>
          </button>
        ))}
      </div>

      <div className="sb" style={{ marginBottom: 14, maxWidth: 340 }}>
        <span className="si-icon" style={{ fontSize: 14 }}>🔍</span>
        <input value={search} onChange={(e) => { setSearch(e.target.value); setEditing(null); setSelected([]); }} placeholder="Buscar…" />
        {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><X size={14} /></button>}
      </div>

      {/* ── Churches ─────────────────────────────────────────────────────── */}
      {tab === "churches" && (() => {
        const list = (churches || []).filter((c) =>
          (c.display ||norm( "")).includes(norm(search))
        );
        const allIds = list.map((c) => c.id).filter(Boolean);
        return (
          <>
            {editing !== null && (
              <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && setEditing(null)}>
                <div className="modal" style={{ maxWidth: 500 }}>
                  <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, marginBottom: 18 }}>{isNew ? "Nova Igreja" : "Editar Igreja"}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div><label>Display (rótulo curto) *</label><input value={formData.display || ""} onChange={(e) => setFormData({ ...formData, display: e.target.value })} placeholder="Newark, NJ" /></div>
                    <div className="fr">
                      <div><label>Cidade *</label><input value={formData.city || ""} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Newark" /></div>
                      <div><label>Estado / Sigla *</label><input value={formData.stateCode || ""} onChange={(e) => setFormData({ ...formData, stateCode: e.target.value.toUpperCase().slice(0, 3) })} placeholder="NJ" maxLength={3} /></div>
                    </div>
                    <div><label>Nome do Estado</label><input value={formData.stateName || ""} onChange={(e) => setFormData({ ...formData, stateName: e.target.value })} placeholder="New Jersey" /></div>
                    <div className="fr">
                      <div><label>Código do País *</label>
                        <select value={formData.countryCode || "EUA"} onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}>
                          <option value="EUA">EUA — Estados Unidos</option>
                          <option value="CAN">CAN — Canadá</option>
                          <option value="BRA">BRA — Brasil</option>
                        </select>
                      </div>
                      <div><label>País (nome completo)</label><input value={formData.country || ""} onChange={(e) => setFormData({ ...formData, country: e.target.value })} placeholder="United States" /></div>
                    </div>
                    <div>
                      <label>Endereço</label>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input value={formData.address || ""} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="123 Main St" />
                        {(formData.address || formData.display) && (
                          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.address || formData.display)}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ whiteSpace: "nowrap" }}>🗺 Maps</a>
                        )}
                      </div>
                    </div>
                    <div><label>Nome da Congregação</label><input value={formData.churchName || ""} onChange={(e) => setFormData({ ...formData, churchName: e.target.value })} placeholder="ICM Newark" /></div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                    <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditing(null)}>Cancelar</button>
                    <button className="btn btn-primary" style={{ flex: 2 }} disabled={saving} onClick={() => {
                      if (!formData.display?.trim()) { notify("Display obrigatório."); return; }
                      if (!formData.city?.trim())    { notify("Cidade obrigatória."); return; }
                      if (!formData.stateCode?.trim()) { notify("Sigla do estado obrigatória."); return; }
                      const row = {
                        display:      formData.display.trim(),
                        code:         formData.countryCode || "EUA",
                        city:         formData.city.trim(),
                        state_code:   formData.stateCode.trim(),
                        state_name:   formData.stateName?.trim()  || null,
                        country_code: formData.countryCode || "EUA",
                        country:      formData.country?.trim()    || null,
                        address:      formData.address?.trim()    || null,
                        church_name:  formData.churchName?.trim() || null,
                      };
                      if (!isNew) row.id = editing.id;
                      saveRow("churches", row, churches, setChurches, null);
                    }}>{saving ? "Salvando…" : "Salvar"}</button>
                  </div>
                </div>
              </div>
            )}
            {deleting && <ConfirmDelete label={deleting.label} count={deleting.ids.length}
              onCancel={() => setDeleting(null)}
              onConfirm={() => deleteRows("churches", deleting.ids, churches, setChurches)} />}

            {selected.length > 0 && (
              <BulkBar selected={selected.length} total={allIds.length} label="igrejas"
                onSelectAll={() => selAll(allIds)} onClearAll={clearSel}
                onDeleteSelected={() => setDeleting({ ids: selected, label: "" })} />
            )}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>
                      <input type="checkbox" checked={allIds.length > 0 && allIds.every((id) => selected.includes(id))}
                        onChange={(e) => e.target.checked ? selAll(allIds) : clearSel()} />
                    </th>
                    <th>Display</th><th>Cidade</th><th style={{ width: 55 }}>Estado</th><th style={{ width: 70 }}>País</th><th style={{ width: 110 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.id || c.display} style={{ background: c.id && selected.includes(c.id) ? "var(--sidebar-active-bg)" : "" }}>
                      <td><input type="checkbox" disabled={!c.id} checked={!!(c.id && selected.includes(c.id))} onChange={() => c.id && toggleSel(c.id)} /></td>
                      <td style={{ fontWeight: 500 }}>{c.display}</td>
                      <td style={{ fontSize: 12 }}>{c.city || "—"}</td>
                      <td><span className="badge badge-gray">{c.state_code || c.stateCode || "—"}</span></td>
                      <td><span className="badge badge-blue">{c.country_code || c.code || "—"}</span></td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address || c.display)}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-xs" title="Ver no Maps">🗺</a>
                          <button className="btn btn-ghost btn-xs" onClick={() => openEdit(c, { display: c.display, city: c.city || "", stateCode: c.state_code || "", stateName: c.state_name || "", countryCode: c.country_code || c.code || "EUA", country: c.country || "", address: c.address || "", churchName: c.church_name || "" })}><Pencil size={12} /></button>
                          {c.id && <button className="btn btn-danger btn-xs" onClick={() => setDeleting({ ids: [c.id], label: c.display })}><Trash2 size={12} /></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {list.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--muted)", padding: 20 }}>Nenhum resultado.</td></tr>}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={() => openNew({ display: "", city: "", stateCode: "", stateName: "", countryCode: "EUA", country: "", address: "", churchName: "" })}><Plus size={14} /> Nova Igreja</button>
              {(churches || []).filter((c) => c.id).length > 0 && (
                <button className="btn btn-danger btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}
                  onClick={() => setDeleting({ ids: (churches || []).map((c) => c.id).filter(Boolean), label: "" })}>
                  <Trash2 size={13} /> Excluir TODAS ({(churches || []).filter((c) => c.id).length})
                </button>
              )}
            </div>
          </>
        );
      })()}

      {/* ── Members ──────────────────────────────────────────────────────── */}
      {tab === "members" && (() => {
        const list = (members || []).filter((m) =>
          (m.name ||norm( "")).includes(norm(search)) ||
          (m.church ||norm( "")).includes(norm(search))
        );
        const allIds = list.map((m) => m.id).filter(Boolean);
        return (
          <>
            {editing !== null && (
              <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && setEditing(null)}>
                <div className="modal" style={{ maxWidth: 520 }}>
                  <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, marginBottom: 18 }}>{isNew ? "Novo Membro" : "Editar Membro"}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div className="fr">
                      <div><label>Primeiro Nome *</label><input value={formData.firstName || ""} onChange={(e) => { const fn = e.target.value; setFormData((p) => ({ ...p, firstName: fn, name: (fn + ' ' + (p.lastName || '')).trim() })); }} /></div>
                      <div><label>Sobrenome *</label><input value={formData.lastName || ""} onChange={(e) => { const ln = e.target.value; setFormData((p) => ({ ...p, lastName: ln, name: ((p.firstName || '') + ' ' + ln).trim() })); }} /></div>
                    </div>
                    <div className="fr">
                      <div><label>Nome completo</label><input value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                      <div><label>Nome no Crachá</label><input value={formData.badgeName || ""} onChange={(e) => setFormData({ ...formData, badgeName: e.target.value })} /></div>
                    </div>
                    <div className="fr">
                      <div><label>Gênero</label>
                        <select value={formData.gender || "M"} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                          <option value="M">Masculino</option><option value="F">Feminino</option>
                        </select>
                      </div>
                      <div><label>Categoria</label>
                        <select value={formData.category || "Adulto"} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div><label>Igreja</label><input value={formData.church || ""} onChange={(e) => setFormData({ ...formData, church: e.target.value })} placeholder="Newark, NJ - EUA" /></div>
                    <div className="fr">
                      <div><label>Função</label>
                        <select value={formData.role || ""} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                          <option value="">—</option>
                          {ROLE_GROUPS.map((g) => (
                            <optgroup key={g.group} label={g.group}>
                              {g.roles.map((r) => <option key={r} value={r}>{r}</option>)}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label>GA (Grupo de Assistência)</label>
                        <SearchSelect
                          value={formData.gaId || ""}
                          onSelect={(v) => setFormData({ ...formData, gaId: v })}
                          items={gas || []}
                          getLabel={(g) => g.name}
                          getId={(g) => g.id}
                          placeholder="Buscar GA…"
                        />
                      </div>
                    </div>
                    <div>
                      <label>Família</label>
                      <SearchSelect
                        value={formData.familyId || ""}
                        onSelect={(v) => setFormData({ ...formData, familyId: v })}
                        items={families || []}
                        getLabel={(f) => f.name}
                        getId={(f) => f.id}
                        placeholder="Buscar família…"
                      />
                    </div>
                    <div><label>Alergias</label><textarea rows={2} value={formData.allergies || ""} onChange={(e) => setFormData({ ...formData, allergies: e.target.value })} placeholder="Ex: amendoim, látex…" style={{ resize: "vertical" }} /></div>
                    <div><label>Necessidades Especiais</label><textarea rows={2} value={formData.specialNeeds || ""} onChange={(e) => setFormData({ ...formData, specialNeeds: e.target.value })} placeholder="Ex: cadeira de rodas…" style={{ resize: "vertical" }} /></div>
                    <div><label>Notas</label><textarea rows={2} value={formData.notes || ""} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} style={{ resize: "vertical" }} /></div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                    <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditing(null)}>Cancelar</button>
                    <button className="btn btn-primary" style={{ flex: 2 }} disabled={saving} onClick={() => {
                      if (!formData.name?.trim() && !formData.firstName?.trim()) { notify("Nome obrigatório."); return; }
                      const fullName = formData.name?.trim() || ((formData.firstName || '') + ' ' + (formData.lastName || '')).trim();
                      const row = { name: fullName, first_name: formData.firstName || null, last_name: formData.lastName || null, badge_name: formData.badgeName || fullName, gender: formData.gender || "M", category: formData.category || "Adulto", church: formData.church || "", role: formData.role || "", family_id: formData.familyId || null, ga_id: formData.gaId || null, allergies: formData.allergies || null, special_needs: formData.specialNeeds || null, notes: formData.notes || null };
                      if (!isNew) row.id = editing.id;
                      saveRow("members", row, members, setMembers, mapMember);
                    }}>{saving ? "Salvando…" : "Salvar"}</button>
                  </div>
                </div>
              </div>
            )}
            {deleting && <ConfirmDelete label={deleting.label} count={deleting.ids.length}
              onCancel={() => setDeleting(null)}
              onConfirm={() => deleteRows("members", deleting.ids, members, setMembers)} />}

            {selected.length > 0 && (
              <BulkBar selected={selected.length} total={allIds.length} label="membros"
                onSelectAll={() => selAll(allIds)} onClearAll={clearSel}
                onDeleteSelected={() => setDeleting({ ids: selected, label: "" })} />
            )}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table className="table" style={{ minWidth: 640 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}>
                        <input type="checkbox" checked={allIds.length > 0 && allIds.every((id) => selected.includes(id))}
                          onChange={(e) => e.target.checked ? selAll(allIds) : clearSel()} />
                      </th>
                      <th>Nome</th><th>Crachá</th><th style={{ width: 55 }}>Gên.</th><th>Categoria</th><th>Igreja</th><th>Função</th><th>Notas</th><th style={{ width: 90 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((m) => (
                      <tr key={m.id} style={{ background: selected.includes(m.id) ? "var(--sidebar-active-bg)" : "" }}>
                        <td><input type="checkbox" checked={selected.includes(m.id)} onChange={() => toggleSel(m.id)} /></td>
                        <td style={{ fontWeight: 500 }}>{(m.firstName && m.lastName) ? `${m.firstName} ${m.lastName}` : m.name}</td>
                        <td style={{ color: "var(--muted)", fontSize: 12 }}>{m.badgeName}</td>
                        <td><span className="badge badge-gray">{m.gender}</span></td>
                        <td><span className="badge badge-blue">{m.category}</span></td>
                        <td style={{ fontSize: 12 }}>{m.church}</td>
                        <td style={{ fontSize: 12 }}>{m.role || <span style={{ color: "var(--muted)" }}>—</span>}</td>
                        <td style={{ fontSize: 11, color: "var(--muted)", maxWidth: 160 }}>{m.notes ? m.notes.slice(0, 40) + (m.notes.length > 40 ? '…' : '') : '—'}</td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="btn btn-ghost btn-xs" onClick={() => openEdit(m, { firstName: m.firstName || '', lastName: m.lastName || '', name: m.name, badgeName: m.badgeName || "", gender: m.gender || "M", category: m.category, church: m.church || "", role: m.role || "", familyId: m.familyId || "", gaId: m.gaId || "", allergies: m.allergies || '', specialNeeds: m.specialNeeds || '', notes: m.notes || '' })}><Pencil size={12} /></button>
                            <button className="btn btn-danger btn-xs" onClick={() => setDeleting({ ids: [m.id], label: m.name })}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {list.length === 0 && <tr><td colSpan={9} style={{ textAlign: "center", color: "var(--muted)", padding: 20 }}>Nenhum resultado.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={() => openNew({ firstName: "", lastName: "", name: "", badgeName: "", gender: "M", category: "Adulto", church: "", role: "", familyId: "", gaId: "", allergies: "", specialNeeds: "", notes: "" })}><Plus size={14} /> Novo Membro</button>
              {(members || []).length > 0 && (
                <button className="btn btn-danger btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}
                  onClick={() => setDeleting({ ids: (members || []).map((m) => m.id).filter(Boolean), label: "" })}>
                  <Trash2 size={13} /> Excluir TODOS ({(members || []).length})
                </button>
              )}
            </div>
          </>
        );
      })()}

      {/* ── Families ─────────────────────────────────────────────────────── */}
      {tab === "families" && (() => {
        const list = (families || []).filter((f) =>
          (f.name ||norm( "")).includes(norm(search))
        );
        const allIds = list.map((f) => f.id).filter(Boolean);
        return (
          <>
            {editing !== null && (
              <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && setEditing(null)}>
                <div className="modal" style={{ maxWidth: 440 }}>
                  <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, marginBottom: 18 }}>{isNew ? "Nova Família" : "Editar Família"}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div><label>Nome *</label><input value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Família Silva" /></div>
                    <div><label>IDs dos Membros (separados por vírgula)</label><input value={formData.memberIds || ""} onChange={(e) => setFormData({ ...formData, memberIds: e.target.value })} placeholder="M001, M002, M003" /></div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                    <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditing(null)}>Cancelar</button>
                    <button className="btn btn-primary" style={{ flex: 2 }} disabled={saving} onClick={() => {
                      if (!formData.name?.trim()) { notify("Nome obrigatório."); return; }
                      const ids = (formData.memberIds || "").split(",").map((s) => s.trim()).filter(Boolean);
                      const row = { name: formData.name.trim(), member_ids: ids };
                      if (!isNew) row.id = editing.id;
                      saveRow("families", row, families, setFamilies, mapFamily);
                    }}>{saving ? "Salvando…" : "Salvar"}</button>
                  </div>
                </div>
              </div>
            )}
            {deleting && <ConfirmDelete label={deleting.label} count={deleting.ids.length}
              onCancel={() => setDeleting(null)}
              onConfirm={() => deleteRows("families", deleting.ids, families, setFamilies)} />}

            {selected.length > 0 && (
              <BulkBar selected={selected.length} total={allIds.length} label="famílias"
                onSelectAll={() => selAll(allIds)} onClearAll={clearSel}
                onDeleteSelected={() => setDeleting({ ids: selected, label: "" })} />
            )}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>
                      <input type="checkbox" checked={allIds.length > 0 && allIds.every((id) => selected.includes(id))}
                        onChange={(e) => e.target.checked ? selAll(allIds) : clearSel()} />
                    </th>
                    <th>Nome</th><th>Membros</th><th style={{ width: 90 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((f) => (
                    <tr key={f.id} style={{ background: selected.includes(f.id) ? "var(--sidebar-active-bg)" : "" }}>
                      <td><input type="checkbox" checked={selected.includes(f.id)} onChange={() => toggleSel(f.id)} /></td>
                      <td style={{ fontWeight: 500 }}>{f.name}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          {(f.memberIds || []).slice(0, expanded === f.id ? undefined : 3).map((mid) => {
                            const m = (members || []).find((x) => x.id === mid);
                            return <span key={mid} className="badge badge-gray">{m ? m.name : mid}</span>;
                          })}
                          {(f.memberIds || []).length > 3 && (
                            <button onClick={() => setExpanded(expanded === f.id ? null : f.id)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontSize: 12, padding: 0 }}>
                              {expanded === f.id ? <ChevronUp size={14} /> : `+${(f.memberIds || []).length - 3} mais`}
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-ghost btn-xs" onClick={() => openEdit(f, { name: f.name, memberIds: (f.memberIds || []).join(", ") })}><Pencil size={12} /></button>
                          <button className="btn btn-danger btn-xs" onClick={() => setDeleting({ ids: [f.id], label: f.name })}><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {list.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--muted)", padding: 20 }}>Nenhum resultado.</td></tr>}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={() => openNew({ name: "", memberIds: "" })}><Plus size={14} /> Nova Família</button>
              {(families || []).length > 0 && (
                <button className="btn btn-danger btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}
                  onClick={() => setDeleting({ ids: (families || []).map((f) => f.id).filter(Boolean), label: "" })}>
                  <Trash2 size={13} /> Excluir TODAS ({(families || []).length})
                </button>
              )}
            </div>
          </>
        );
      })()}

      {/* ── GA Groups ────────────────────────────────────────────────────── */}
      {tab === "groups" && (() => {
        const list = (gas || []).filter((g) =>
          (g.name ||norm( "")).includes(norm(search)) ||
          (g.church ||norm( "")).includes(norm(search))
        );
        const allIds = list.map((g) => g.id).filter(Boolean);
        return (
          <>
            {editing !== null && (
              <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && setEditing(null)}>
                <div className="modal" style={{ maxWidth: 460 }}>
                  <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, marginBottom: 18 }}>{isNew ? "Novo Grupo" : "Editar Grupo"}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div><label>Nome *</label><input value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                    <div><label>Igreja</label><input value={formData.church || ""} onChange={(e) => setFormData({ ...formData, church: e.target.value })} placeholder="Newark, NJ - EUA" /></div>
                    <div>
                      <label>Líder</label>
                      <SearchSelect
                        value={formData.leaderId || ""}
                        onSelect={(v) => setFormData({ ...formData, leaderId: v })}
                        items={members || []}
                        getLabel={(m) => m.name}
                        getId={(m) => m.id}
                        placeholder="Buscar membro…"
                      />
                    </div>
                    <div><label>Descrição</label><input value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                    <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditing(null)}>Cancelar</button>
                    <button className="btn btn-primary" style={{ flex: 2 }} disabled={saving} onClick={() => {
                      if (!formData.name?.trim()) { notify("Nome obrigatório."); return; }
                      const row = { name: formData.name.trim(), church: formData.church || "", leader_id: formData.leaderId || null, description: formData.description || "" };
                      if (!isNew) row.id = editing.id;
                      saveRow("assistance_groups", row, gas, setGas, mapGA);
                    }}>{saving ? "Salvando…" : "Salvar"}</button>
                  </div>
                </div>
              </div>
            )}
            {deleting && <ConfirmDelete label={deleting.label} count={deleting.ids.length}
              onCancel={() => setDeleting(null)}
              onConfirm={() => deleteRows("assistance_groups", deleting.ids, gas, setGas)} />}

            {selected.length > 0 && (
              <BulkBar selected={selected.length} total={allIds.length} label="grupos"
                onSelectAll={() => selAll(allIds)} onClearAll={clearSel}
                onDeleteSelected={() => setDeleting({ ids: selected, label: "" })} />
            )}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>
                      <input type="checkbox" checked={allIds.length > 0 && allIds.every((id) => selected.includes(id))}
                        onChange={(e) => e.target.checked ? selAll(allIds) : clearSel()} />
                    </th>
                    <th>Nome</th><th>Igreja</th><th>Líder</th><th style={{ width: 90 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((g) => {
                    const leader = (members || []).find((m) => m.id === g.leaderId);
                    return (
                      <tr key={g.id} style={{ background: selected.includes(g.id) ? "var(--sidebar-active-bg)" : "" }}>
                        <td><input type="checkbox" checked={selected.includes(g.id)} onChange={() => toggleSel(g.id)} /></td>
                        <td style={{ fontWeight: 500 }}>{g.name}</td>
                        <td style={{ fontSize: 12 }}>{g.church}</td>
                        <td style={{ fontSize: 13 }}>{leader ? leader.name : (g.leaderId || <span style={{ color: "var(--muted)" }}>—</span>)}</td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="btn btn-ghost btn-xs" onClick={() => openEdit(g, { name: g.name, church: g.church || "", leaderId: g.leaderId || "", description: g.description || "" })}><Pencil size={12} /></button>
                            <button className="btn btn-danger btn-xs" onClick={() => setDeleting({ ids: [g.id], label: g.name })}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {list.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--muted)", padding: 20 }}>Nenhum resultado.</td></tr>}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={() => openNew({ name: "", church: "", leaderId: "", description: "" })}><Plus size={14} /> Novo Grupo</button>
              {(gas || []).length > 0 && (
                <button className="btn btn-danger btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}
                  onClick={() => setDeleting({ ids: (gas || []).map((g) => g.id).filter(Boolean), label: "" })}>
                  <Trash2 size={13} /> Excluir TODOS ({(gas || []).length})
                </button>
              )}
            </div>
          </>
        );
      })()}

      {/* ── Teams Domain ─────────────────────────────────────────────────── */}
      {tab === "teams_dir" && (() => {
        const list = (dbTeams || []).filter((t) => norm(t.name).includes(norm(search)));
        const allIds = list.map((t) => t.id).filter(Boolean);
        const mapTeamRow = (t) => ({
          id: t.id, name: t.name,
          sortOrder: t.sort_order ?? t.sortOrder ?? 0,
          isService: t.is_service ?? t.isService ?? true,
          description: t.description || "",
          leaderId: t.leader_id ?? t.leaderId ?? null,
          responsibilities: t.responsibilities || "",
        });
        return (
          <>
            {editing !== null && (
              <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && setEditing(null)}>
                <div className="modal" style={{ maxWidth: 500 }}>
                  <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, marginBottom: 18 }}>
                    {isNew ? "Nova Equipe" : "Editar Equipe"}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Name + order */}
                    <div className="fr">
                      <div><label>Nome *</label><input value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                      <div><label>Ordem</label><input type="number" value={formData.sortOrder ?? 0} onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })} /></div>
                    </div>
                    {/* Service flag */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input type="checkbox" id="is-service" checked={!!formData.isService} onChange={(e) => setFormData({ ...formData, isService: e.target.checked })} />
                      <label htmlFor="is-service" style={{ margin: 0, cursor: "pointer", fontSize: 13, fontWeight: 500, textTransform: "none", letterSpacing: 0, color: "var(--text)" }}>
                        Equipe de serviço (aparece em rosters e isenções)
                      </label>
                    </div>
                    {/* Description */}
                    <div>
                      <label>Descrição</label>
                      <textarea rows={2} value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="O que esta equipe faz..." />
                    </div>
                    {/* Leader */}
                    <div>
                      <label>Líder da Equipe</label>
                      <SearchSelect
                        value={formData.leaderId || ""}
                        onSelect={(id) => setFormData({ ...formData, leaderId: id })}
                        items={members || []}
                        getLabel={(m) => m?.name || ""}
                        getId={(m) => m?.id || ""}
                        placeholder="Buscar membro..."
                      />
                      {formData.leaderId && (
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>ID: {formData.leaderId}</div>
                      )}
                    </div>
                    {/* Responsibilities */}
                    <div>
                      <label>Responsabilidades</label>
                      <textarea rows={3} value={formData.responsibilities || ""} onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                        placeholder="Ex: Preparar o salão, limpar após o evento..." />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                    <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditing(null)}>Cancelar</button>
                    <button className="btn btn-primary" style={{ flex: 2 }} disabled={saving} onClick={() => {
                      if (!formData.name?.trim()) { notify("Nome obrigatório."); return; }
                      const row = {
                        name: formData.name.trim(),
                        sort_order: formData.sortOrder ?? 0,
                        is_service: !!formData.isService,
                        description: formData.description || null,
                        leader_id: formData.leaderId || null,
                        responsibilities: formData.responsibilities || null,
                      };
                      if (!isNew) row.id = editing.id;
                      saveRow("teams", row, dbTeams, setDbTeams, mapTeamRow);
                    }}>{saving ? "Salvando…" : "Salvar"}</button>
                  </div>
                </div>
              </div>
            )}
            {deleting && <ConfirmDelete label={deleting.label} count={deleting.ids.length}
              onCancel={() => setDeleting(null)}
              onConfirm={() => deleteRows("teams", deleting.ids, dbTeams, setDbTeams)} />}

            {selected.length > 0 && (
              <BulkBar selected={selected.length} total={allIds.length} label="equipes"
                onSelectAll={() => selAll(allIds)} onClearAll={clearSel}
                onDeleteSelected={() => setDeleting({ ids: selected, label: "" })} />
            )}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table className="table" style={{ minWidth: 560 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}>
                        <input type="checkbox" checked={allIds.length > 0 && allIds.every((id) => selected.includes(id))}
                          onChange={(e) => e.target.checked ? selAll(allIds) : clearSel()} />
                      </th>
                      <th>Nome</th>
                      <th>Líder</th>
                      <th>Descrição</th>
                      <th style={{ width: 80 }}>Serviço</th>
                      <th style={{ width: 90 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((t) => {
                      const leader = (members || []).find((m) => m.id === t.leaderId);
                      return (
                        <tr key={t.id} style={{ background: t.id && selected.includes(t.id) ? "var(--sidebar-active-bg)" : "" }}>
                          <td><input type="checkbox" checked={!!(t.id && selected.includes(t.id))} onChange={() => t.id && toggleSel(t.id)} /></td>
                          <td style={{ fontWeight: 600 }}>{t.name}</td>
                          <td style={{ fontSize: 12 }}>{leader ? leader.name : (t.leaderId ? <span style={{ color: "var(--muted)" }}>{t.leaderId}</span> : <span style={{ color: "var(--muted)" }}>—</span>)}</td>
                          <td style={{ fontSize: 12, color: "var(--muted)", maxWidth: 200 }}>
                            {t.description ? t.description.slice(0, 60) + (t.description.length > 60 ? "…" : "") : "—"}
                          </td>
                          <td>{t.isService ? <span className="badge badge-green">Sim</span> : <span className="badge badge-gray">Não</span>}</td>
                          <td>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button className="btn btn-ghost btn-xs" onClick={() => openEdit(t, {
                                name: t.name, sortOrder: t.sortOrder ?? 0, isService: t.isService ?? true,
                                description: t.description || "", leaderId: t.leaderId || null,
                                responsibilities: t.responsibilities || "",
                              })}><Pencil size={12} /></button>
                              {t.id && <button className="btn btn-danger btn-xs" onClick={() => setDeleting({ ids: [t.id], label: t.name })}><Trash2 size={12} /></button>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {list.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: 20 }}>
                      Nenhum resultado. Execute a migration 002 no Supabase SQL Editor.
                    </td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}
                onClick={() => openNew({ name: "", sortOrder: (dbTeams || []).length, isService: true, description: "", leaderId: null, responsibilities: "" })}>
                <Plus size={14} /> Nova Equipe
              </button>
            </div>
          </>
        );
      })()}

      {/* ── Teams / Rosters ──────────────────────────────────────────────── */}
      {tab === "teams" && (() => {
        const list = (rosters || []).filter((r) =>
          (r.team ||norm( "")).includes(norm(search))
        );
        const allIds = list.map((r) => r.id).filter(Boolean);
        return (
          <>
            {editing !== null && (
              <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && setEditing(null)}>
                <div className="modal" style={{ maxWidth: 460 }}>
                  <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, marginBottom: 18 }}>{isNew ? "Nova Equipe" : "Editar Equipe"}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div><label>Evento ID *</label><input value={formData.eventId || ""} onChange={(e) => setFormData({ ...formData, eventId: e.target.value })} placeholder="EVT001" /></div>
                    <div><label>Equipe *</label>
                      <select value={formData.team || TEAMS[1]} onChange={(e) => setFormData({ ...formData, team: e.target.value })}>
                        {TEAMS.filter((t) => t !== "Participante").map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label>Líder da Equipe</label>
                      <SearchSelect
                        value={formData.leaderId || ""}
                        onSelect={(v) => setFormData({ ...formData, leaderId: v })}
                        items={members || []}
                        getLabel={(m) => m.name}
                        getId={(m) => m.id}
                        placeholder="Buscar líder…"
                      />
                    </div>
                    <div><label>IDs dos Membros (separados por vírgula)</label><input value={formData.memberIds || ""} onChange={(e) => setFormData({ ...formData, memberIds: e.target.value })} placeholder="M001, M002" /></div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                    <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditing(null)}>Cancelar</button>
                    <button className="btn btn-primary" style={{ flex: 2 }} disabled={saving} onClick={() => {
                      if (!formData.eventId?.trim() || !formData.team) { notify("Evento e equipe são obrigatórios."); return; }
                      const ids = (formData.memberIds || "").split(",").map((s) => s.trim()).filter(Boolean);
                      const row = { event_id: formData.eventId.trim(), team: formData.team, leader_id: formData.leaderId || null, member_ids: ids };
                      if (!isNew) row.id = editing.id;
                      saveRow("rosters", row, rosters, setRosters, mapRoster);
                    }}>{saving ? "Salvando…" : "Salvar"}</button>
                  </div>
                </div>
              </div>
            )}
            {deleting && <ConfirmDelete label={deleting.label} count={deleting.ids.length}
              onCancel={() => setDeleting(null)}
              onConfirm={() => deleteRows("rosters", deleting.ids, rosters, setRosters)} />}

            {selected.length > 0 && (
              <BulkBar selected={selected.length} total={allIds.length} label="equipes"
                onSelectAll={() => selAll(allIds)} onClearAll={clearSel}
                onDeleteSelected={() => setDeleting({ ids: selected, label: "" })} />
            )}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>
                      <input type="checkbox" checked={allIds.length > 0 && allIds.every((id) => selected.includes(id))}
                        onChange={(e) => e.target.checked ? selAll(allIds) : clearSel()} />
                    </th>
                    <th>Equipe</th><th>Evento</th><th>Líder</th><th>Membros</th><th style={{ width: 90 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((r, i) => (
                    <tr key={r.id || i} style={{ background: r.id && selected.includes(r.id) ? "var(--sidebar-active-bg)" : "" }}>
                      <td><input type="checkbox" checked={!!(r.id && selected.includes(r.id))} onChange={() => r.id && toggleSel(r.id)} /></td>
                      <td style={{ fontWeight: 500 }}>{r.team}</td>
                      <td style={{ fontSize: 12, color: "var(--muted)" }}>{r.eventId}</td>
                      <td style={{ fontSize: 12 }}>{r.leaderId ? ((members || []).find((m) => m.id === r.leaderId)?.name || r.leaderId) : <span style={{ color: "var(--muted)" }}>—</span>}</td>
                      <td>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {(r.memberIds || []).slice(0, 4).map((mid) => {
                            const m = (members || []).find((x) => x.id === mid);
                            return <span key={mid} className="badge badge-gray" style={{ fontSize: 10 }}>{m ? m.badgeName || m.name : mid}</span>;
                          })}
                          {(r.memberIds || []).length > 4 && <span className="badge badge-gray" style={{ fontSize: 10 }}>+{(r.memberIds || []).length - 4}</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-ghost btn-xs" onClick={() => openEdit(r, { eventId: r.eventId || "", team: r.team, leaderId: r.leaderId || "", memberIds: (r.memberIds || []).join(", ") })}><Pencil size={12} /></button>
                          <button className="btn btn-danger btn-xs" onClick={() => setDeleting({ ids: [r.id], label: r.team })}><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {list.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: 20 }}>Nenhum resultado.</td></tr>}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={() => openNew({ eventId: "", team: TEAMS[1], leaderId: "", memberIds: "" })}><Plus size={14} /> Nova Equipe</button>
              {(rosters || []).length > 0 && (
                <button className="btn btn-danger btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}
                  onClick={() => setDeleting({ ids: (rosters || []).map((r) => r.id).filter(Boolean), label: "" })}>
                  <Trash2 size={13} /> Excluir TODAS ({(rosters || []).length})
                </button>
              )}
            </div>
          </>
        );
      })()}
    </div>
  );
}

export default AdminView;
