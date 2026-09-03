import { useState, Fragment } from "react";
import { useT } from "@/i18n/strings";
import { fmt, ROLE_BADGE, CATEGORIES, deadlineStatus } from "@/constants";

const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const byName = (a, b) => norm(a.memberName).localeCompare(norm(b.memberName));

export default function ReportsTab({ regs, event, wlRegs, exRegs, lang, members, gas, showFinancials = true, ciaOnly = false }) {
  const t = useT();
  const [type, setType] = useState(ciaOnly ? "cia" : "summary");
  const [repSearch, setRepSearch] = useState("");
  const [repCategory, setRepCategory] = useState("");
  const [repChurch, setRepChurch] = useState("");
  const [repDate, setRepDate] = useState("");
  const [repGa, setRepGa] = useState("");
  const [immChurch, setImmChurch] = useState("");
  const [immGa, setImmGa] = useState("");
  const [immDim, setImmDim] = useState("overview"); // "overview" | "church" | "ga"
  const [summaryDim, setSummaryDim] = useState("church"); // "church" | "category"
  const [ciaChurch, setCiaChurch] = useState("");
  const [ciaClassFilter, setCiaClassFilter] = useState("all");
  const [ciaCols, setCiaCols] = useState({ church: true, status: showFinancials });
  const toggleCiaCol = (col) => setCiaCols((p) => ({ ...p, [col]: !p[col] }));
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

  const CIA_CATS = [
    { cat: "0-3",             label: "0-3",              color: "#db2777" },
    { cat: "Criança",         label: "Crianças",         color: "#dc2626" },
    { cat: "Intermediário",   label: "Intermediários",   color: "#2563eb" },
    { cat: "Adolescente",     label: "Adolescentes",     color: "#ca8a04" },
    { cat: "Acessibilidade",  label: "Acessibilidade",   color: "#0891b2" },
  ];
  const baseCiaCats = CIA_CATS.map((c) => c.cat);
  const ciaClassOf = (r) => r.ciaClassOverride || r.category;
  const ciaAll = er.filter((r) => baseCiaCats.includes(r.category) || r.acessibilidade);
  const ciaChurches = [...new Set(ciaAll.map((r) => {
    const live = (members || []).find((m) => m.id === r.memberId)?.church || r.church;
    return (!live || live === "Sem Igreja") ? "Outra / Não Listada" : live;
  }).filter(Boolean))].sort();
  const ciaFiltered = ciaAll.filter((r) => {
    if (!ciaChurch) return true;
    const live = (members || []).find((m) => m.id === r.memberId)?.church || r.church;
    const ch = (!live || live === "Sem Igreja") ? "Outra / Não Listada" : live;
    return ch === ciaChurch;
  });

  const gaNameOf = (r) => {
    const gaId = (members || []).find((m) => m.id === r.memberId)?.gaId;
    return gaId ? ((gas || []).find((g) => g.id === gaId)?.name || "") : "";
  };

  const liveChurch = (r) => {
    const live = (members || []).find((m) => m.id === r.memberId)?.church || r.church;
    return (!live || live === "Sem Igreja") ? "Outra / Não Listada" : live;
  };

  const applyReportFilters = (rows) => rows.filter((r) => {
    const q = norm(repSearch);
    return (!q || norm(r.memberName).includes(q)) &&
      (!repCategory || r.category === repCategory) &&
      (!repChurch || liveChurch(r) === repChurch) &&
      (!repGa || gaNameOf(r) === repGa) &&
      (!repDate || r.registeredAt === repDate);
  });
  const reportFilterPool = [...er, ...(wl || [])];
  const reportCategories = [...new Set(reportFilterPool.map((r) => r.category).filter(Boolean))].sort();
  const reportChurches = [...new Set(reportFilterPool.map(liveChurch).filter(Boolean))].sort();
  const reportGas = [...new Set(pend.map(gaNameOf).filter(Boolean))].sort();
  const reportDates = [...new Set(reportFilterPool.map((r) => r.registeredAt).filter(Boolean))].sort();

  const wlWithPos = wl.map((r, i) => ({ ...r, wlPosition: i + 1 }));
  const wlPend = wlWithPos.filter((r) => !r.paid && !r.exempt);
  const pendView = applyReportFilters(pend).sort(byName);
  const wlPendView = applyReportFilters(wlPend).sort((a, b) => a.wlPosition - b.wlPosition);
  // Paid waitlisters shown first (priority), then remaining by queue position
  const wlView = applyReportFilters(wlWithPos).sort((a, b) => {
    if (a.paid && !b.paid) return -1;
    if (!a.paid && b.paid) return 1;
    return a.wlPosition - b.wlPosition;
  });
  const erView = applyReportFilters(er).sort(byName);
  const expiringView = applyReportFilters(expiring).sort(byName);
  const cancelledNonpaymentView = applyReportFilters(cancelledNonpayment).sort(byName);

  const churchKey = liveChurch;
  const groupStats = (rows, field) => {
    const keys = field === "category"
      ? CATEGORIES.filter((c) => rows.some((r) => r.category === c))
      : [...new Set(rows.map(churchKey))];
    const groups = keys.map((key) => {
      const subset = field === "church"
        ? rows.filter((r) => churchKey(r) === key)
        : rows.filter((r) => r[field] === key);
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

  const printReport = () => {
    const eventName = event?.name || "Evento";
    const now = new Date().toLocaleDateString("pt-BR");
    const filterInfo = [
      repSearch && `Nome: "${repSearch}"`,
      repCategory && `Categoria: ${repCategory}`,
      repChurch && `Igreja: ${repChurch}`,
      repGa && `Grupo: ${repGa}`,
      repDate && `Data: ${repDate}`,
    ].filter(Boolean).join(" · ");

    const S = {
      table: "border-collapse:collapse;width:100%;font-size:12px;",
      th: "background:#8B0000;color:#fff;padding:7px 10px;text-align:left;font-weight:600;font-size:11px;white-space:nowrap;",
      td: "padding:6px 10px;border-bottom:1px solid #e5e7eb;vertical-align:top;",
      tdMuted: "padding:6px 10px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:11px;",
      tdBold: "padding:6px 10px;border-bottom:1px solid #e5e7eb;font-weight:600;",
      foot: "padding:7px 10px;border-top:2px solid #e5e7eb;font-weight:700;background:#f3f4f6;",
    };
    const stripe = (i) => `style="${i % 2 === 0 ? "" : "background:#f9fafb;"}">`;

    let title = "";
    let body = "";

    if (type === "summary") {
      title = summaryDim === "church" ? "Resumo por Igreja" : "Resumo por Categoria";
      const dimLabel = summaryDim === "church" ? "Igreja" : "Categoria";
      const otherLabel = otherDim === "church" ? "Igreja" : "Categoria";
      body = `
        <table style="${S.table}">
          <thead><tr>
            <th style="${S.th}">${dimLabel}</th>
            <th style="${S.th}">Total</th><th style="${S.th}">Pago</th>
            <th style="${S.th}">Pendente</th><th style="${S.th}">Isento</th>
            <th style="${S.th}">Arrecadado</th><th style="${S.th}">A receber</th>
          </tr></thead>
          <tbody>
            ${summaryGroups.map((g, i) => {
              const subs = groupStats(g.rows, otherDim);
              return `
                <tr ${stripe(i)}
                  <td style="${S.tdBold}">${g.key}</td>
                  <td style="${S.td}">${g.total}</td>
                  <td style="${S.td};color:#2d8a4e;">${g.paid}</td>
                  <td style="${S.td};color:#d4820a;">${g.pendN}</td>
                  <td style="${S.td};color:#6b7280;">${g.exempt}</td>
                  <td style="${S.td};color:#2d8a4e;">${fmt(g.coll)}</td>
                  <td style="${S.td};color:#d4820a;">${fmt(g.pendA)}</td>
                </tr>
                ${subs.map(sg => `
                  <tr style="background:#f5f5f5;">
                    <td style="${S.td};padding-left:28px;font-size:11px;color:#374151;">↳ ${sg.key}</td>
                    <td style="${S.tdMuted}">${sg.total}</td>
                    <td style="${S.tdMuted};color:#2d8a4e;">${sg.paid}</td>
                    <td style="${S.tdMuted};color:#d4820a;">${sg.pendN}</td>
                    <td style="${S.tdMuted}">${sg.exempt}</td>
                    <td style="${S.tdMuted};color:#2d8a4e;">${fmt(sg.coll)}</td>
                    <td style="${S.tdMuted};color:#d4820a;">${fmt(sg.pendA)}</td>
                  </tr>`).join("")}
              `;
            }).join("")}
            <tr>
              <td style="${S.foot}">Total</td>
              <td style="${S.foot}">${er.length}</td>
              <td style="${S.foot};color:#2d8a4e;">${er.filter(r=>r.paid).length}</td>
              <td style="${S.foot};color:#d4820a;">${pend.length}</td>
              <td style="${S.foot};color:#6b7280;">${er.filter(r=>r.exempt).length}</td>
              <td style="${S.foot};color:#2d8a4e;">${fmt(er.filter(r=>r.paid).reduce((s,r)=>s+r.fee,0))}</td>
              <td style="${S.foot};color:#d4820a;">${fmt(pend.reduce((s,r)=>s+r.fee,0))}</td>
            </tr>
          </tbody>
        </table>`;
    } else if (type === "pending") {
      title = "Pagamentos Pendentes";
      body = `
        <table style="${S.table}">
          <thead><tr>
            <th style="${S.th}">Nome</th><th style="${S.th}">Categoria</th>
            <th style="${S.th}">Igreja</th><th style="${S.th}">Grupo</th>
            <th style="${S.th}">Taxa</th><th style="${S.th}">Data</th>
          </tr></thead>
          <tbody>
            ${pendView.map((r, i) => `<tr ${stripe(i)}
              <td style="${S.tdBold}">${r.memberName}</td>
              <td style="${S.td}">${r.category}</td>
              <td style="${S.tdMuted}">${liveChurch(r)}</td>
              <td style="${S.tdMuted}">${gaNameOf(r) || "—"}</td>
              <td style="${S.td};color:#d4820a;font-weight:600;">${fmt(r.fee)}</td>
              <td style="${S.tdMuted}">${r.registeredAt}</td>
            </tr>`).join("")}
            <tr>
              <td style="${S.foot}" colspan="4">Total (${pendView.length})</td>
              <td style="${S.foot};color:#d4820a;">${fmt(pendView.reduce((s,r)=>s+r.fee,0))}</td>
              <td style="${S.foot}"></td>
            </tr>
          </tbody>
        </table>`;
    } else if (type === "waitlist") {
      title = "Lista de Espera";
      body = `
        <table style="${S.table}">
          <thead><tr>
            <th style="${S.th}">#</th><th style="${S.th}">Nome</th><th style="${S.th}">Categoria</th>
            <th style="${S.th}">Igreja</th><th style="${S.th}">Taxa</th><th style="${S.th}">Data</th>
          </tr></thead>
          <tbody>
            ${wlView.map((r, i) => `<tr ${stripe(i)}
              <td style="${S.td};font-weight:700;color:#92400e;">#${r.wlPosition}</td>
              <td style="${S.tdBold}">${r.memberName}</td>
              <td style="${S.td}">${r.category}</td>
              <td style="${S.tdMuted}">${liveChurch(r)}</td>
              <td style="${S.td}">${fmt(r.fee)}</td>
              <td style="${S.tdMuted}">${r.registeredAt}</td>
            </tr>`).join("")}
          </tbody>
        </table>`;
    } else if (type === "expiring") {
      title = "Vencendo em até 3 dias";
      body = `
        <table style="${S.table}">
          <thead><tr>
            <th style="${S.th}">Nome</th><th style="${S.th}">Categoria</th>
            <th style="${S.th}">Igreja</th><th style="${S.th}">Taxa</th><th style="${S.th}">Prazo</th>
          </tr></thead>
          <tbody>
            ${expiringView.map((r, i) => {
              const s = deadlineStatus(r, event, all);
              return `<tr ${stripe(i)}
                <td style="${S.tdBold}">${r.memberName}</td>
                <td style="${S.td}">${r.category}</td>
                <td style="${S.tdMuted}">${liveChurch(r)}</td>
                <td style="${S.td};color:#d4820a;font-weight:600;">${fmt(r.fee)}</td>
                <td style="${S.td};font-weight:600;color:${s?.urgent?"#c0392b":"#d4820a"};">${s?.label||""}</td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>`;
    } else if (type === "cancelled_nonpayment") {
      title = "Cancelados por Atraso";
      body = `
        <table style="${S.table}">
          <thead><tr>
            <th style="${S.th}">Nome</th><th style="${S.th}">Categoria</th>
            <th style="${S.th}">Igreja</th><th style="${S.th}">Taxa</th>
            <th style="${S.th}">Motivo</th><th style="${S.th}">Data</th>
          </tr></thead>
          <tbody>
            ${cancelledNonpaymentView.map((r, i) => `<tr ${stripe(i)}
              <td style="${S.tdBold}">${r.memberName}</td>
              <td style="${S.td}">${r.category}</td>
              <td style="${S.tdMuted}">${liveChurch(r)}</td>
              <td style="${S.td}">${fmt(r.fee)}</td>
              <td style="${S.tdMuted}">${r.cancelReason==="nonpayment_auto"?"Automático":"Manual"}</td>
              <td style="${S.tdMuted}">${r.registeredAt}</td>
            </tr>`).join("")}
          </tbody>
        </table>`;
    } else if (type === "roster") {
      title = "Roster Completo";
      body = `
        <table style="${S.table}">
          <thead><tr>
            <th style="${S.th}">Nº Inscrição</th><th style="${S.th}">Nome</th>
            <th style="${S.th}">Crachá</th><th style="${S.th}">Cat.</th>
            <th style="${S.th}">Igreja</th><th style="${S.th}">Equipe</th>
            <th style="${S.th}">Status</th><th style="${S.th}">Presença</th>
          </tr></thead>
          <tbody>
            ${erView.map((r, i) => `<tr ${stripe(i)}
              <td style="${S.td};font-family:monospace;font-size:10px;">${r.regNumber}</td>
              <td style="${S.tdBold}">${r.memberName}${r.excedente?" ⚡":""}</td>
              <td style="${S.tdMuted}">${r.badgeName||r.memberName}</td>
              <td style="${S.td}">${r.category}</td>
              <td style="${S.tdMuted}">${liveChurch(r)}</td>
              <td style="${S.td};font-size:11px;">${r.team||""}</td>
              <td style="${S.td}">${r.exempt?"Isento":r.paid?"✓ Pago":"Pendente"}</td>
              <td style="${S.td};font-size:16px;text-align:center;">☐</td>
            </tr>`).join("")}
          </tbody>
        </table>`;
    } else if (type === "cia") {
      const classesToPrint = ciaClassFilter === "all" ? CIA_CATS : CIA_CATS.filter((c) => c.cat === ciaClassFilter);
      title = `CIA${ciaChurch ? ` — ${ciaChurch}` : ""}${ciaClassFilter !== "all" ? ` — ${CIA_CATS.find((c) => c.cat === ciaClassFilter)?.label || ""}` : ""}`;
      const classBlocks = classesToPrint.map(({ cat, label, color }) => {
        const rows = ciaFiltered.filter((r) => ciaClassOf(r) === cat).sort((a, b) => norm(a.memberName).localeCompare(norm(b.memberName)));
        if (rows.length === 0) return "";
        const headerCells = [
          `<th style="${S.th}">#</th>`,
          `<th style="${S.th}">Nome</th>`,
          ciaCols.church ? `<th style="${S.th}">Igreja</th>` : "",
          ciaCols.status ? `<th style="${S.th}">Status</th>` : "",
          `<th style="${S.th}">Presença</th>`,
        ].join("");
        const dataCells = (r, i) => [
          `<td style="${S.tdMuted}">${i + 1}</td>`,
          `<td style="${S.tdBold}">${r.memberName}${r.acessibilidade ? " ♾" : ""}</td>`,
          ciaCols.church ? `<td style="${S.tdMuted}">${liveChurch(r)}</td>` : "",
          ciaCols.status ? `<td style="${S.td};color:${r.paid || r.exempt ? "#2d8a4e" : "#d4820a"};">${r.exempt ? "Isento" : r.paid ? "✓ Pago" : "Pendente"}</td>` : "",
          `<td style="${S.td};font-size:16px;text-align:center;">☐</td>`,
        ].join("");
        return `
          <div style="margin-bottom:28px;page-break-inside:avoid;">
            <h2 style="color:${color};font-size:14px;font-weight:700;border-bottom:2px solid ${color};padding-bottom:4px;margin-bottom:8px;">${label} — ${rows.length} inscritos · ${rows.filter((r) => r.paid || r.exempt).length} confirmados</h2>
            <table style="${S.table}">
              <thead><tr>${headerCells}</tr></thead>
              <tbody>
                ${rows.map((r, i) => `<tr ${stripe(i)} ${dataCells(r, i)}</tr>`).join("")}
              </tbody>
            </table>
          </div>`;
      }).join("");
      body = classBlocks.trim() || "<p>Nenhum inscrito encontrado.</p>";
    } else {
      window.print();
      return;
    }

    const html = `<!DOCTYPE html><html lang="pt-BR"><head>
      <meta charset="utf-8">
      <title>${title} — ${eventName}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #111; padding: 20px 24px; }
        .header { margin-bottom: 16px; border-bottom: 2px solid #8B0000; padding-bottom: 10px; }
        .header h1 { font-size: 18px; font-weight: 700; color: #8B0000; }
        .header p { font-size: 12px; color: #6b7280; margin-top: 2px; }
        .filters { font-size: 11px; color: #374151; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 4px 10px; margin-bottom: 12px; display: inline-block; }
        @media print { @page { margin: 12mm; size: A4 landscape; } body { padding: 0; } }
      </style>
    </head><body>
      <div class="header">
        <h1>📋 ${title}</h1>
        <p>${eventName} · Gerado em ${now}</p>
      </div>
      ${filterInfo ? `<div class="filters">Filtros: ${filterInfo}</div>` : ""}
      ${body}
    </body></html>`;

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
  };

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
        <button className="btn btn-ghost btn-sm" onClick={printReport}>
          {t.print}
        </button>
      </div>
      {!ciaOnly && (
        <div style={{ display: "flex", gap: 5, marginBottom: 16, flexWrap: "wrap" }}>
          {[
            [t.summaryTab, "summary"],
            ...(showFinancials ? [[t.pendPayTab, "pending"]] : []),
            [t.waitlistTab, "waitlist"],
            ...(showFinancials ? [[t.expiringTab, "expiring"], [t.cancelledNonpaymentTab, "cancelled_nonpayment"]] : []),
            [t.rosterTab, "roster"],
            [t.badgesTab, "badges"],
            ["Check-in", "checkin"],
            ["Imigração", "immigration"],
            ["CIA", "cia"],
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
      )}

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
          {type === "pending" && (
            <select value={repGa} onChange={(e) => setRepGa(e.target.value)}>
              <option value="">Todos os grupos</option>
              {reportGas.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          )}
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
                    {showFinancials && <th>{t.paid}</th>}
                    {showFinancials && <th>{t.pending}</th>}
                    {showFinancials && <th>{t.exempt}</th>}
                    {showFinancials && <th>{t.collected}</th>}
                    {showFinancials && <th>{t.toReceive}</th>}
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
                          {showFinancials && <td style={{ color: "#2d8a4e", fontWeight: 600 }}>{g.paid}</td>}
                          {showFinancials && <td style={{ color: "#d4820a", fontWeight: 600 }}>{g.pendN}</td>}
                          {showFinancials && <td style={{ color: "#6b7280" }}>{g.exempt}</td>}
                          {showFinancials && <td style={{ color: "#2d8a4e", fontWeight: 600 }}>{fmt(g.coll)}</td>}
                          {showFinancials && <td style={{ color: "#d4820a", fontWeight: 600 }}>{fmt(g.pendA)}</td>}
                        </tr>
                        {subGroups.map((sg) => (
                          <tr key={g.key + ":" + sg.key} style={{ background: "#f8f9fb" }}>
                            <td style={{ paddingLeft: 34, fontSize: 13, color: "#374151" }}>{sg.key}</td>
                            <td style={{ fontSize: 13 }}>{sg.total}</td>
                            {showFinancials && <td style={{ color: "#2d8a4e", fontSize: 13 }}>{sg.paid}</td>}
                            {showFinancials && <td style={{ color: "#d4820a", fontSize: 13 }}>{sg.pendN}</td>}
                            {showFinancials && <td style={{ color: "#6b7280", fontSize: 13 }}>{sg.exempt}</td>}
                            {showFinancials && <td style={{ color: "#2d8a4e", fontSize: 13 }}>{fmt(sg.coll)}</td>}
                            {showFinancials && <td style={{ color: "#d4820a", fontSize: 13 }}>{fmt(sg.pendA)}</td>}
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })}
                  <tr style={{ background: "#f8f9fb", fontWeight: 700 }}>
                    <td>{t.total}</td>
                    <td>{er.length}</td>
                    {showFinancials && <td>{er.filter((r) => r.paid).length}</td>}
                    {showFinancials && <td>{pend.length}</td>}
                    {showFinancials && <td>{er.filter((r) => r.exempt).length}</td>}
                    {showFinancials && <td>{fmt(er.filter((r) => r.paid).reduce((s, r) => s + r.fee, 0))}</td>}
                    {showFinancials && <td>{fmt(pend.reduce((s, r) => s + r.fee, 0))}</td>}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {type === "pending" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                padding: "11px 18px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontWeight: 700 }}>{t.pendPayTab} — Inscritos</span>
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
                    <th>Grupo</th>
                    <th>{t.feeH}</th>
                    <th>{t.date}</th>
                  </tr>
                </thead>
                <tbody>
                  {pendView.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", color: "#6b7280", padding: 20 }}>{t.noRecords}</td></tr>}
                  {pendView.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.memberName}</td>
                      <td>
                        <span className="badge badge-blue">{r.category}</span>
                      </td>
                      <td style={{ fontSize: 12, color: "#6b7280" }}>{liveChurch(r)}</td>
                      <td style={{ fontSize: 12, color: "#6b7280" }}>{gaNameOf(r) || "—"}</td>
                      <td style={{ color: "#d4820a", fontWeight: 600 }}>{fmt(r.fee)}</td>
                      <td style={{ fontSize: 12, color: "#6b7280" }}>{r.registeredAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {wlPendView.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: "hidden", borderColor: "#f59e0b" }}>
              <div
                style={{
                  padding: "11px 18px",
                  borderBottom: "1px solid #f59e0b",
                  display: "flex",
                  justifyContent: "space-between",
                  background: "#fef9f0",
                }}
              >
                <span style={{ fontWeight: 700, color: "#92400e" }}>Lista de Espera — Pendente</span>
                <span className="badge badge-yellow">
                  {wlPendView.length} · {fmt(wlPendView.reduce((s, r) => s + r.fee, 0))}
                </span>
              </div>
              <div style={{ padding: "6px 18px", background: "#fef9f0", fontSize: 12, color: "#92400e", fontStyle: "italic" }}>
                Pode nunca pagar — não conta no total a receber.
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{t.memberName}</th>
                      <th>{t.cat}</th>
                      <th>{t.churchH}</th>
                      <th>{t.feeH}</th>
                      <th>{t.date}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wlPendView.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 700, color: "#92400e" }}>#{r.wlPosition}</td>
                        <td style={{ fontWeight: 600 }}>{r.memberName}</td>
                        <td><span className="badge badge-blue">{r.category}</span></td>
                        <td style={{ fontSize: 12, color: "#6b7280" }}>{liveChurch(r)}</td>
                        <td style={{ color: "#d4820a", fontWeight: 600 }}>{fmt(r.fee)}</td>
                        <td style={{ fontSize: 12, color: "#6b7280" }}>{r.registeredAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className="badge badge-green">{wl.filter((r) => r.paid).length} pago</span>
              <span className="badge badge-yellow">{wl.filter((r) => !r.paid && !r.exempt).length} pendente</span>
              <span className="wl">{wl.length}</span>
            </div>
          </div>
          {wl.length > 0 && (
            <div style={{ padding: "6px 18px", fontSize: 12, color: "#6b7280", fontStyle: "italic", background: "var(--bg2)", borderBottom: "1px solid var(--border)" }}>
              Quem pagou tem prioridade — aparece primeiro.
            </div>
          )}
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
                    <th>Status</th>
                    <th>{t.date}</th>
                  </tr>
                </thead>
                <tbody>
                  {wlView.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", color: "#6b7280", padding: 20 }}>{t.noRecords}</td></tr>}
                  {wlView.map((r) => (
                    <tr key={r.id} style={r.paid ? { background: "#f0fdf4" } : {}}>
                      <td style={{ fontWeight: 700, color: "#92400e" }}>#{r.wlPosition}</td>
                      <td style={{ fontWeight: 600 }}>{r.memberName}</td>
                      <td>
                        <span className="badge badge-blue">{r.category}</span>
                      </td>
                      <td style={{ fontSize: 12, color: "#6b7280" }}>{r.church}</td>
                      <td style={{ fontWeight: 600 }}>{fmt(r.fee)}</td>
                      <td>{r.paid ? <span className="badge badge-green">Pago ✓</span> : <span className="badge badge-yellow">Pendente</span>}</td>
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
                  {showFinancials && <th>{t.statusH}</th>}
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
                    {showFinancials && <td>{r.exempt ? t.exempt : r.paid ? `✓ ${t.paid}` : "⏳"}</td>}
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

      {type === "immigration" && (() => {
        const STATUSES = ["Cidadão", "Residente Permanente", "Com Visto", "Em Processo", "Sem Visto"];
        const mems = members || [];
        const total = mems.length;
        const pct = (n) => total > 0 ? Math.round(n / total * 100) : 0;

        const immChurches = [...new Set(mems.map((m) => m.church).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt"));
        const immGas = (gas || []).filter((g) => mems.some((m) => m.gaId === g.id)).sort((a, b) => a.name.localeCompare(b.name, "pt"));

        const filteredMems = mems.filter((m) =>
          (!immChurch || m.church === immChurch) &&
          (!immGa || m.gaId === immGa)
        );
        const filtTotal = filteredMems.length;
        const filtPct = (n) => filtTotal > 0 ? Math.round(n / filtTotal * 100) : 0;

        const statusRows = STATUSES.map((s) => ({ label: s, count: filteredMems.filter((m) => m.immigrationStatus === s).length }));
        const notInformed = filteredMems.filter((m) => !m.immigrationStatus).length;

        const churchBreakdown = immChurches.map((c) => {
          const cms = mems.filter((m) => m.church === c && (!immGa || m.gaId === immGa));
          return { church: c, total: cms.length, rows: STATUSES.map((s) => ({ label: s, count: cms.filter((m) => m.immigrationStatus === s).length })), notInformed: cms.filter((m) => !m.immigrationStatus).length };
        }).filter((c) => c.total > 0);

        const gaBreakdown = immGas.map((g) => {
          const gms = mems.filter((m) => m.gaId === g.id && (!immChurch || m.church === immChurch));
          return { name: g.name, church: g.church, total: gms.length, rows: STATUSES.map((s) => ({ label: s, count: gms.filter((m) => m.immigrationStatus === s).length })), notInformed: gms.filter((m) => !m.immigrationStatus).length };
        }).filter((g) => g.total > 0);

        const tdS = { padding: "6px 10px", borderBottom: "1px solid var(--border)", fontSize: 13 };
        const thS = { padding: "6px 10px", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".4px", textAlign: "left", borderBottom: "1px solid var(--border)" };

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Filters */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select value={immChurch} onChange={(e) => setImmChurch(e.target.value)}>
                <option value="">Todas as igrejas</option>
                {immChurches.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={immGa} onChange={(e) => setImmGa(e.target.value)}>
                <option value="">Todos os grupos</option>
                {immGas.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <div style={{ display: "flex", gap: 4 }}>
                {[["Visão geral", "overview"], ["Por Igreja", "church"], ["Por Grupo", "ga"]].map(([l, d]) => (
                  <button key={d} className={`tab ${immDim === d ? "active" : ""}`} onClick={() => setImmDim(d)}>{l}</button>
                ))}
              </div>
            </div>

            {/* Overview */}
            {immDim === "overview" && (
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "10px 14px", background: "var(--bg2)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Situação Imigratória</span>
                  <span className="badge badge-blue">{filtTotal} membros</span>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>
                    <th style={thS}>Status</th>
                    <th style={{ ...thS, textAlign: "right" }}>N</th>
                    <th style={{ ...thS, textAlign: "right" }}>%</th>
                    <th style={{ ...thS }}>Barra</th>
                  </tr></thead>
                  <tbody>
                    {statusRows.map(({ label, count }) => (
                      <tr key={label}>
                        <td style={tdS}>{label}</td>
                        <td style={{ ...tdS, textAlign: "right", fontWeight: 600 }}>{count}</td>
                        <td style={{ ...tdS, textAlign: "right", color: "var(--muted)" }}>{filtPct(count)}%</td>
                        <td style={{ ...tdS }}>
                          <div style={{ height: 8, borderRadius: 4, background: "var(--border)", overflow: "hidden", minWidth: 80 }}>
                            <div style={{ height: "100%", width: `${filtPct(count)}%`, background: "var(--icm-crimson)", borderRadius: 4 }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: "var(--bg2)" }}>
                      <td style={{ ...tdS, color: "var(--muted)", fontStyle: "italic" }}>Não informado</td>
                      <td style={{ ...tdS, textAlign: "right", fontWeight: 600 }}>{notInformed}</td>
                      <td style={{ ...tdS, textAlign: "right", color: "var(--muted)" }}>{filtPct(notInformed)}%</td>
                      <td style={{ ...tdS }}>
                        <div style={{ height: 8, borderRadius: 4, background: "var(--border)", overflow: "hidden", minWidth: 80 }}>
                          <div style={{ height: "100%", width: `${filtPct(notInformed)}%`, background: "#d1d5db", borderRadius: 4 }} />
                        </div>
                      </td>
                    </tr>
                    <tr style={{ fontWeight: 700, background: "#f3f4f6" }}>
                      <td style={tdS}>Total</td>
                      <td style={{ ...tdS, textAlign: "right" }}>{filtTotal}</td>
                      <td style={{ ...tdS, textAlign: "right" }}>100%</td>
                      <td style={tdS} />
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* By church */}
            {immDim === "church" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {churchBreakdown.map((c) => (
                  <div key={c.church} className="card" style={{ padding: 0, overflow: "hidden" }}>
                    <div style={{ padding: "8px 14px", background: "var(--bg2)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{c.church}</span>
                      <span className="badge badge-blue">{c.total}</span>
                    </div>
                    <div style={{ padding: "6px 14px 8px", display: "flex", flexWrap: "wrap", gap: 10 }}>
                      {c.rows.filter((r) => r.count > 0).map((r) => (
                        <span key={r.label} style={{ fontSize: 12 }}>
                          <span style={{ color: "var(--muted)" }}>{r.label}: </span>
                          <strong>{r.count}</strong>
                          <span style={{ color: "var(--muted)" }}> ({Math.round(r.count / c.total * 100)}%)</span>
                        </span>
                      ))}
                      {c.notInformed > 0 && (
                        <span style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>
                          Não informado: <strong style={{ color: "var(--text)" }}>{c.notInformed}</strong> ({Math.round(c.notInformed / c.total * 100)}%)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* By GA */}
            {immDim === "ga" && (
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>
                    <th style={thS}>Grupo</th>
                    <th style={thS}>Igreja</th>
                    {STATUSES.map((s) => <th key={s} style={{ ...thS, textAlign: "right" }}>{s}</th>)}
                    <th style={{ ...thS, textAlign: "right", fontStyle: "italic" }}>N/I</th>
                    <th style={{ ...thS, textAlign: "right" }}>Total</th>
                  </tr></thead>
                  <tbody>
                    {gaBreakdown.map((g) => (
                      <tr key={g.name}>
                        <td style={{ ...tdS, fontWeight: 600 }}>{g.name}</td>
                        <td style={{ ...tdS, fontSize: 12, color: "var(--muted)" }}>{g.church}</td>
                        {g.rows.map((r) => (
                          <td key={r.label} style={{ ...tdS, textAlign: "right" }}>{r.count > 0 ? r.count : <span style={{ color: "var(--border)" }}>—</span>}</td>
                        ))}
                        <td style={{ ...tdS, textAlign: "right", color: "var(--muted)", fontStyle: "italic" }}>{g.notInformed > 0 ? g.notInformed : <span style={{ color: "var(--border)" }}>—</span>}</td>
                        <td style={{ ...tdS, textAlign: "right", fontWeight: 600 }}>{g.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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

      {type === "cia" && (() => {
        const classesToShow = ciaClassFilter === "all" ? CIA_CATS : CIA_CATS.filter((c) => c.cat === ciaClassFilter);
        return (
          <div>
            {/* Filters */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14, alignItems: "center" }}>
              <select value={ciaChurch} onChange={(e) => setCiaChurch(e.target.value)}>
                <option value="">Todas as igrejas</option>
                {ciaChurches.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                <button className={`tab ${ciaClassFilter === "all" ? "active" : ""}`} onClick={() => setCiaClassFilter("all")}>Todas</button>
                {CIA_CATS.map(({ cat, label }) => (
                  <button key={cat} className={`tab ${ciaClassFilter === cat ? "active" : ""}`} onClick={() => setCiaClassFilter(cat)}>{label}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 4, marginLeft: "auto", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>Colunas:</span>
                {[{ key: "church", label: "Igreja" }, ...(showFinancials ? [{ key: "status", label: "Status" }] : [])].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => toggleCiaCol(key)}
                    style={{
                      fontSize: 11, padding: "3px 9px", borderRadius: 99, border: "1px solid var(--border)", cursor: "pointer",
                      background: ciaCols[key] ? "var(--primary)" : "var(--bg2)",
                      color: ciaCols[key] ? "#fff" : "var(--muted)",
                      fontWeight: ciaCols[key] ? 700 : 400,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary cards */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {CIA_CATS.map(({ cat, label, color }) => {
                const count = ciaFiltered.filter((r) => ciaClassOf(r) === cat).length;
                const conf = ciaFiltered.filter((r) => ciaClassOf(r) === cat && (r.paid || r.exempt)).length;
                return (
                  <div key={cat} className="card" style={{ textAlign: "center", borderTop: `3px solid ${color}`, padding: "10px 14px", flex: "1 1 80px", cursor: "pointer" }} onClick={() => setCiaClassFilter(ciaClassFilter === cat ? "all" : cat)}>
                    <div style={{ fontSize: 22, fontWeight: 700, color }}>{count}</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>{label}</div>
                    <div style={{ fontSize: 10, color: "#2d8a4e", marginTop: 2 }}>{conf}✓</div>
                  </div>
                );
              })}
              <div className="card" style={{ textAlign: "center", borderTop: "3px solid #1a3a6b", padding: "10px 14px", flex: "1 1 80px" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#1a3a6b" }}>{ciaFiltered.length}</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>Total</div>
                <div style={{ fontSize: 10, color: "#2d8a4e", marginTop: 2 }}>{ciaFiltered.filter((r) => r.paid || r.exempt).length}✓</div>
              </div>
            </div>

            {/* Per-class name lists */}
            {classesToShow.map(({ cat, label, color }) => {
              const rows = ciaFiltered.filter((r) => ciaClassOf(r) === cat).sort((a, b) => norm(a.memberName).localeCompare(norm(b.memberName)));
              if (rows.length === 0 && ciaClassFilter === "all") return null;
              return (
                <div key={cat} className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 14, borderTop: `3px solid ${color}` }}>
                  <div style={{ padding: "10px 16px", background: "var(--bg2)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color }}>{label}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span className="badge badge-green">{rows.filter((r) => r.paid || r.exempt).length}✓</span>
                      <span className="badge badge-blue">{rows.length}</span>
                    </div>
                  </div>
                  {rows.length === 0 ? (
                    <p style={{ padding: "12px 16px", color: "var(--muted)", fontSize: 13 }}>Nenhum inscrito nesta classe.</p>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table className="table" style={{ minWidth: ciaCols.church || ciaCols.status ? 420 : 260 }}>
                        <thead>
                          <tr>
                            <th style={{ width: 36 }}>#</th>
                            <th>Nome</th>
                            {ciaCols.church && <th>Igreja</th>}
                            {ciaCols.status && <th>Status</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((r, i) => (
                            <tr key={r.id}>
                              <td style={{ color: "#9ca3af", fontSize: 12 }}>{i + 1}</td>
                              <td style={{ fontWeight: 600 }}>
                                {r.memberName}
                                {r.acessibilidade && <span style={{ marginLeft: 5, fontSize: 12, color: "#0891b2" }}>♾</span>}
                              </td>
                              {ciaCols.church && <td style={{ fontSize: 12, color: "#6b7280" }}>{liveChurch(r)}</td>}
                              {ciaCols.status && (
                                <td>
                                  <span className={`badge ${r.paid || r.exempt ? "badge-green" : "badge-yellow"}`} style={{ fontSize: 10 }}>
                                    {r.exempt ? "Isento" : r.paid ? "✓ Pago" : "Pendente"}
                                  </span>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
