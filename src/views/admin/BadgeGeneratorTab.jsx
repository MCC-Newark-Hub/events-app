import { useState } from "react";
import logoSrc from "@/assets/images/logo/icm-logo.png";

const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// 2"×1" landscape, one badge per PDF page — bulk pre-print/cut tool for check-in
// tables. Distinct from BadgePrint.jsx (the 3"×2" self-service confirmation
// receipt) — different size, different audience (staff, bulk), different trigger
// (explicit "Gerar Crachás" click, not tied to any single registration).
async function loadJsPDF() {
  if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
  await new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return window.jspdf.jsPDF;
}

async function loadQRLib() {
  if (window.qrcode) return; // qrcode-generator sets window.qrcode
  await new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js";
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// qrcode-generator is fully synchronous — no DOM needed, safe to call in a loop
function makeQRDataURL(text) {
  if (!window.qrcode) return null;
  try {
    const qr = window.qrcode(0, "L"); // typeNumber 0 = auto-detect size
    qr.addData(text);
    qr.make();
    const count = qr.getModuleCount();
    const cell = 4; // px per module — enough for sharp rendering when scaled down
    const canvas = document.createElement("canvas");
    canvas.width = count * cell;
    canvas.height = count * cell;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000000";
    for (let r = 0; r < count; r++)
      for (let c = 0; c < count; c++)
        if (qr.isDark(r, c)) ctx.fillRect(c * cell, r * cell, cell, cell);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

// doc.text({align:"center"}) doesn't shrink or wrap to fit — a long enough
// string just overflows past the card border at this card's tiny width. Found
// this rendering a real long name locally before shipping (e.g. a hyphenated
// double surname) — every line on the card needs this, not just the name.
function fitFontSize(doc, text, startSize, minSize, maxWidth) {
  let size = startSize;
  doc.setFontSize(size);
  while (size > minSize && doc.getTextWidth(text) > maxWidth) {
    size -= 0.5;
    doc.setFontSize(size);
  }
  return size;
}

function drawBadge(doc, r, event, isFirst, qrDataUrl) {
  const W = 144, H = 72; // 2in × 1in in points (72pt/inch)
  if (!isFirst) doc.addPage([H, W], "landscape");

  // When a QR code is present, reserve the right 30pt for it
  const QR_SIZE = 26;
  const QR_PAD = 4;
  const textW = qrDataUrl ? W - QR_SIZE - QR_PAD * 2 : W;
  const cx = textW / 2;
  const maxTextWidth = textW - 12;

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, H, "F");
  doc.setDrawColor(200);
  doc.setLineWidth(1);
  doc.rect(2, 2, W - 4, H - 4);

  const badgeName = r.badgeName || r.memberName || "";
  const parts = badgeName.trim().split(/\s+/);
  const nome = (parts[0] || "").toUpperCase();
  const sobrenome = parts.slice(1).join(" ").toUpperCase();
  const churchCity = (r.church || "").split(",")[0].replace(/\s*[-–]\s*(EUA|CAN|BRA|USA)$/i, "").trim();
  const team = r.team && r.team !== "Participante" ? r.team : "";
  const catTeam = [r.category, team].filter(Boolean).join("  ·  ");

  let y = 9;
  try { doc.addImage(logoSrc, "PNG", cx - 9, y, 18, 7); } catch { /* skip logo if it fails to load */ }
  y += 12;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  fitFontSize(doc, nome, 15, 8, maxTextWidth);
  doc.text(nome, cx, y, { align: "center" });
  y += 9;

  if (sobrenome) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60);
    fitFontSize(doc, sobrenome, 7.5, 5, maxTextWidth);
    doc.text(sobrenome, cx, y, { align: "center" });
    y += 7;
  }

  if (catTeam) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30);
    fitFontSize(doc, catTeam, 6.5, 4.5, maxTextWidth);
    doc.text(catTeam, cx, y, { align: "center" });
    y += 6.5;
  }

  if (churchCity) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(110);
    fitFontSize(doc, churchCity, 6, 4.5, maxTextWidth);
    doc.text(churchCity, cx, y, { align: "center" });
  }

  const eventDate = event?.date ? new Date(event.date + "T12:00:00") : new Date();
  const monthYear = eventDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).toUpperCase();
  const footer = `${(event?.name || "EVENTO").toUpperCase()} · ${monthYear}`;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150);
  fitFontSize(doc, footer, 4.8, 3.5, maxTextWidth);
  doc.text(footer, cx, H - 5, { align: "center" });

  if (qrDataUrl) {
    const qrX = W - QR_SIZE - QR_PAD;
    const qrY = (H - QR_SIZE) / 2;
    try { doc.addImage(qrDataUrl, "PNG", qrX, qrY, QR_SIZE, QR_SIZE); } catch {}
  }
}

