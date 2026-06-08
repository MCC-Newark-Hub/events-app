import { useState, useEffect } from "react";
import { STRINGS } from "@/i18n/strings";
import { CATEGORIES, ROLE_BADGE, fmt, churchDisplay, churchCode } from "@/constants";
import { INIT_MEMBERS } from "@/dev/seeds";
import { PublicConfirmation } from "./PublicConfirmation";
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

function PublicPortal({ event, lang, setLang, onReset }) {
  const t = STRINGS[lang || "pt"];
  const [step, setStep] = useState(1); // 1=ID, 2=Family, 3=Health, 4=Terms, 5=Confirm
  const [primary, setPrimary] = useState(null); // member object or manual
  const [primarySearch, setPrimarySearch] = useState("");
  const [primaryNotFound, setPrimaryNotFound] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]); // [{member|manual, verified}]
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

  const allMembers = INIT_MEMBERS;
  const primaryResults =
    primarySearch.length > 1
      ? allMembers
          .filter((m) => m.name.toLowerCase().includes(primarySearch.toLowerCase()))
          .slice(0, 8)
      : [];
  const famResults =
    famSearch.length > 1
      ? allMembers
          .filter(
            (m) =>
              m.name.toLowerCase().includes(famSearch.toLowerCase()) &&
              m.id !== primary?.id &&
              !familyMembers.find((fm) => fm.id === m.id)
          )
          .slice(0, 6)
      : [];

  const eventFee = (cat) => event?.fees?.[cat] ?? 0;
  const allParticipants = primary ? [primary, ...familyMembers] : [];
  const totalFee = allParticipants.reduce(
    (s, m) => s + (m.role === "Pastor" ? 0 : eventFee(m.category)),
    0
  );

  const validateStep1 = () => {
    const e = {};
    if (!primary) e.primary = "Please search for and select your name.";
    if (!contact.phone) e.phone = t.phoneRequired;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!termsAccepted) {
      setTermsError(true);
      return;
    }
    const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const loc = event?.locationCode || event?.prefix || "EVT";
    const seq = String(Math.floor(Math.random() * 900) + 100); // demo seq
    const regs = allParticipants.map((m, i) => ({
      ...m,
      regNumber: `${loc}-${d}-${seq}-${i + 1}`,
      fee: m.role === "Pastor" ? 0 : eventFee(m.category),
      contact,
      translations,
      allergies,
      specialNeeds,
      familyPos: i + 1,
      totalInGroup: allParticipants.length,
    }));
    setSubmitted({ regs, email: contact.email });
  };

  if (submitted)
    return (
      <PublicConfirmation
        regs={submitted.regs}
        email={submitted.email}
        event={event}
        lang={lang}
        setLang={setLang}
        t={t}
        onReset={() => {
          setStep(1);
          setPrimary(null);
          setPrimarySearch("");
          setFamilyMembers([]);
          setContact({ phone: "", email: "", whatsapp: true });
          setTranslations({ en: false, es: false });
          setAllergies({ hasAny: false, other: "" });
          setSpecialNeeds({ hasAny: false, other: "" });
          setTermsAccepted(false);
          setSubmitted(null);
        }}
        onHome={onReset}
      />
    );

  const stepLabels = [t.step1, t.step2, t.step3, t.step4];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg,#8B0000 0%,#b41926 50%,#03223f 100%)",
        padding: "24px 16px",
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <button
            onClick={onReset || undefined}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,.8)",
              fontSize: 13,
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {onReset && <>← {lang === "en" ? "Home" : "Início"}</>}
            {!onReset && <span style={{ opacity: 0.7 }}>ICM Maranatha</span>}
          </button>
        </div>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <h1
            style={{
              fontFamily: "'Lora',Georgia,serif",
              color: "#fff",
              fontSize: 24,
              marginBottom: 4,
            }}
          >
            {event?.name}
          </h1>
          <p style={{ color: "rgba(255,255,255,.75)", fontSize: 13 }}>
            📅 {event?.date} · 🕙 {event?.time} · 📍 {event?.location}
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, justifyContent: "center" }}>
          {stepLabels.map((label, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background:
                    step > i + 1 ? "#f8f7f3" : step === i + 1 ? "#f8f7f3" : "rgba(255,255,255,.25)",
                  color:
                    step > i + 1 ? "#8B0000" : step === i + 1 ? "#8B0000" : "rgba(255,255,255,.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {step > i + 1 ? "✓" : i + 1}
              </div>
              {i < stepLabels.length - 1 && (
                <div
                  style={{
                    width: 24,
                    height: 2,
                    background: step > i + 1 ? "#f8f7f3" : "rgba(255,255,255,.25)",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        <div style={{ background: "#fff", borderRadius: 20, padding: "24px 20px" }}>
          {/* STEP 1: Identification */}
          {step === 1 && (
            <div>
              <h3
                style={{
                  fontFamily: "'Lora',Georgia,serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#03223f",
                  marginBottom: 4,
                }}
              >
                1. {t.step1}
              </h3>
              <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 18 }}>
                Search for your name in our member directory.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Name search */}
                <div>
                  <label>{t.searchName} *</label>
                  <div className="sb">
                    <span className="si-icon">🔍</span>
                    <input
                      value={primarySearch}
                      onChange={(e) => {
                        setPrimarySearch(e.target.value);
                        setPrimary(null);
                        setPrimaryNotFound(false);
                        setErrors({});
                      }}
                      placeholder={t.searchPlaceholder}
                    />
                  </div>
                  {primaryResults.length > 0 && !primary && (
                    <div
                      style={{
                        border: "1.5px solid var(--border)",
                        borderRadius: 8,
                        marginTop: 4,
                        overflow: "hidden",
                        maxHeight: 200,
                        overflowY: "auto",
                      }}
                    >
                      {primaryResults.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => {
                            setPrimary(m);
                            setPrimarySearch(m.name);
                            setPrimaryNotFound(false);
                          }}
                          style={{
                            padding: "10px 14px",
                            cursor: "pointer",
                            borderTop: "1px solid var(--border)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                        >
                          <div>
                            <span style={{ fontWeight: 600 }}>{m.name}</span>
                            <span style={{ marginLeft: 8, fontSize: 12, color: "#6b7280" }}>
                              {m.church}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: 5 }}>
                            <span className="badge badge-blue">{m.category}</span>
                            {m.role && (
                              <span className={`badge ${ROLE_BADGE[m.role]}`}>{m.role}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {primarySearch.length > 1 && primaryResults.length === 0 && !primary && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: "10px 14px",
                        background: "#fef3c7",
                        borderRadius: 8,
                        fontSize: 13,
                        color: "#92400e",
                      }}
                    >
                      {t.nameNotFound} {t.nameNotFoundClerk}
                    </div>
                  )}
                  {primary && (
                    <div
                      style={{
                        marginTop: 8,
                        background: "#f0fdf4",
                        border: "1px solid #86efac",
                        borderRadius: 8,
                        padding: "10px 14px",
                        fontSize: 13,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <strong>{primary.name}</strong>
                        <span style={{ marginLeft: 8, color: "#6b7280" }}>
                          {primary.category} · {primary.church}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setPrimary(null);
                          setPrimarySearch("");
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#9ca3af",
                          fontSize: 18,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                  {errors.primary && (
                    <p style={{ color: "#c0392b", fontSize: 12, marginTop: 4 }}>{errors.primary}</p>
                  )}
                </div>

                {/* Contact */}
                <div>
                  <label>
                    {t.phone} *{" "}
                    <span
                      style={{
                        fontSize: 11,
                        color: "#6b7280",
                        fontWeight: 400,
                        textTransform: "none",
                      }}
                    >
                      (WhatsApp?)
                    </span>
                  </label>
                  <input
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                  {errors.phone && (
                    <p style={{ color: "#c0392b", fontSize: 12, marginTop: 4 }}>{errors.phone}</p>
                  )}
                </div>
                <div>
                  <label>{t.email}</label>
                  <input
                    type="email"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    placeholder="your@email.com"
                  />
                  <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                    Optional — used to send your confirmation.
                  </p>
                </div>

                {/* Translation */}
                <div>
                  <label>{t.translationNeededLabel}</label>
                  <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                    <div className="cb">
                      <input
                        type="checkbox"
                        id="ten"
                        checked={translations.en}
                        onChange={(e) => setTranslations({ ...translations, en: e.target.checked })}
                      />
                      <label htmlFor="ten">{t.translationEN}</label>
                    </div>
                    <div className="cb">
                      <input
                        type="checkbox"
                        id="tes"
                        checked={translations.es}
                        onChange={(e) => setTranslations({ ...translations, es: e.target.checked })}
                      />
                      <label htmlFor="tes">{t.translationES}</label>
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ padding: 12, fontSize: 15 }}
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                  }}
                >
                  {lang === "en" ? "Next: Family →" : "Próximo: Família →"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Family */}
          {step === 2 && (
            <div>
              <h3
                style={{
                  fontFamily: "'Lora',Georgia,serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#03223f",
                  marginBottom: 4,
                }}
              >
                2. {t.step2}
              </h3>
              <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>
                {lang === "en"
                  ? "Add family members to this registration. Skip if registering alone."
                  : "Adicione membros da família a esta inscrição. Pule se for sozinho."}
              </p>

              {/* Current participants */}
              {primary && (
                <div
                  style={{
                    background: "#f8f9fb",
                    borderRadius: 10,
                    padding: "12px 14px",
                    marginBottom: 14,
                  }}
                >
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
                    {t.primaryRegistrant}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{primary.name}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span className="badge badge-blue">{primary.category}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#2d8a4e" }}>
                        {primary.role === "Pastor"
                          ? "Isento"
                          : eventFee(primary.category) === 0
                            ? "Grátis"
                            : fmt(eventFee(primary.category))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {familyMembers.length > 0 && (
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
                  {familyMembers.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "9px 12px",
                        background: "#f8f9fb",
                        borderRadius: 8,
                        marginBottom: 6,
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600 }}>{m.name}</span>
                        {!m.verified && (
                          <span
                            style={{
                              marginLeft: 8,
                              fontSize: 10,
                              color: "#92400e",
                              background: "#fef3c7",
                              padding: "1px 6px",
                              borderRadius: 99,
                              fontWeight: 600,
                            }}
                          >
                            Unverified
                          </span>
                        )}
                        <span style={{ marginLeft: 8, fontSize: 12, color: "#6b7280" }}>
                          {m.category} · {m.gender}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#2d8a4e" }}>
                          {eventFee(m.category) === 0 ? "Grátis" : fmt(eventFee(m.category))}
                        </span>
                        <button
                          onClick={() => setFamilyMembers((prev) => prev.filter((_, j) => j !== i))}
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
                    </div>
                  ))}
                </div>
              )}

              {/* Search family member */}
              <div style={{ marginBottom: 12 }}>
                <label>{t.addFamilyMember}</label>
                <div className="sb">
                  <span className="si-icon">🔍</span>
                  <input
                    value={famSearch}
                    onChange={(e) => {
                      setFamSearch(e.target.value);
                      setFamNotFound(false);
                    }}
                    placeholder={t.searchPlaceholder}
                  />
                </div>
                {famResults.length > 0 && (
                  <div
                    style={{
                      border: "1.5px solid var(--border)",
                      borderRadius: 8,
                      marginTop: 4,
                      overflow: "hidden",
                      maxHeight: 180,
                      overflowY: "auto",
                    }}
                  >
                    {famResults.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => {
                          setFamilyMembers((prev) => [...prev, { ...m, verified: true }]);
                          setFamSearch("");
                        }}
                        style={{
                          padding: "9px 14px",
                          cursor: "pointer",
                          borderTop: "1px solid var(--border)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                      >
                        <span style={{ fontWeight: 600 }}>{m.name}</span>
                        <div style={{ display: "flex", gap: 5 }}>
                          <span className="badge badge-blue">{m.category}</span>
                          <span style={{ fontSize: 12, color: "#6b7280" }}>{m.gender}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {famSearch.length > 1 && famResults.length === 0 && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: "10px 14px",
                      background: "#fef3c7",
                      borderRadius: 8,
                      fontSize: 13,
                      color: "#92400e",
                    }}
                  >
                    {t.nameNotFound}
                  </div>
                )}
              </div>

              {/* Manual family member */}
              <div>
                <div className="cb" style={{ marginBottom: 10 }}>
                  <input
                    type="checkbox"
                    id="cantfind"
                    checked={showManualFam}
                    onChange={(e) => setShowManualFam(e.target.checked)}
                  />
                  <label htmlFor="cantfind">{t.cantFindMember}</label>
                </div>
                {showManualFam && (
                  <div
                    style={{
                      background: "#fffbeb",
                      border: "1px solid #f59e0b",
                      borderRadius: 10,
                      padding: "14px",
                    }}
                  >
                    <p style={{ fontSize: 12, color: "#92400e", marginBottom: 10 }}>
                      {t.nameNotFoundClerk}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <label>{t.manualMemberName}</label>
                        <input
                          value={manualFam.name}
                          onChange={(e) => setManualFam({ ...manualFam, name: e.target.value })}
                        />
                      </div>
                      <div className="fr">
                        <div>
                          <label>{t.manualMemberGender}</label>
                          <select
                            value={manualFam.gender}
                            onChange={(e) => setManualFam({ ...manualFam, gender: e.target.value })}
                          >
                            <option value="M">{t.genderM}</option>
                            <option value="F">{t.genderF}</option>
                          </select>
                        </div>
                        <div>
                          <label>{t.manualMemberCategory}</label>
                          <select
                            value={manualFam.category}
                            onChange={(e) =>
                              setManualFam({ ...manualFam, category: e.target.value })
                            }
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {c} — {eventFee(c) === 0 ? "Grátis" : fmt(eventFee(c))}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <button
                        className="btn btn-warn btn-sm"
                        onClick={() => {
                          if (!manualFam.name) return;
                          setFamilyMembers((prev) => [
                            ...prev,
                            {
                              ...manualFam,
                              id: "MANUAL-" + Date.now(),
                              verified: false,
                              role: "",
                              church: "",
                              badgeName: manualFam.name,
                            },
                          ]);
                          setManualFam({ name: "", gender: "M", category: "Adulto" });
                          setShowManualFam(false);
                        }}
                      >
                        +{" "}
                        {lang === "en"
                          ? "Add Unverified Member"
                          : "Adicionar Membro Não Verificado"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Fee summary */}
              {allParticipants.length > 0 && (
                <div
                  style={{
                    background: "var(--sidebar-active-bg,#fdf5f5)",
                    borderRadius: 10,
                    padding: "12px 14px",
                    marginTop: 14,
                    marginBottom: 4,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span>
                      {t.totalMembers}: <strong>{allParticipants.length}</strong>
                    </span>
                    <span>
                      {t.totalFee}:{" "}
                      <strong style={{ color: "#1a3a6b" }}>
                        {totalFee === 0 ? "Grátis" : fmt(totalFee)}
                      </strong>
                    </span>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep(1)}>
                  ← {t.back}
                </button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => setStep(3)}>
                  {lang === "en" ? "Next: Health →" : "Próximo: Saúde →"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Health & Special Needs */}
          {step === 3 && (
            <div>
              <h3
                style={{
                  fontFamily: "'Lora',Georgia,serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#03223f",
                  marginBottom: 4,
                }}
              >
                3. {t.step3}
              </h3>
              <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>
                {lang === "en"
                  ? "This information helps us prepare the event safely for everyone."
                  : "Essas informações nos ajudam a preparar o evento com segurança para todos."}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Allergies */}
                <div>
                  <div className="cb" style={{ marginBottom: 10 }}>
                    <input
                      type="checkbox"
                      id="hasAllergies"
                      checked={allergies.hasAny}
                      onChange={(e) =>
                        setAllergies((prev) => ({
                          ...prev,
                          hasAny: e.target.checked,
                          other: e.target.checked ? prev.other : "",
                        }))
                      }
                    />
                    <label
                      htmlFor="hasAllergies"
                      style={{ fontSize: 14, fontWeight: 600, color: "#1a1e2e" }}
                    >
                      {t.allergiesTitle}
                    </label>
                  </div>
                  {allergies.hasAny && (
                    <textarea
                      rows={3}
                      value={allergies.other}
                      onChange={(e) => setAllergies({ ...allergies, other: e.target.value })}
                      placeholder={
                        lang === "en"
                          ? "Describe your allergies or dietary restrictions (e.g. seafood, lactose, gluten, diabetes...)"
                          : "Descreva suas alergias ou restrições alimentares (ex: frutos do mar, lactose, glúten, diabetes...)"
                      }
                      style={{ marginTop: 4 }}
                    />
                  )}
                </div>

                {/* Special Needs */}
                <div>
                  <div className="cb" style={{ marginBottom: 10 }}>
                    <input
                      type="checkbox"
                      id="hasSpecialNeeds"
                      checked={specialNeeds.hasAny}
                      onChange={(e) =>
                        setSpecialNeeds((prev) => ({
                          ...prev,
                          hasAny: e.target.checked,
                          other: e.target.checked ? prev.other : "",
                        }))
                      }
                    />
                    <label
                      htmlFor="hasSpecialNeeds"
                      style={{ fontSize: 14, fontWeight: 600, color: "#1a1e2e" }}
                    >
                      {t.specialNeedsTitle}
                    </label>
                  </div>
                  {specialNeeds.hasAny && (
                    <textarea
                      rows={3}
                      value={specialNeeds.other}
                      onChange={(e) => setSpecialNeeds({ ...specialNeeds, other: e.target.value })}
                      placeholder={
                        lang === "en"
                          ? "Describe any special needs (e.g. wheelchair, visual impairment, ASD, Down syndrome...)"
                          : "Descreva as necessidades especiais (ex: cadeira de rodas, deficiência visual, TEA, Síndrome de Down...)"
                      }
                      style={{ marginTop: 4 }}
                    />
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep(2)}>
                  ← {t.back}
                </button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => setStep(4)}>
                  {lang === "en" ? "Next: Terms →" : "Próximo: Termos →"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Terms */}
          {step === 4 && (
            <div>
              <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, marginBottom: 14 }}>
                4. {t.termsTitle}
              </h3>
              <div
                style={{
                  background: "#f8f9fb",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "16px",
                  maxHeight: 320,
                  overflowY: "auto",
                  marginBottom: 16,
                }}
              >
                <pre
                  style={{
                    fontFamily: "inherit",
                    fontSize: 12,
                    color: "#374151",
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {TERMS_TEXT}
                </pre>
              </div>
              <div className="cb" style={{ marginBottom: 8 }}>
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    setTermsError(false);
                  }}
                />
                <label htmlFor="terms" style={{ fontSize: 14, fontWeight: 600, color: "#1a1e2e" }}>
                  {t.termsAccept}
                </label>
              </div>
              {termsError && (
                <p style={{ color: "#c0392b", fontSize: 13, marginBottom: 8 }}>
                  ⚠️ {t.termsRequired}
                </p>
              )}

              {/* Summary before submit */}
              <div
                style={{
                  background: "var(--sidebar-active-bg,#fdf5f5)",
                  borderRadius: 10,
                  padding: "12px 14px",
                  marginBottom: 14,
                  fontSize: 13,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                  {lang === "en" ? "Registration Summary:" : "Resumo da Inscrição:"}
                </div>
                <div>
                  {primary?.name}{" "}
                  {familyMembers.length > 0 &&
                    `+ ${familyMembers.length} ${t.familyMembers.toLowerCase()}`}
                </div>
                <div style={{ marginTop: 4 }}>
                  {t.totalFee}: <strong>{totalFee === 0 ? "Grátis" : fmt(totalFee)}</strong>
                </div>
                <div style={{ marginTop: 4, color: "#6b7280" }}>{t.pendingPaymentNote}</div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep(3)}>
                  ← {t.back}
                </button>
                <button
                  className="btn btn-accent"
                  style={{ flex: 2, fontSize: 15 }}
                  onClick={handleSubmit}
                >
                  {lang === "en" ? "Submit Registration" : "Confirmar Inscrição"} →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { PublicConfirmation };
export default PublicPortal;
