import { useState, useEffect } from "react";
import { fmt, churchDisplay, churchCode } from "@/constants";
// ── PUBLIC CONFIRMATION ───────────────────────────────────────────────────────
function PublicConfirmation({ regs, email, event, lang, setLang, t, onReset, onHome }) {
  const [emailInput, setEmailInput] = useState(email || "");
  const [emailSent, setEmailSent] = useState(false);
  const [pdfDone, setPdfDone] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const primary = regs[0];
  const family = regs.slice(1);
  const totalFee = regs.reduce((s, r) => s + r.fee, 0);
  const CLERK_EMAIL = "mccnewark.registrations@gmail.com";

  // ── PDF generation (jsPDF via script tag) ────────────────────────────────
  const makePDF = (JsPDF) => {
    var W = 216,
      H = 144;
    var doc = new JsPDF({ orientation: "landscape", unit: "pt", format: [H, W] });
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

      doc.setDrawColor(0);
      doc.setLineWidth(1.5);
      doc.rect(4, 4, W - 8, H - 8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(0);
      doc.text("IGREJA CRISTA MARANATA", cx, 18, { align: "center" });
      doc.setLineWidth(0.5);
      doc.setDrawColor(180);
      doc.line(20, 22, W - 20, 22);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(nameSize);
      doc.setTextColor(0);
      doc.text(name, cx, 52, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100);
      doc.text(fullName, cx, yPos + 6, { align: "center" });
      yPos += 12;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(60);
      doc.text(church, cx, yPos + 10, { align: "center" });
      yPos += 14;
      var pills = [category, role].filter(function (x) {
        return !!x;
      });
      var pillW = 54,
        pillH = 12,
        pillGap = 6;
      var totalPillW = pills.length * pillW + (pills.length - 1) * pillGap;
      var px = cx - totalPillW / 2;
      for (var pi = 0; pi < pills.length; pi++) {
        doc.setDrawColor(0);
        doc.setLineWidth(0.8);
        doc.setFillColor(255);
        doc.roundedRect(px, yPos + 4, pillW, pillH, 3, 3, "FD");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(0);
        doc.text(pills[pi], px + pillW / 2, yPos + 12, { align: "center" });
        px += pillW + pillGap;
      }
      doc.setLineWidth(0.5);
      doc.setDrawColor(180);
      doc.line(20, H - 20, W - 20, H - 20);
      doc.setFont("courier", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(100);
      doc.text(regNum, 8, H - 10, { align: "left" });
      if (ccode) doc.text(ccode, W - 8, H - 10, { align: "right" });
    }
    doc.save("inscricao-" + (primary.regNumber || "ICM") + ".pdf");
    setPdfDone(true);
    var recipients = [CLERK_EMAIL];
    if (email) recipients.push(email);
    console.log("[EMAIL] Would send to: " + recipients.join(", "));
    setEmailSent(true);
    setEmailInput(email || CLERK_EMAIL);
  };

  const generateBadgePDF = () => {
    if (window.jspdf && window.jspdf.jsPDF) {
      makePDF(window.jspdf.jsPDF);
      return;
    }
    var s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = function () {
      makePDF(window.jspdf.jsPDF);
    };
    s.onerror = function () {
      setPdfError(true);
      setPdfDone(true);
    };
    document.head.appendChild(s);
  };

  // Auto-trigger PDF on mount
  useEffect(() => {
    const timer = setTimeout(generateBadgePDF, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleShare = () => {
    const text =
      (primary.name || primary.memberName) +
      "\n" +
      primary.regNumber +
      "\n" +
      t.totalMembers +
      ": " +
      regs.length +
      "\n" +
      t.totalFee +
      ": " +
      (totalFee === 0 ? "Grátis / Free" : fmt(totalFee));
    if (navigator.share) {
      navigator.share({ title: t.confirmationTitle, text });
    } else {
      navigator.clipboard?.writeText(text);
      alert(lang === "en" ? "Copied!" : "Copiado!");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg,#8B0000 0%,#b41926 50%,#03223f 100%)",
        padding: "24px 16px",
      }}
    >
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
            gap: 6,
          }}
        >
          {onHome && (
            <button
              onClick={onHome}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,.8)",
                fontSize: 13,
                cursor: "pointer",
                padding: 0,
              }}
            >
              ← {lang === "en" ? "Home" : "Início"}
            </button>
          )}
        </div>

        <div style={{ background: "#fff", borderRadius: 20, padding: "28px 24px" }}>
          {/* Check + title */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 52, marginBottom: 8 }}>✅</div>
            <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 22, marginBottom: 4 }}>
              {t.confirmationTitle}
            </h2>
            <p style={{ color: "#6b7280", fontSize: 13 }}>{t.confirmationSub}</p>
          </div>

          {/* Primary reg */}
          <div
            style={{
              background: "#f8f9fb",
              borderRadius: 12,
              padding: "14px 18px",
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>
              {t.primaryRegistrant}
            </div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              {primary.name || primary.memberName}
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 16,
                fontWeight: 700,
                color: "#b41926",
                marginTop: 4,
              }}
            >
              {primary.regNumber}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
              {primary.category} · {primary.church}
            </div>
          </div>

          {/* Family */}
          {family.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#6b7280",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: ".5px",
                }}
              >
                {t.familyMembers}
              </div>
              {family.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    background: "#f8f9fb",
                    borderRadius: 8,
                    marginBottom: 4,
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{m.name || m.memberName}</span>
                    {!m.verified && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: 10,
                          background: "#fef3c7",
                          color: "#92400e",
                          padding: "1px 5px",
                          borderRadius: 99,
                          fontWeight: 600,
                        }}
                      >
                        Não verificado
                      </span>
                    )}
                    <div style={{ fontFamily: "monospace", fontSize: 11, color: "#b41926" }}>
                      {m.regNumber}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>{m.category}</span>
                </div>
              ))}
            </div>
          )}

          {/* Totals */}
          <div
            style={{
              background: "#fdf5f5",
              borderRadius: 10,
              padding: "12px 14px",
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 13 }}>{t.totalMembers}</span>
              <strong>{regs.length}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13 }}>{t.totalFee}</span>
              <strong style={{ color: totalFee === 0 ? "#2d8a4e" : "#d4820a" }}>
                {totalFee === 0 ? "Grátis / Free" : fmt(totalFee)}
              </strong>
            </div>
          </div>

          {/* Payment note */}
          <div
            style={{
              background: "#fef3c7",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 18,
              fontSize: 12,
              color: "#92400e",
            }}
          >
            ⚠️ {t.pendingPaymentNote}
          </div>

          {/* PDF status */}
          {!pdfDone ? (
            <div
              style={{
                background: "#eff6ff",
                borderRadius: 8,
                padding: "12px 14px",
                marginBottom: 12,
                textAlign: "center",
                fontSize: 13,
                color: "#1e40af",
              }}
            >
              ⏳ {lang === "en" ? "Generating your badges PDF..." : "Gerando o PDF dos crachás..."}
            </div>
          ) : pdfError ? (
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  background: "#fff0e6",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#c4390a",
                  marginBottom: 8,
                }}
              >
                ⚠️{" "}
                {lang === "en"
                  ? "Could not auto-download. Click below:"
                  : "Não foi possível baixar automaticamente. Clique abaixo:"}
              </div>
              <button
                className="btn btn-primary"
                style={{ width: "100%", marginBottom: 8 }}
                onClick={generateBadgePDF}
              >
                📄 {lang === "en" ? "Download Badges PDF" : "Baixar PDF dos Crachás"}
              </button>
            </div>
          ) : (
            <div
              style={{
                background: "#d1fae5",
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 12,
                fontSize: 13,
                color: "#065f46",
                textAlign: "center",
              }}
            >
              ✓ {lang === "en" ? "Badges PDF downloaded!" : "PDF dos crachás baixado!"}
              {" · "}
              <button
                onClick={generateBadgePDF}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#065f46",
                  textDecoration: "underline",
                  fontSize: 13,
                  padding: 0,
                }}
              >
                {lang === "en" ? "Download again" : "Baixar novamente"}
              </button>
            </div>
          )}

          {/* Email status */}
          {emailSent ? (
            <div
              style={{
                background: "#d1fae5",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 13,
                color: "#065f46",
                marginBottom: 10,
                textAlign: "center",
              }}
            >
              📧 {lang === "en" ? "Confirmation sent to" : "Confirmação enviada para"}{" "}
              <strong>{email || CLERK_EMAIL}</strong>
              {email && (
                <span style={{ color: "#047857" }}>
                  {" & "}
                  <strong>{CLERK_EMAIL}</strong>
                </span>
              )}
            </div>
          ) : (
            <div
              style={{
                background: "#f8f9fb",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 12,
                color: "#6b7280",
                marginBottom: 10,
                textAlign: "center",
              }}
            >
              📧{" "}
              {lang === "en"
                ? "Email will be sent to registration team."
                : "Email será enviado para a equipe de inscrições."}
            </div>
          )}

          <button
            className="btn btn-ghost"
            style={{ width: "100%", marginBottom: 8 }}
            onClick={handleShare}
          >
            🔗 {t.shareConfirmation}
          </button>

          {/* Register another / Exit — only active after PDF */}
          {onReset && (
            <button
              className="btn btn-accent"
              style={{
                width: "100%",
                marginBottom: 8,
                opacity: pdfDone ? 1 : 0.5,
                cursor: pdfDone ? "pointer" : "not-allowed",
              }}
              onClick={
                pdfDone
                  ? onReset
                  : () =>
                      alert(
                        lang === "en"
                          ? "Please wait for the PDF to download first."
                          : "Aguarde o PDF ser baixado primeiro."
                      )
              }
            >
              📝 {lang === "en" ? "Register another person" : "Inscrever outra pessoa"}
            </button>
          )}
          {onHome && (
            <button
              className="btn btn-ghost"
              style={{
                width: "100%",
                opacity: pdfDone ? 1 : 0.5,
                cursor: pdfDone ? "pointer" : "not-allowed",
              }}
              onClick={
                pdfDone
                  ? onHome
                  : () =>
                      alert(
                        lang === "en"
                          ? "Please wait for the PDF to download first."
                          : "Aguarde o PDF ser baixado primeiro."
                      )
              }
            >
              {lang === "en" ? "Sign Out" : "Sair"}
            </button>
          )}
        </div>

        {/* Badge preview — matches print layout */}
        <div style={{ marginTop: 20 }}>
          <p
            style={{
              color: "rgba(255,255,255,.7)",
              fontSize: 12,
              marginBottom: 10,
              textAlign: "center",
            }}
          >
            {lang === "en"
              ? "Badge preview (3x2 landscape):"
              : "Pré-visualização dos crachás (3x2 paisagem):"}
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
              gap: 10,
            }}
          >
            {regs.map((r, i) => {
              const name = r.badgeName || r.name || r.memberName || "";
              const fullName = r.name || r.memberName || "";
              const showFull = !!fullName; // always show full name below badge name
              const church = (r.church || "").replace(/ - EUA$/, "").replace(/ - CAN$/, "");
              return (
                <div
                  key={i}
                  style={{
                    background: "#fff",
                    border: "1.5px solid #111",
                    borderRadius: 6,
                    padding: "10px 12px",
                    fontFamily: "'Helvetica Neue',Arial,sans-serif",
                    aspectRatio: "3/2",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxSizing: "border-box",
                  }}
                >
                  {/* Header */}
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 7,
                        fontWeight: 900,
                        letterSpacing: "0.12em",
                        color: "#000",
                        textTransform: "uppercase",
                      }}
                    >
                      IGREJA CRISTÃ MARANATA
                    </div>
                    <div style={{ height: 1, background: "#ccc", margin: "4px 0" }} />
                    {/* Name */}
                    <div
                      style={{
                        fontSize: name.length > 12 ? 16 : 20,
                        fontWeight: 900,
                        color: "#000",
                        lineHeight: 1.1,
                        marginTop: 4,
                      }}
                    >
                      {name}
                    </div>
                    {fullName && (
                      <div style={{ fontSize: 8, color: "#555", marginTop: 2 }}>{fullName}</div>
                    )}
                    <div style={{ fontSize: 8, color: "#444", marginTop: 3 }}>
                      {churchDisplay(r.church || "")}
                    </div>
                  </div>
                  {/* Pills */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 4,
                      flexWrap: "wrap",
                      margin: "4px 0",
                    }}
                  >
                    {[r.category, r.role].filter(Boolean).map((p, pi) => (
                      <span
                        key={pi}
                        style={{
                          border: "1px solid #000",
                          borderRadius: 3,
                          padding: "1px 7px",
                          fontSize: 7,
                          fontWeight: 700,
                          color: "#000",
                          background: "#fff",
                        }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                  {/* Footer */}
                  <div>
                    <div style={{ height: 1, background: "#ccc", marginBottom: 3 }} />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ fontSize: 6.5, color: "#666", fontFamily: "monospace" }}>
                        {r.regNumber}
                      </div>
                      <div
                        style={{
                          fontSize: 6.5,
                          color: "#666",
                          fontFamily: "monospace",
                          fontWeight: 700,
                        }}
                      >
                        {churchCode(r.church || "")}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export { PublicConfirmation };
export default PublicConfirmation;