export default function BadgeGeneratorTab({ regs, event, rosters, notify }) {
  const [churchFilter, setChurchFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [generating, setGenerating] = useState(false);

  const rosterTeamOf = (memberId) =>
    (rosters || []).find((ro) => ro.eventId === event?.id && (ro.memberIds || []).includes(memberId))?.team || null;

  const active = (regs || []).filter((r) => r.eventId === event?.id && !r.cancelled && !r.waitlisted);
  const churchOptions = [...new Set(active.map((r) => r.church).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const categoryOptions = [...new Set(active.map((r) => r.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));

  const filtered = active.filter((r) =>
    (!churchFilter || r.church === churchFilter) &&
    (!categoryFilter || r.category === categoryFilter) &&
    (!search || norm(r.memberName).includes(norm(search)))
  ).sort((a, b) => (a.memberName || "").localeCompare(b.memberName || ""));

  const toggleOne = (id) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const filteredIds = filtered.map((r) => r.id);
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selected.includes(id));
  const toggleAllFiltered = () => setSelected(allFilteredSelected ? [] : [...new Set([...selected, ...filteredIds])]);

  const exportCSV = () => {
    const toExport = selected.length > 0 ? active.filter((r) => selected.includes(r.id)) : filtered;
    if (toExport.length === 0) { notify?.("Nenhum inscrito para exportar."); return; }

    const churchCity = (church) =>
      (church || "").split(",")[0].replace(/\s*[-–]\s*(EUA|CAN|BRA|USA)$/i, "").trim();

    const eventDate = event?.date ? new Date(event.date + "T12:00:00") : new Date();
    const mesEAno = eventDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).toUpperCase();
    const local = (event?.location || "").toUpperCase();

    const headers = ["NOME", "SOBRENOME", "EQUIPE", "CATEGORIA", "IGREJA", "NUMERO", "LOCAL", "MES_E_ANO", "CHECKIN_URL"];
    const rows = toExport.map((r) => {
      const badgeName = (r.badgeName || r.memberName || "").trim();
      const parts = badgeName.split(/\s+/);
      const nome = (parts[0] || "").toUpperCase();
      const sobrenome = parts.slice(1).join(" ").toUpperCase();
      const teamName = rosterTeamOf(r.memberId) || (r.team && r.team !== "Participante" ? r.team : null);
      const equipe = teamName ? teamName.toUpperCase() : "PARTICIPANTE";
      const checkinUrl = `${window.location.origin}?checkin=${r.regNumber}`;
      return [nome, sobrenome, equipe, r.category || "", churchCity(r.church), r.regNumber || "", local, mesEAno, checkinUrl];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crachas-${(event?.name || "evento").replace(/\s+/g, "-").toLowerCase()}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const generate = async () => {
    const toGenerate = active.filter((r) => selected.includes(r.id));
    if (toGenerate.length === 0) return;
    setGenerating(true);
    try {
      const [JsPDF] = await Promise.all([loadJsPDF(), loadQRLib()]);
      const qrMap = {};
      for (const r of toGenerate) {
        const url = `${window.location.origin}?checkin=${r.regNumber}`;
        qrMap[r.id] = makeQRDataURL(url);
      }
      const doc = new JsPDF({ orientation: "landscape", unit: "pt", format: [72, 144] });
      toGenerate.forEach((r, idx) => {
        const resolvedTeam = rosterTeamOf(r.memberId) || (r.team && r.team !== "Participante" ? r.team : "");
        drawBadge(doc, { ...r, team: resolvedTeam }, event, idx === 0, qrMap[r.id]);
      });
      const filename = `crachas-${(event?.name || "evento").replace(/\s+/g, "-").toLowerCase()}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error("badge generation error:", err);
      notify?.("Erro ao gerar crachás. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 22, fontWeight: 700 }}>Crachás</h2>
      </div>
      <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 18 }}>
        Gere um PDF com um crachá por página (2×1 pol.) para imprimir e cortar antes do evento.
      </p>

      <div className="card" style={{ padding: "14px 16px", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 200px", minWidth: 180 }}>
            <label style={{ fontSize: 12 }}>Buscar por nome</label>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome…" />
          </div>
          <div>
            <label style={{ fontSize: 12 }}>Igreja</label>
            <select value={churchFilter} onChange={(e) => setChurchFilter(e.target.value)}>
              <option value="">Todas</option>
              {churchOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12 }}>Categoria</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">Todas</option>
              {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {(churchFilter || categoryFilter || search) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setChurchFilter(""); setCategoryFilter(""); setSearch(""); }}>
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>{selected.length} selecionado(s) de {filtered.length} exibido(s)</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={exportCSV}>
            📊 Exportar CSV{selected.length > 0 ? ` (${selected.length})` : ""}
          </button>
          <button
            className="btn btn-primary btn-sm"
            disabled={selected.length === 0 || generating}
            onClick={generate}
          >
            🖨️ {generating ? "Gerando…" : `Gerar Crachás (${selected.length})`}
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox" checked={allFilteredSelected} onChange={toggleAllFiltered} />
                </th>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Equipe</th>
                <th>Igreja</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>Nenhum resultado.</td></tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} style={{ background: selected.includes(r.id) ? "var(--sidebar-active-bg)" : "" }}>
                  <td><input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggleOne(r.id)} /></td>
                  <td style={{ fontWeight: 500 }}>{r.memberName}</td>
                  <td><span className="badge badge-blue">{r.category}</span></td>
                  <td style={{ fontSize: 12 }}>{(() => { const t = rosterTeamOf(r.memberId) || (r.team && r.team !== "Participante" ? r.team : null); return t || <span style={{ color: "var(--muted)" }}>—</span>; })()}</td>
                  <td style={{ fontSize: 12 }}>{r.church}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
