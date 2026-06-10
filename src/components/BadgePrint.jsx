import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { churchDisplay, churchCode } from "@/constants";

export default function BadgePrint({ regs, lang }) {
  const [pdfDone, setPdfDone] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const primary = regs[0];

  const makePDF = async (JsPDF) => {
    var W = 216, H = 144;
    var doc = new JsPDF({ orientation: "landscape", unit: "pt", format: [H, W] });
    // Generate QR data URLs for all regs
    var qrDataUrls = await Promise.all(
      regs.map((r) =>
        QRCode.toDataURL(
          `${window.location.origin}?checkin=${r.regNumber}`,
          { width: 80, margin: 1, color: { dark: '#000000', light: '#ffffff' } }
        ).catch(() => null)
      )
    );
    for (var idx = 0; idx < regs.length; idx++) {
      var r = regs[idx];
      if (idx > 0) doc.addPage([H, W], "landscape");
      var name = r.badgeName || r.name || r.memberName || "";
      var fullName = r.name || r.memberName || "";
      var church = churchDisplay(r.church || "");
      var ccode = churchCode(r.church || "");
      var category = r.category || "";
      var role = r.role || "";
      var regNum = r.regNumber || "";
      var cx = W / 2;
      var nameSize = name.length > 16 ? 18 : name.length > 12 ? 22 : 28;
      var yPos = 62;
      doc.setDrawColor(0); doc.setLineWidth(1.5); doc.rect(4, 4, W - 8, H - 8);
      doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(0);
      doc.text("IGREJA CRISTA MARANATA", cx, 18, { align: "center" });
      doc.setLineWidth(0.5); doc.setDrawColor(180); doc.line(20, 22, W - 20, 22);
      doc.setFont("helvetica", "bold"); doc.setFontSize(nameSize); doc.setTextColor(0);
      doc.text(name, cx, 52, { align: "center" });
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(100);
      doc.text(fullName, cx, yPos + 6, { align: "center" });
      yPos += 12;
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(60);
      doc.text(church, cx, yPos + 10, { align: "center" });
      yPos += 14;
      var pills = [category, role].filter(function(x) { return !!x; });
      var pillW = 54, pillH = 12, pillGap = 6;
      var totalPillW = pills.length * pillW + (pills.length - 1) * pillGap;
      var px = cx - totalPillW / 2;
      for (var pi = 0; pi < pills.length; pi++) {
        doc.setDrawColor(0); doc.setLineWidth(0.8); doc.setFillColor(255);
        doc.roundedRect(px, yPos + 4, pillW, pillH, 3, 3, "FD");
        doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(0);
        doc.text(pills[pi], px + pillW / 2, yPos + 12, { align: "center" });
        px += pillW + pillGap;
      }
      doc.setLineWidth(0.5); doc.setDrawColor(180); doc.line(20, H - 20, W - 20, H - 20);
      doc.setFont("courier", "normal"); doc.setFontSize(6.5); doc.setTextColor(100);
      doc.text(regNum, 8, H - 10, { align: "left" });
      if (ccode) doc.text(ccode, W - 8, H - 10, { align: "right" });
      // QR code in bottom-right corner
      var qr = qrDataUrls[idx];
      if (qr) doc.addImage(qr, 'PNG', W - 28, H - 26, 20, 20);
    }
    doc.save("inscricao-" + (primary.regNumber || "ICM") + ".pdf");
    setPdfDone(true);
  };

  const generateBadgePDF = async () => {
    if (window.jspdf && window.jspdf.jsPDF) { await makePDF(window.jspdf.jsPDF); return; }
    await new Promise((resolve, reject) => {
      var s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    }).then(() => makePDF(window.jspdf.jsPDF)).catch(() => { setPdfError(true); setPdfDone(true); });
  };

  useEffect(() => {
    const timer = setTimeout(() => { generateBadgePDF(); }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      {/* PDF status */}
      {!pdfDone ? (
        <div style={{ background: "#eff6ff", borderRadius: 8, padding: "12px 14px", marginBottom: 12, textAlign: "center", fontSize: 13, color: "#1e40af" }}>
          {lang === "en" ? "Generating your badges PDF..." : "Gerando o PDF dos crachás..."}
        </div>
      ) : pdfError ? (
        <div style={{ marginBottom: 12 }}>
          <div style={{ background: "#fff0e6", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#c4390a", marginBottom: 8 }}>
            {lang === "en" ? "Could not auto-download. Click below:" : "Não foi possível baixar automaticamente. Clique abaixo:"}
          </div>
          <button className="btn btn-primary" style={{ width: "100%", marginBottom: 8 }} onClick={generateBadgePDF}>
            {lang === "en" ? "Download Badges PDF" : "Baixar PDF dos Crachás"}
          </button>
        </div>
      ) : (
        <div style={{ background: "#d1fae5", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#065f46", textAlign: "center" }}>
          {lang === "en" ? "Badges PDF downloaded!" : "PDF dos crachás baixado!"}{" · "}
          <button onClick={generateBadgePDF} style={{ background: "none", border: "none", cursor: "pointer", color: "#065f46", textDecoration: "underline", fontSize: 13, padding: 0 }}>
            {lang === "en" ? "Download again" : "Baixar novamente"}
          </button>
        </div>
      )}

      {/* Badge preview grid */}
      <p style={{ color: "rgba(255,255,255,.7)", fontSize: 12, marginBottom: 10, textAlign: "center" }}>
        {lang === "en" ? "Badge preview (3x2 landscape):" : "Pré-visualização dos crachás (3x2 paisagem):"}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
        {regs.map((r, i) => {
          const name = r.badgeName || r.name || r.memberName || "";
          const fullName = r.name || r.memberName || "";
          const church = (r.church || "").replace(/ - EUA$/, "").replace(/ - CAN$/, "");
          return (
            <div key={i} style={{ background: "#fff", border: "1.5px solid #111", borderRadius: 6, padding: "10px 12px", fontFamily: "'Helvetica Neue',Arial,sans-serif", aspectRatio: "3/2", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 7, fontWeight: 900, letterSpacing: "0.12em", color: "#000", textTransform: "uppercase" }}>IGREJA CRISTÃ MARANATA</div>
                <div style={{ height: 1, background: "#ccc", margin: "4px 0" }} />
                <div style={{ fontSize: name.length > 12 ? 16 : 20, fontWeight: 900, color: "#000", lineHeight: 1.1, marginTop: 4 }}>{name}</div>
                {fullName && <div style={{ fontSize: 8, color: "#555", marginTop: 2 }}>{fullName}</div>}
                <div style={{ fontSize: 8, color: "#444", marginTop: 3 }}>{churchDisplay(r.church || "")}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 4, flexWrap: "wrap", margin: "4px 0" }}>
                {[r.category, r.role].filter(Boolean).map((p, pi) => (
                  <span key={pi} style={{ border: "1px solid #000", borderRadius: 3, padding: "1px 7px", fontSize: 7, fontWeight: 700, color: "#000", background: "#fff" }}>{p}</span>
                ))}
              </div>
              <div>
                <div style={{ height: 1, background: "#ccc", marginBottom: 3 }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 6.5, color: "#666", fontFamily: "monospace" }}>{r.regNumber}</div>
                  <div style={{ fontSize: 6.5, color: "#666", fontFamily: "monospace", fontWeight: 700 }}>{churchCode(r.church || "")}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
