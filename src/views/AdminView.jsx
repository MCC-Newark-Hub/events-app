import { useState, useRef } from "react";
import { LayoutDashboard, ClipboardList, Users, Building2, Clock, BarChart2, Calendar, Upload, Check, Plus, FolderOpen, KeyRound, Eye, EyeOff } from "lucide-react";
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
const CSV_TEMPLATES = {
  members: { label: "Membros", filename: "template-membros.csv", headers: ["id","name","badgeName","gender","category","church","role","familyId","gaId"], example: ["M100","Silva, João Pedro","João","M","Adulto","Newark, NJ - EUA","Diácono","F005","GA001"], notes: ["id: código único (ex: M100). Deixe em branco para geração automática.","badgeName: nome exibido no crachá.","gender: M ou F.","category: 0-3, Criança, Intermediário, Adolescente, Jovem, Adulto.","church: exatamente como na lista de igrejas.","role: função SGI. Deixe em branco se Participante.","familyId: código da família. Opcional.","gaId: código do GA. Opcional."], validate: (row) => { var e=[]; if(!row.name)e.push("name obrigatório"); if(!row.badgeName)e.push("badgeName obrigatório"); if(!["M","F"].includes(row.gender))e.push("gender deve ser M ou F"); if(!["0-3","Criança","Intermediário","Adolescente","Jovem","Adulto"].includes(row.category))e.push("category inválida: "+row.category); return e; }, transform: (row,idx,existing) => { var id=row.id||"M"+String(existing.length+idx+1).padStart(3,"0"); return {id,name:row.name,badgeName:row.badgeName||row.name.split(",")[1]?.trim()||row.name,gender:row.gender,category:row.category,church:row.church||"",role:row.role||"",familyId:row.familyId||null,gaId:row.gaId||null}; } },
  families: { label: "Famílias", filename: "template-familias.csv", headers: ["id","name","memberIds"], example: ["F010","Família Silva","M100,M101,M102"], notes: ["id: código único.","name: nome da família.","memberIds: IDs separados por vírgula."], validate: (row) => { var e=[]; if(!row.name)e.push("name obrigatório"); if(!row.memberIds)e.push("memberIds obrigatório"); return e; }, transform: (row,idx,existing) => { var id=row.id||"F"+String(existing.length+idx+1).padStart(3,"0"); return {id,name:row.name,memberIds:row.memberIds?row.memberIds.split(",").map(s=>s.trim()):[]}; } },
  assistanceGroups: { label: "Grupos de Assistência", filename: "template-grupos-assistencia.csv", headers: ["id","name","church","leaderId"], example: ["GA010","GA Newark","Newark, NJ - EUA","M100"], notes: ["id: código único.","name: nome do grupo.","church: igreja do grupo.","leaderId: ID do membro líder."], validate: (row) => { var e=[]; if(!row.name)e.push("name obrigatório"); if(!row.leaderId)e.push("leaderId obrigatório"); return e; }, transform: (row,idx,existing) => { var id=row.id||"GA"+String(existing.length+idx+1).padStart(3,"0"); return {id,name:row.name,church:row.church||"",leaderId:row.leaderId}; } },
  teams: { label: "Equipes", filename: "template-equipes.csv", headers: ["eventId","team","memberIds"], example: ["EVT001","Cozinha","M100,M101"], notes: ["eventId: ID do evento.","team: nome da equipe.","memberIds: IDs separados por vírgula."], validate: (row) => { var e=[]; if(!row.eventId)e.push("eventId obrigatório"); if(!row.team)e.push("team obrigatório"); if(!row.memberIds)e.push("memberIds obrigatório"); return e; }, transform: (row) => ({eventId:row.eventId,team:row.team,memberIds:row.memberIds?row.memberIds.split(",").map(s=>s.trim()):[]}) },
  churches: { label: "Igrejas", filename: "template-igrejas.csv", headers: ["display","code"], example: ["São Paulo, SP","BRA"], notes: ["display: cidade e estado.","code: EUA, CAN ou BRA."], validate: (row) => { var e=[]; if(!row.display)e.push("display obrigatório"); if(!["EUA","CAN","BRA"].includes(row.code))e.push("code deve ser EUA, CAN ou BRA"); return e; }, transform: (row) => ({display:row.display.trim(),code:row.code.trim()}) },
};

function parseCSV(text) { var lines=text.trim().split(/\r?\n/); if(lines.length<2)return[]; var headers=lines[0].split(",").map(h=>h.trim().replace(/^"|"$/g,"")); var rows=[]; for(var i=1;i<lines.length;i++){var cells=lines[i].split(",").map(c=>c.trim().replace(/^"|"$/g,"")); if(cells.every(c=>!c))continue; var obj={}; headers.forEach((h,j)=>{obj[h]=cells[j]||"";}); rows.push(obj);} return rows; }
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
  const handleFile = (e) => { var file=e.target.files[0]; if(!file)return; var reader=new FileReader(); reader.onload=(ev)=>{ var rows=parseCSV(ev.target.result); setPreview({rows:rows.map((row,i)=>({row,errs:tpl.validate(row),idx:i})),template:activeTab}); setImportDone(null); }; reader.readAsText(file); e.target.value=""; };
  const handleImport = () => {
    if(!preview)return;
    var valid=preview.rows.filter(r=>r.errs.length===0);
    setImporting(true);
    var existing=activeTab==="members"?members:activeTab==="families"?families:activeTab==="assistanceGroups"?gas:rosters;
    var items=valid.map((r,i)=>tpl.transform(r.row,i,existing));
    var dbTable=activeTab==="members"?"members":activeTab==="families"?"families":activeTab==="assistanceGroups"?"assistance_groups":activeTab==="teams"?"rosters":"churches";
    var dbRows=items.map(item=>{
      if(activeTab==="members")return{id:item.id,name:item.name,badge_name:item.badgeName,gender:item.gender,category:item.category,church:item.church,role:item.role||"",family_id:item.familyId||null,ga_id:item.gaId||null};
      if(activeTab==="families")return{id:item.id,name:item.name};
      if(activeTab==="assistanceGroups")return{id:item.id,name:item.name,church:item.church||"",leader_id:item.leaderId||null,description:item.description||""};
      if(activeTab==="teams")return{event_id:item.eventId,team:item.team,member_ids:item.memberIds};
      if(activeTab==="churches")return{display:item.display,code:item.code,allow_custom:false};
      return item;
    });
    sb.from(dbTable).upsert(dbRows).then(res=>{
      if(res.error){console.error(res.error);notify("Erro: "+res.error.message);setImporting(false);return;}
      const updater=(set)=>set(p=>{var u=[...p];items.forEach(m=>{var i=u.findIndex(x=>x.id===m.id);if(i>=0)u[i]=m;else u.push(m);});return u;});
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

export default AdminView;
