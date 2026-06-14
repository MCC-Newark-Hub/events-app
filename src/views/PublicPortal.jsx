import { useState } from "react";
import { Search, ArrowLeft, CheckCircle2, ClipboardList, Share2, AlertTriangle, MailOpen } from "lucide-react";
import { STRINGS } from "@/i18n/strings";
import { CATEGORIES, ROLE_BADGE, fmt } from "@/constants";
import BadgePrint from "@/components/BadgePrint";

// Accent-insensitive search: "joao" matches "João"
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const TERMS_TEXT = `CONDIÇÕES DE INSCRIÇÃO / REGISTRATION CONDITIONS

1. STATUS DA INSCRIÇÃO / REGISTRATION STATUS
Sua inscrição está PENDENTE até que o pagamento seja confirmado. A vaga no evento não está garantida até a efetivação do pagamento.
Your registration is PENDING until payment is confirmed. Your spot at the event is not guaranteed until payment is received.

2. PAGAMENTO / PAYMENT
O pagamento deve ser efetuado presencialmente, com um dos responsáveis pelas inscrições. Sua vaga só será confirmada após o pagamento da taxa de inscrição. Não aceitamos pagamentos online.
Payment must be made in person with one of the registration coordinators. Your spot will only be confirmed after the registration fee is paid. We do not accept online payments.

3. CANCELAMENTO / CANCELLATION
Cancelamentos devem ser comunicados com pelo menos 48 horas de antecedência. Após esse prazo, a taxa de inscrição não será reembolsada.
Cancellations must be communicated at least 48 hours in advance. After this period, the registration fee will not be refunded.

4. LISTA DE ESPERA / WAITLIST
Caso o evento atinja a capacidade máxima, sua inscrição poderá ser colocada em lista de espera. Você será notificado caso uma vaga se abra.
If the event reaches maximum capacity, your registration may be placed on a waitlist. You will be notified if a spot becomes available.

5. CÓDIGO DE CONDUTA / CODE OF CONDUCT
Ao participar deste evento, você concorda em respeitar os valores e a cultura da Igreja Cristã Maranatha, tratando todos os participantes com respeito e dignidade.
By attending this event, you agree to respect the values and culture of Igreja Cristã Maranatha, treating all participants with respect and dignity.

6. FOTOS E VÍDEOS / PHOTOS AND VIDEOS
O evento poderá ser fotografado e filmado para fins institucionais. Ao se inscrever, você consente com o uso de sua imagem para fins internos da igreja.
The event may be photographed and filmed for institutional purposes. By registering, you consent to the use of your image for internal church purposes.`;

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
  const [pdfDone, setPdfDone] = useState(false);

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

          <div style={{ background: "#f8f9fb", borderRadius: 12, padding: "14px 18px", marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>{t.primaryRegistrant}</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{primary.name || primary.memberName}</div>
            <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: "#b41926", marginTop: 4 }}>{primary.regNumber}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{primary.category} · {primary.church}</div>
          </div>

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

          <div style={{ background: "#fdf5f5", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 13 }}>{t.totalMembers}</span>
              <strong>{regs.length}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13 }}>{t.totalFee}</span>
              <strong style={{ color: totalFee === 0 ? "#2d8a4e" : "#d4820a" }}>{totalFee === 0 ? "Grátis / Free" : fmt(totalFee)}</strong>
            </div>
          </div>

          <div style={{ background: "#fef3c7", borderRadius: 8, padding: "10px 14px", marginBottom: 18, fontSize: 12, color: "#92400e", display: "flex", alignItems: "flex-start", gap: 6 }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {t.pendingPaymentNote}
          </div>

          <BadgePrint regs={regs} event={event} lang={lang} />

          <div style={{ background: "#d1fae5", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#065f46", marginBottom: 10, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <MailOpen size={14} /> {lang === "en" ? "Confirmation will be sent to registration team." : "Confirmação será enviada para a equipe de inscrições."}
          </div>

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
  const [submitted, setSubmitted] = useState(null);
  const [errors, setErrors] = useState({});

  const allMembers = propMembers || [];
  const existingMemberIds = (regs || []).filter((r) => r.eventId === event?.id && !r.cancelled && r.memberId !== "GUEST").map((r) => r.memberId);
  // Include already-registered members in primary search so we can show their status
  const primaryResults = primarySearch.length > 0 ? allMembers.filter((m) => norm(m.name).includes(norm(primarySearch))).slice(0, 20) : [];
  const famResults = famSearch.length > 0 ? allMembers.filter((m) =>norm(m.name).includes(norm(famSearch)) && m.id !== primary?.id && !familyMembers.find((fm) => fm.id === m.id) && !existingMemberIds.includes(m.id)).slice(0, 8) : [];
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
    if (!addReg) return;
    const famId = null; // family_id is a FK to families table; portal registrations don't create family records
    const submittedRegs = allParticipants.map((m) => {
      const isVerifiedMember = m.verified !== false && m.id && !m.id.startsWith("MANUAL-");
      const data = {
        memberId: isVerifiedMember ? m.id : "GUEST",
        memberName: m.name,
        badgeName: m.badgeName || m.name,
        category: m.category || "Adulto",
        church: m.church || "",
        role: m.role || "",
        familyId: famId,
        team: "Participante",
        paid: false,
        exempt: false,
        needsTranslation: translations.en || translations.es,
        note: [
          contact.phone ? "Tel: " + contact.phone : "",
          contact.email ? "Email: " + contact.email : "",
          allergies.hasAny ? "Alergias: " + allergies.other : "",
          specialNeeds.hasAny ? "Nec. especiais: " + specialNeeds.other : "",
        ].filter(Boolean).join(" | "),
      };
      return addReg(data);
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
          setTermsAccepted(false); setSubmitted(null);
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
                    {famResults.map((m) => (
                      <div key={m.id} onClick={() => { setFamilyMembers((prev) => [...prev, { ...m, verified: true }]); setFamSearch(""); }} style={{ padding: "9px 14px", cursor: "pointer", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")} onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                        <span style={{ fontWeight: 600 }}>{m.name}</span>
                        <div style={{ display: "flex", gap: 5 }}><span className="badge badge-blue">{m.category}</span><span style={{ fontSize: 12, color: "#6b7280" }}>{m.gender}</span></div>
                      </div>
                    ))}
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

              <div style={{ background: "#f8f9fb", border: "1px solid var(--border)", borderRadius: 10, padding: "16px", maxHeight: 280, overflowY: "auto", marginBottom: 16 }}>
                <pre style={{ fontFamily: "inherit", fontSize: 12, color: "#374151", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{TERMS_TEXT}</pre>
              </div>
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
