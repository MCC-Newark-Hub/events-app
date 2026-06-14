import { useState } from "react";
import { Search, ArrowLeft, CheckCircle2, ClipboardList, Share2, AlertTriangle } from "lucide-react";
import { STRINGS } from "@/i18n/strings";
import { CATEGORIES, ROLE_BADGE, fmt } from "@/constants";
import BadgePrint from "@/components/BadgePrint";

// Accent-insensitive search: "joao" matches "João"
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function TermsContent({ termLang, deadlineDays }) {
  const pt = termLang !== "en";
  const s = { marginBottom: 14 };
  const h = { fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "#8B0000", marginBottom: 6, marginTop: 0 };
  const p = { fontSize: 12, color: "#374151", lineHeight: 1.75, margin: "0 0 6px 0" };
  const li = { fontSize: 12, color: "#374151", lineHeight: 1.75, marginBottom: 3 };
  const em = { fontWeight: 700, color: "#1a1e2e" };

  return (
    <div>
      {/* 1 */}
      <div style={s}>
        <h4 style={h}>{pt ? "1. Status da Inscrição" : "1. Registration Status"}</h4>
        <p style={p}>
          {pt
            ? <>Sua inscrição ficará com status <span style={em}>PENDENTE</span> até que o pagamento seja confirmado. <span style={em}>A vaga no evento não está garantida</span> até a efetivação do pagamento.</>
            : <>Your registration will be <span style={em}>PENDING</span> until payment is confirmed. <span style={em}>Your spot is not guaranteed</span> until payment is received.</>}
        </p>
      </div>

      {/* 2 */}
      <div style={s}>
        <h4 style={h}>{pt ? "2. Pagamento" : "2. Payment"}</h4>
        <p style={p}>
          {pt
            ? "O pagamento deve ser efetuado presencialmente junto a um atendente, secretário(a), tesoureiro(a) ou líder de grupo autorizado pela organização do evento."
            : "Payment must be made in person to an authorized clerk, secretary, treasurer, or group leader designated by the event organization."}
        </p>
        <ul style={{ paddingLeft: 18, margin: "4px 0 0" }}>
          <li style={li}>{pt ? <><span style={em}>O participante</span> é responsável pela sua inscrição.</> : <><span style={em}>The participant</span> is responsible for their own registration.</>}</li>
          <li style={li}>{pt ? <>Somente a <span style={em}>equipe autorizada</span> pode receber pagamentos.</> : <>Only <span style={em}>authorized staff</span> may receive payments.</>}</li>
          <li style={li}>{pt ? <><span style={em}>Não aceitamos pagamentos online.</span></> : <><span style={em}>We do not accept online payments.</span></>}</li>
        </ul>
      </div>

      {/* 3 — Cancellation with deadline callout */}
      <div style={s}>
        <h4 style={h}>{pt ? "3. Cancelamento" : "3. Cancellation"}</h4>
        {deadlineDays && (
          <div style={{ background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 8, padding: "10px 12px", marginBottom: 8, display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            <p style={{ ...p, margin: 0, color: "#991b1b" }}>
              {pt
                ? <><span style={{ fontWeight: 800 }}>Inscrições não pagas serão CANCELADAS automaticamente após {deadlineDays} dias</span> sem confirmação de pagamento.</>
                : <><span style={{ fontWeight: 800 }}>Unpaid registrations will be AUTOMATICALLY CANCELLED after {deadlineDays} days</span> without payment confirmation.</>}
            </p>
          </div>
        )}
        <ul style={{ paddingLeft: 18, margin: "4px 0 0" }}>
          <li style={li}>{pt ? "Cancelamentos devem ser comunicados com pelo menos 48 horas de antecedência." : "Cancellations must be communicated at least 48 hours in advance."}</li>
          <li style={li}>{pt ? <><span style={em}>Após esse prazo, a taxa não será reembolsada.</span></> : <><span style={em}>After this period, the fee will not be refunded.</span></>}</li>
          <li style={li}>{pt ? <>Você pode cancelar sua inscrição através desta plataforma, na opção <em>Consultar Inscrição</em> na tela inicial.</> : <>You can cancel your registration via the <em>Consultar Inscrição</em> option on the home screen.</>}</li>
        </ul>
      </div>

      {/* 4 */}
      <div style={s}>
        <h4 style={h}>{pt ? "4. Lista de Espera" : "4. Waitlist"}</h4>
        <p style={p}>
          {pt
            ? "Caso o evento atinja a capacidade máxima, sua inscrição poderá ser colocada em lista de espera. Você será notificado caso uma vaga se abra."
            : "If the event reaches maximum capacity, your registration may be placed on a waitlist. You will be notified if a spot becomes available."}
        </p>
      </div>

      {/* 5 */}
      <div style={s}>
        <h4 style={h}>{pt ? "5. Código de Conduta" : "5. Code of Conduct"}</h4>
        <p style={p}>
          {pt
            ? "Ao participar deste evento, você concorda em respeitar os valores e a cultura da Igreja Cristã Maranatha, tratando todos os participantes com respeito e dignidade."
            : "By attending this event, you agree to respect the values and culture of Igreja Cristã Maranatha, treating all participants with respect and dignity."}
        </p>
      </div>

      {/* 6 */}
      <div style={{ ...s, marginBottom: 0 }}>
        <h4 style={h}>{pt ? "6. Fotos e Vídeos" : "6. Photos & Videos"}</h4>
        <p style={{ ...p, marginBottom: 0 }}>
          {pt
            ? "O evento poderá ser fotografado e filmado para fins institucionais. Ao se inscrever, você consente com o uso de sua imagem para fins internos da igreja."
            : "The event may be photographed and filmed for institutional purposes. By registering, you consent to the use of your image for internal church purposes."}
        </p>
      </div>
    </div>
  );
}

function getRegStatus(reg) {
  if (reg.waitlisted) return { label: "Lista de Espera", color: "#92400e", bg: "#fef3c7" };
  if (reg.excedente)  return { label: "Excedente",       color: "#7c3aed", bg: "#ede9fe" };
  if (reg.exempt)     return { label: "Isento",          color: "#065f46", bg: "#d1fae5" };
  if (reg.paid)       return { label: "Pago",            color: "#065f46", bg: "#d1fae5" };
  return               { label: "Pendente",              color: "#b45309", bg: "#fef3c7" };
}

function dateFromRegNumber(regNumber) {
  const d = (regNumber || "").split("-")[1] || "";
  return d.length === 8 ? `${d.slice(6, 8)}/${d.slice(4, 6)}/${d.slice(0, 4)}` : "";
}

const CLERK_EMAIL = "mccnewark.registrations@gmail.com";

function PublicConfirmationInline({ regs, email, event, lang, t, onReset, onHome }) {
  const primary = regs[0];
  const family = regs.slice(1);
  const totalFee = regs.reduce((s, r) => s + r.fee, 0);
  const deadlineDays = event?.payment_deadline_days ?? event?.paymentDeadlineDays ?? null;
  const pt = lang !== "en";

  const handleShare = () => {
    const text =
      (primary.name || primary.memberName) + "\n" + primary.regNumber + "\n" +
      t.totalMembers + ": " + regs.length + "\n" +
      t.totalFee + ": " + (totalFee === 0 ? "Grátis / Free" : fmt(totalFee));
    if (navigator.share) { navigator.share({ title: t.confirmationTitle, text }); }
    else { navigator.clipboard?.writeText(text); alert(lang === "en" ? "Copied!" : "Copiado!"); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#8B0000 0%,#b41926 50%,#03223f 100%)", padding: "24px 16px" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 6 }}>
          {onHome && (
            <button onClick={onHome} style={{ background: "none", border: "none", color: "rgba(255,255,255,.8)", fontSize: 13, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
              <ArrowLeft size={14} /> {lang === "en" ? "Home" : "Início"}
            </button>
          )}
        </div>

        <div style={{ background: "#fff", borderRadius: 20, padding: "28px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <CheckCircle2 size={52} color="#2d8a4e" />
            </div>
            <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 22, marginBottom: 4 }}>{t.confirmationTitle}</h2>
            <p style={{ color: "#6b7280", fontSize: 13 }}>{t.confirmationSub}</p>
          </div>

          {/* Primary registrant */}
          <div style={{ background: "#f8f9fb", borderRadius: 12, padding: "14px 18px", marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>{t.primaryRegistrant}</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{primary.name || primary.memberName}</div>
            <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: "#b41926", marginTop: 4 }}>{primary.regNumber}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{primary.category} · {primary.church}</div>
          </div>

          {/* Family members */}
          {family.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".5px" }}>{t.familyMembers}</div>
              {family.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f8f9fb", borderRadius: 8, marginBottom: 4 }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{m.name || m.memberName}</span>
                    {!m.verified && <span style={{ marginLeft: 6, fontSize: 10, background: "#fef3c7", color: "#92400e", padding: "1px 5px", borderRadius: 99, fontWeight: 600 }}>Não verificado</span>}
                    <div style={{ fontFamily: "monospace", fontSize: 11, color: "#b41926" }}>{m.regNumber}</div>
                  </div>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>{m.category}</span>
                </div>
              ))}
            </div>
          )}

          {/* Payment card */}
          {totalFee > 0 ? (
            <div style={{ border: "2px solid #b41926", borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
              {/* Fee amount — hero element */}
              <div style={{ background: "#b41926", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: "rgba(255,255,255,.75)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>
                    {pt ? "Total a Pagar" : "Total Due"}
                  </div>
                  <div style={{ color: "rgba(255,255,255,.65)", fontSize: 11 }}>
                    {regs.length === 1
                      ? (pt ? "1 participante" : "1 participant")
                      : (pt ? `${regs.length} participantes` : `${regs.length} participants`)}
                  </div>
                </div>
                <div style={{ color: "#fff", fontSize: 30, fontWeight: 800, fontFamily: "monospace", letterSpacing: "-.5px" }}>
                  {fmt(totalFee)}
                </div>
              </div>

              {/* How to pay */}
              <div style={{ padding: "14px 18px" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#1a1e2e", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>
                  {pt ? "Como efetuar o pagamento" : "How to pay"}
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
                  <li style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
                    {pt
                      ? "Procure um atendente, secretário(a), tesoureiro(a) ou líder de grupo autorizado pelo evento"
                      : "Find an authorized clerk, secretary, treasurer, or group leader at the event"}
                  </li>
                  <li style={{ fontSize: 13, color: "#374151", fontWeight: 600, lineHeight: 1.5 }}>
                    {pt ? "Pagamento somente presencial — não aceitamos pagamentos online" : "In-person payment only — we do not accept online payments"}
                  </li>
                  <li style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
                    {pt
                      ? <>Informe o número de inscrição <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#b41926" }}>{primary.regNumber}</span> ao efetuar o pagamento</>
                      : <>Provide your registration number <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#b41926" }}>{primary.regNumber}</span> when paying</>}
                  </li>
                </ul>

                {/* Deadline warning inside payment card */}
                {deadlineDays && (
                  <div style={{ marginTop: 12, background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 8, padding: "10px 12px", display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.4 }}>⚠️</span>
                    <p style={{ margin: 0, fontSize: 13, color: "#991b1b", lineHeight: 1.5 }}>
                      {pt
                        ? <><strong>Efetue o pagamento em até {deadlineDays} dias.</strong> Após esse prazo, sua inscrição será cancelada automaticamente.</>
                        : <><strong>Complete payment within {deadlineDays} days.</strong> After this period, your registration will be automatically cancelled.</>}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ background: "#d1fae5", border: "1.5px solid #6ee7b7", borderRadius: 12, padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
              <CheckCircle2 size={28} color="#059669" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, color: "#065f46", fontSize: 15 }}>
                  {pt ? "Isento de Pagamento" : "No Payment Required"}
                </div>
                <div style={{ fontSize: 12, color: "#047857", marginTop: 2 }}>
                  {pt ? "Sua inscrição não requer pagamento de taxa." : "Your registration does not require a fee."}
                </div>
              </div>
            </div>
          )}

          <BadgePrint regs={regs} event={event} lang={lang} />

          <button className="btn btn-ghost" style={{ width: "100%", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={handleShare}>
            <Share2 size={14} /> {t.shareConfirmation}
          </button>

          {onReset && (
            <button className="btn btn-accent" style={{ width: "100%", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={onReset}>
              <ClipboardList size={16} /> {lang === "en" ? "Register another person" : "Inscrever outra pessoa"}
            </button>
          )}
          {onHome && (
            <button className="btn btn-ghost" style={{ width: "100%" }} onClick={onHome}>
              {lang === "en" ? "Sign Out" : "Sair"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PublicPortal({ event, members: propMembers, loading, regs, addReg, lang, setLang, onReset }) {
  const t = STRINGS[lang || "pt"];
  const [step, setStep] = useState(1);
  const [primary, setPrimary] = useState(null);
  const [primarySearch, setPrimarySearch] = useState("");
  const [primaryNotFound, setPrimaryNotFound] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [famSearch, setFamSearch] = useState("");
  const [famNotFound, setFamNotFound] = useState(false);
  const [showManualFam, setShowManualFam] = useState(false);
  const [manualFam, setManualFam] = useState({ name: "", gender: "M", category: "Adulto" });
  const [contact, setContact] = useState({ phone: "", email: "", whatsapp: true });
  const [translations, setTranslations] = useState({ en: false, es: false });
  const [allergies, setAllergies] = useState({ hasAny: false, other: "" });
  const [specialNeeds, setSpecialNeeds] = useState({ hasAny: false, other: "" });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [deadlineAccepted, setDeadlineAccepted] = useState(false);
  const [deadlineError, setDeadlineError] = useState(false);
  const [termLang, setTermLang] = useState(lang || "pt");
  const [submitted, setSubmitted] = useState(null);
  const [errors, setErrors] = useState({});

  const deadlineDays = event?.payment_deadline_days ?? event?.paymentDeadlineDays ?? null;

  const allMembers = propMembers || [];
  const existingMemberIds = (regs || []).filter((r) => r.eventId === event?.id && !r.cancelled && r.memberId !== "GUEST").map((r) => r.memberId);
  // Include already-registered members in primary search so we can show their status
  const primaryResults = primarySearch.length > 0 ? allMembers.filter((m) => norm(m.name).includes(norm(primarySearch))).slice(0, 20) : [];
  const famResults = famSearch.length > 0 ? allMembers.filter((m) => norm(m.name).includes(norm(famSearch)) && m.id !== primary?.id && !familyMembers.find((fm) => fm.id === m.id)).slice(0, 8) : [];
  const existingReg = primary ? (regs || []).find((r) => r.eventId === event?.id && r.memberId === primary.id && !r.cancelled) : null;

  const eventFee = (cat) => event?.fees?.[cat] ?? 0;
  const allParticipants = primary ? [primary, ...familyMembers] : [];
  const totalFee = allParticipants.reduce((s, m) => s + (m.role === "Pastor" ? 0 : eventFee(m.category)), 0);

  const validateStep1 = () => {
    const e = {};
    if (!primary) e.primary = "Por favor, pesquise e selecione o seu nome.";
    if (existingReg) e.primary = "Este participante já está inscrito neste evento.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!termsAccepted) { setTermsError(true); return; }
    if (deadlineDays && !deadlineAccepted) { setDeadlineError(true); return; }
    if (!addReg) return;
    // Batch token groups all regs from this submission for family lookup, even when contact info is empty
    const batchId = "B" + Date.now();
    const sharedNote = [
      "[" + batchId + "]",
      contact.phone ? "Tel: " + contact.phone : "",
      contact.email ? "Email: " + contact.email : "",
      allergies.hasAny ? "Alergias: " + allergies.other : "",
      specialNeeds.hasAny ? "Nec. especiais: " + specialNeeds.other : "",
    ].filter(Boolean).join(" | ");
    const submittedRegs = allParticipants.map((m) => {
      const isVerifiedMember = m.verified !== false && m.id && !m.id.startsWith("MANUAL-");
      return addReg({
        memberId: isVerifiedMember ? m.id : "GUEST",
        memberName: m.name,
        badgeName: m.badgeName || m.name,
        category: m.category || "Adulto",
        church: m.church || "",
        role: m.role || "",
        familyId: null,
        team: "Participante",
        paid: false,
        exempt: false,
        needsTranslation: translations.en || translations.es,
        note: sharedNote,
      });
    });
    setSubmitted({ regs: submittedRegs, email: contact.email });
  };

  if (submitted)
    return (
      <PublicConfirmationInline
        regs={submitted.regs}
        email={submitted.email}
        event={event}
        lang={lang}
        setLang={setLang}
        t={t}
        onReset={() => {
          setStep(1); setPrimary(null); setPrimarySearch(""); setFamilyMembers([]);
          setContact({ phone: "", email: "", whatsapp: true });
          setTranslations({ en: false, es: false });
          setAllergies({ hasAny: false, other: "" });
          setSpecialNeeds({ hasAny: false, other: "" });
          setTermsAccepted(false); setDeadlineAccepted(false); setSubmitted(null);
        }}
        onHome={onReset}
      />
    );

  const stepLabels = [t.step1, t.step2, t.step3, t.step4];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#8B0000 0%,#b41926 50%,#03223f 100%)", padding: "24px 16px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <button onClick={onReset || undefined} style={{ background: "none", border: "none", color: "rgba(255,255,255,.8)", fontSize: 13, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
            {onReset && <><ArrowLeft size={14} /> {lang === "en" ? "Home" : "Início"}</>}
            {!onReset && <span style={{ opacity: 0.7 }}>ICM Maranatha</span>}
          </button>
        </div>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <h1 style={{ fontFamily: "'Lora',Georgia,serif", color: "#fff", fontSize: 24, marginBottom: 4 }}>{event?.name}</h1>
          <p style={{ color: "rgba(255,255,255,.75)", fontSize: 13 }}>
            {event?.date} · {event?.time} · {event?.location}
          </p>
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 20, justifyContent: "center" }}>
          {stepLabels.map((label, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: step > i + 1 ? "#f8f7f3" : step === i + 1 ? "#f8f7f3" : "rgba(255,255,255,.25)", color: step > i + 1 ? "#8B0000" : step === i + 1 ? "#8B0000" : "rgba(255,255,255,.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              {i < stepLabels.length - 1 && <div style={{ width: 24, height: 2, background: step > i + 1 ? "#f8f7f3" : "rgba(255,255,255,.25)" }} />}
            </div>
          ))}
        </div>

        <div style={{ background: "#fff", borderRadius: 20, padding: "24px 20px" }}>
          {step === 1 && (
            <div>
              <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, fontWeight: 700, color: "#03223f", marginBottom: 4 }}>1. {t.step1}</h3>
              <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 18 }}>Search for your name in our member directory.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label>{t.searchName} *</label>
                  <div className="sb">
                    <span className="si-icon"><Search size={16} /></span>
                    <input value={primarySearch} onChange={(e) => { setPrimarySearch(e.target.value); setPrimary(null); setPrimaryNotFound(false); setErrors({}); }} placeholder={t.searchPlaceholder} />
                  </div>
                  {primaryResults.length > 0 && !primary && (
                    <div style={{ border: "1.5px solid var(--border)", borderRadius: 8, marginTop: 4, overflow: "hidden", maxHeight: 200, overflowY: "auto" }}>
                      {primaryResults.map((m) => {
                        const alreadyReg = existingMemberIds.includes(m.id);
                        return (
                          <div key={m.id} onClick={() => { setPrimary(m); setPrimarySearch(m.name); setPrimaryNotFound(false); }} style={{ padding: "10px 14px", cursor: "pointer", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: alreadyReg ? "#fff7ed" : "" }} onMouseEnter={(e) => (e.currentTarget.style.background = alreadyReg ? "#fef3c7" : "#eff6ff")} onMouseLeave={(e) => (e.currentTarget.style.background = alreadyReg ? "#fff7ed" : "")}>
                            <div>
                              <span style={{ fontWeight: 600 }}>{m.name}</span>
                              <span style={{ marginLeft: 8, fontSize: 12, color: "#6b7280" }}>{m.church}</span>
                              {alreadyReg && <span style={{ marginLeft: 6, fontSize: 10, background: "#fee2e2", color: "#991b1b", padding: "1px 6px", borderRadius: 99, fontWeight: 700 }}>Já inscrito</span>}
                            </div>
                            <div style={{ display: "flex", gap: 5 }}><span className="badge badge-blue">{m.category}</span>{m.role && <span className={`badge ${ROLE_BADGE[m.role]}`}>{m.role}</span>}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {allMembers.length === 0 && loading && (
                    <p style={{ fontSize: 12, color: "#6b7280", marginTop: 6, textAlign: "center" }}>
                      ⏳ Carregando membros... aguarde um momento.
                    </p>
                  )}
                  {allMembers.length === 0 && !loading && (
                    <div style={{ marginTop: 6, textAlign: "center" }}>
                      <p style={{ fontSize: 12, color: "#c0392b", marginBottom: 4 }}>
                        Nenhum membro carregado. Verifique sua conexão e tente recarregar.
                      </p>
                      <button className="btn btn-ghost btn-sm" onClick={() => window.location.reload()} style={{ fontSize: 12 }}>
                        ↺ Recarregar
                      </button>
                    </div>
                  )}
                  {!primary && allMembers.length > 0 && primarySearch.length === 0 && (
                    <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>
                      {allMembers.length} membros disponíveis — digite para buscar
                    </p>
                  )}
                  {primarySearch.length > 0 && primaryResults.length === 0 && !primary && (
                    <div style={{ marginTop: 8, padding: "10px 14px", background: "#fef3c7", borderRadius: 8, fontSize: 13, color: "#92400e" }}>{t.nameNotFound} {t.nameNotFoundClerk}</div>
                  )}
                  {primary && existingReg && (() => {
                    const status = getRegStatus(existingReg);
                    return (
                      <div style={{ marginTop: 8, background: "#fff7ed", border: "1.5px solid #f59e0b", borderRadius: 10, padding: "14px 16px" }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#78350f", marginBottom: 8 }}>Participante já inscrito neste evento</div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{primary.name}</div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{primary.category} · {primary.church}</div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
                          <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "#b41926" }}>{existingReg.regNumber}</span>
                          <span style={{ fontSize: 12, color: "#6b7280" }}>{dateFromRegNumber(existingReg.regNumber)}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 99, background: status.bg, color: status.color }}>{status.label}</span>
                        </div>
                        <p style={{ fontSize: 12, color: "#78350f", marginTop: 10, marginBottom: 8 }}>
                          Se precisar de ajuda, fale com um atendente.
                        </p>
                        <button onClick={() => { setPrimary(null); setPrimarySearch(""); }} style={{ background: "none", border: "1px solid #f59e0b", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", color: "#92400e" }}>
                          Buscar outro nome
                        </button>
                      </div>
                    );
                  })()}
                  {primary && !existingReg && (
                    <div style={{ marginTop: 8, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "10px 14px", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div><strong>{primary.name}</strong><span style={{ marginLeft: 8, color: "#6b7280" }}>{primary.category} · {primary.church}</span></div>
                      <button onClick={() => { setPrimary(null); setPrimarySearch(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 18 }}>×</button>
                    </div>
                  )}
                  {errors.primary && <p style={{ color: "#c0392b", fontSize: 12, marginTop: 4 }}>{errors.primary}</p>}
                </div>

                <button className="btn btn-primary" style={{ padding: 12, fontSize: 15 }} onClick={() => { if (validateStep1()) setStep(2); }}>
                  {lang === "en" ? "Next: Family →" : "Próximo: Família →"}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, fontWeight: 700, color: "#03223f", marginBottom: 4 }}>2. {t.step2}</h3>
              <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>{lang === "en" ? "Add family members. Skip if registering alone." : "Adicione membros da família. Pule se for sozinho."}</p>

              {primary && (
                <div style={{ background: "#f8f9fb", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".5px" }}>{t.primaryRegistrant}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600 }}>{primary.name}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span className="badge badge-blue">{primary.category}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#2d8a4e" }}>{primary.role === "Pastor" ? "Isento" : eventFee(primary.category) === 0 ? "Grátis" : fmt(eventFee(primary.category))}</span>
                    </div>
                  </div>
                </div>
              )}

              {familyMembers.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".5px" }}>{t.familyMembers}</div>
                  {familyMembers.map((m, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", background: "#f8f9fb", borderRadius: 8, marginBottom: 6 }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>{m.name}</span>
                        {!m.verified && <span style={{ marginLeft: 8, fontSize: 10, color: "#92400e", background: "#fef3c7", padding: "1px 6px", borderRadius: 99, fontWeight: 600 }}>Unverified</span>}
                        <span style={{ marginLeft: 8, fontSize: 12, color: "#6b7280" }}>{m.category} · {m.gender}</span>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#2d8a4e" }}>{eventFee(m.category) === 0 ? "Grátis" : fmt(eventFee(m.category))}</span>
                        <button onClick={() => setFamilyMembers((prev) => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 18, lineHeight: 1 }}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <label>{t.addFamilyMember}</label>
                <div className="sb">
                  <span className="si-icon"><Search size={16} /></span>
                  <input value={famSearch} onChange={(e) => { setFamSearch(e.target.value); setFamNotFound(false); }} placeholder={t.searchPlaceholder} />
                </div>
                {famResults.length > 0 && (
                  <div style={{ border: "1.5px solid var(--border)", borderRadius: 8, marginTop: 4, overflow: "hidden", maxHeight: 180, overflowY: "auto" }}>
                    {famResults.map((m) => {
                      const alreadyReg = existingMemberIds.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          onClick={() => { if (!alreadyReg) { setFamilyMembers((prev) => [...prev, { ...m, verified: true }]); setFamSearch(""); } }}
                          style={{ padding: "9px 14px", cursor: alreadyReg ? "default" : "pointer", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: alreadyReg ? "#f9fafb" : "" }}
                          onMouseEnter={(e) => { if (!alreadyReg) e.currentTarget.style.background = "#eff6ff"; }}
                          onMouseLeave={(e) => { if (!alreadyReg) e.currentTarget.style.background = ""; }}
                        >
                          <div>
                            <span style={{ fontWeight: 600, color: alreadyReg ? "#6b7280" : "inherit" }}>{m.name}</span>
                            {alreadyReg && <span style={{ marginLeft: 6, fontSize: 10, background: "#fee2e2", color: "#991b1b", padding: "1px 6px", borderRadius: 99, fontWeight: 700 }}>Já inscrito</span>}
                          </div>
                          <div style={{ display: "flex", gap: 5 }}>
                            <span className="badge badge-blue">{m.category}</span>
                            <span style={{ fontSize: 12, color: "#6b7280" }}>{m.gender}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {famSearch.length > 1 && famResults.length === 0 && <div style={{ marginTop: 8, padding: "10px 14px", background: "#fef3c7", borderRadius: 8, fontSize: 13, color: "#92400e" }}>{t.nameNotFound}</div>}
              </div>

              <div>
                <div className="cb" style={{ marginBottom: 10 }}>
                  <input type="checkbox" id="cantfind" checked={showManualFam} onChange={(e) => setShowManualFam(e.target.checked)} />
                  <label htmlFor="cantfind">{t.cantFindMember}</label>
                </div>
                {showManualFam && (
                  <div style={{ background: "#fffbeb", border: "1px solid #f59e0b", borderRadius: 10, padding: "14px" }}>
                    <p style={{ fontSize: 12, color: "#92400e", marginBottom: 10 }}>{t.nameNotFoundClerk}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div><label>{t.manualMemberName}</label><input value={manualFam.name} onChange={(e) => setManualFam({ ...manualFam, name: e.target.value })} /></div>
                      <div className="fr">
                        <div><label>{t.manualMemberGender}</label><select value={manualFam.gender} onChange={(e) => setManualFam({ ...manualFam, gender: e.target.value })}><option value="M">{t.genderM}</option><option value="F">{t.genderF}</option></select></div>
                        <div><label>{t.manualMemberCategory}</label><select value={manualFam.category} onChange={(e) => setManualFam({ ...manualFam, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c} value={c}>{c} — {eventFee(c) === 0 ? "Grátis" : fmt(eventFee(c))}</option>)}</select></div>
                      </div>
                      <button className="btn btn-warn btn-sm" onClick={() => { if (!manualFam.name) return; setFamilyMembers((prev) => [...prev, { ...manualFam, id: "MANUAL-" + Date.now(), verified: false, role: "", church: "", badgeName: manualFam.name }]); setManualFam({ name: "", gender: "M", category: "Adulto" }); setShowManualFam(false); }}>
                        + {lang === "en" ? "Add Unverified Member" : "Adicionar Membro Não Verificado"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {allParticipants.length > 0 && (
                <div style={{ background: "var(--sidebar-active-bg,#fdf5f5)", borderRadius: 10, padding: "12px 14px", marginTop: 14, marginBottom: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span>{t.totalMembers}: <strong>{allParticipants.length}</strong></span>
                    <span>{t.totalFee}: <strong style={{ color: "#1a3a6b" }}>{totalFee === 0 ? "Grátis" : fmt(totalFee)}</strong></span>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button className="btn btn-ghost" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }} onClick={() => setStep(1)}><ArrowLeft size={14} /> {t.back}</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => setStep(3)}>{lang === "en" ? "Next: Health →" : "Próximo: Saúde →"}</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, fontWeight: 700, color: "#03223f", marginBottom: 4 }}>3. {t.step3}</h3>
              <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>{lang === "en" ? "This information helps us prepare the event safely for everyone." : "Essas informações nos ajudam a preparar o evento com segurança para todos."}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <div className="cb" style={{ marginBottom: 10 }}><input type="checkbox" id="hasAllergies" checked={allergies.hasAny} onChange={(e) => setAllergies((prev) => ({ ...prev, hasAny: e.target.checked, other: e.target.checked ? prev.other : "" }))} /><label htmlFor="hasAllergies" style={{ fontSize: 14, fontWeight: 600, color: "#1a1e2e" }}>{t.allergiesTitle}</label></div>
                  {allergies.hasAny && <textarea rows={3} value={allergies.other} onChange={(e) => setAllergies({ ...allergies, other: e.target.value })} placeholder={lang === "en" ? "Describe your allergies or dietary restrictions..." : "Descreva suas alergias ou restrições alimentares..."} style={{ marginTop: 4 }} />}
                </div>
                <div>
                  <div className="cb" style={{ marginBottom: 10 }}><input type="checkbox" id="hasSpecialNeeds" checked={specialNeeds.hasAny} onChange={(e) => setSpecialNeeds((prev) => ({ ...prev, hasAny: e.target.checked, other: e.target.checked ? prev.other : "" }))} /><label htmlFor="hasSpecialNeeds" style={{ fontSize: 14, fontWeight: 600, color: "#1a1e2e" }}>{t.specialNeedsTitle}</label></div>
                  {specialNeeds.hasAny && <textarea rows={3} value={specialNeeds.other} onChange={(e) => setSpecialNeeds({ ...specialNeeds, other: e.target.value })} placeholder={lang === "en" ? "Describe any special needs..." : "Descreva as necessidades especiais..."} style={{ marginTop: 4 }} />}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                <button className="btn btn-ghost" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }} onClick={() => setStep(2)}><ArrowLeft size={14} /> {t.back}</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => setStep(4)}>{lang === "en" ? "Next: Contact & Terms →" : "Próximo: Contato & Termos →"}</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, marginBottom: 14 }}>4. {t.step4}</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                <div>
                  <label>{t.phone} <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400, textTransform: "none" }}>(WhatsApp — {lang === "en" ? "optional" : "opcional"})</span></label>
                  <input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
                </div>
                <div>
                  <label>{t.email} <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400, textTransform: "none" }}>({lang === "en" ? "optional" : "opcional"})</span></label>
                  <input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} placeholder="seu@email.com" />
                </div>
                <div>
                  <label>{t.translationNeededLabel}</label>
                  <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                    <div className="cb"><input type="checkbox" id="ten" checked={translations.en} onChange={(e) => setTranslations({ ...translations, en: e.target.checked })} /><label htmlFor="ten">{t.translationEN}</label></div>
                    <div className="cb"><input type="checkbox" id="tes" checked={translations.es} onChange={(e) => setTranslations({ ...translations, es: e.target.checked })} /><label htmlFor="tes">{t.translationES}</label></div>
                  </div>
                </div>
              </div>

              {/* Language tabs */}
              <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 8, padding: 3, marginBottom: 10, gap: 2 }}>
                {[{ key: "pt", label: "Português" }, { key: "en", label: "English" }].map(({ key, label }) => (
                  <button key={key} onClick={() => setTermLang(key)} style={{ flex: 1, padding: "6px 0", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", borderRadius: 6, background: termLang === key ? "#fff" : "transparent", color: termLang === key ? "#1a1e2e" : "#6b7280", boxShadow: termLang === key ? "0 1px 3px rgba(0,0,0,.1)" : "none" }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Formatted terms */}
              <div style={{ background: "#f8f9fb", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 18px", maxHeight: 300, overflowY: "auto", marginBottom: 16 }}>
                <TermsContent termLang={termLang} deadlineDays={deadlineDays} />
              </div>

              {/* Deadline acknowledgement — shown only when event has a deadline */}
              {deadlineDays && (
                <div style={{ background: deadlineError ? "#fef2f2" : "#fff7ed", border: `1.5px solid ${deadlineError ? "#fca5a5" : "#f59e0b"}`, borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 8 }}>
                    <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1 }}>⚠️</span>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#92400e", lineHeight: 1.5 }}>
                      {termLang === "en"
                        ? <>Unpaid registrations are <span style={{ color: "#dc2626" }}>automatically cancelled after {deadlineDays} days</span>. Payment must be made in person with authorized staff.</>
                        : <>Inscrições não pagas são <span style={{ color: "#dc2626" }}>canceladas automaticamente após {deadlineDays} dias</span>. O pagamento deve ser feito presencialmente com a equipe autorizada.</>}
                    </p>
                  </div>
                  <div className="cb">
                    <input type="checkbox" id="deadline-ack" checked={deadlineAccepted} onChange={(e) => { setDeadlineAccepted(e.target.checked); setDeadlineError(false); }} />
                    <label htmlFor="deadline-ack" style={{ fontSize: 13, fontWeight: 600, color: "#78350f" }}>
                      {termLang === "en"
                        ? `I understand my registration will be cancelled after ${deadlineDays} days without payment.`
                        : `Entendo que minha inscrição será cancelada após ${deadlineDays} dias sem pagamento.`}
                    </label>
                  </div>
                  {deadlineError && <p style={{ color: "#dc2626", fontSize: 12, marginTop: 6, marginBottom: 0, display: "flex", alignItems: "center", gap: 4 }}><AlertTriangle size={12} /> {termLang === "en" ? "Please confirm you understand the cancellation policy." : "Por favor, confirme que entendeu a política de cancelamento."}</p>}
                </div>
              )}

              {/* General terms checkbox */}
              <div className="cb" style={{ marginBottom: 8 }}>
                <input type="checkbox" id="terms" checked={termsAccepted} onChange={(e) => { setTermsAccepted(e.target.checked); setTermsError(false); }} />
                <label htmlFor="terms" style={{ fontSize: 14, fontWeight: 600, color: "#1a1e2e" }}>{t.termsAccept}</label>
              </div>
              {termsError && <p style={{ color: "#c0392b", fontSize: 13, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}><AlertTriangle size={13} /> {t.termsRequired}</p>}

              <div style={{ background: "var(--sidebar-active-bg,#fdf5f5)", borderRadius: 10, padding: "12px 14px", marginBottom: 14, fontSize: 13 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{lang === "en" ? "Registration Summary:" : "Resumo da Inscrição:"}</div>
                <div>{primary?.name} {familyMembers.length > 0 && `+ ${familyMembers.length} ${t.familyMembers.toLowerCase()}`}</div>
                <div style={{ marginTop: 4 }}>{t.totalFee}: <strong>{totalFee === 0 ? "Grátis" : fmt(totalFee)}</strong></div>
                <div style={{ marginTop: 4, color: "#6b7280" }}>{t.pendingPaymentNote}</div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-ghost" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }} onClick={() => setStep(3)}><ArrowLeft size={14} /> {t.back}</button>
                <button className="btn btn-accent" style={{ flex: 2, fontSize: 15 }} onClick={handleSubmit}>{lang === "en" ? "Submit Registration" : "Confirmar Inscrição"} →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { PublicConfirmationInline as PublicConfirmation };
export default PublicPortal;
