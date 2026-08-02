import { useState } from "react";
import { ClipboardList, Lock, Search } from "lucide-react";
import { STRINGS } from "@/i18n/strings";
import ICMLogo from "@/components/ICMLogo";
import PinLogin from "@/components/PinLogin";
import DeadlineBanner from "@/components/DeadlineBanner";

function LoginScreen({ login, lang, setLang, event, onPublicRegister, onLookup }) {
  const t = STRINGS[lang];
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [mode, setMode] = useState("choose");

  const handlePinSubmit = (p) => {
    if (!login(p)) {
      setErr(t.wrongPin);
      setPin("");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg,#8B0000 0%,#b41926 50%,#03223f 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        position: "relative",
      }}
    >
      {setLang && (
        <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 4 }}>
          {["pt", "en"].map((l) => (
            <button
              key={l}
              className={`lang-btn ${lang === l ? "active" : ""}`}
              onClick={() => setLang(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      )}
      {mode === "choose" ? (
        <div style={{ textAlign: "center", maxWidth: 380, width: "100%" }}>
          <ICMLogo height={150} style={{ marginBottom: 24 }} />
          <h1
            style={{
              fontFamily: "'Lora',Georgia,serif",
              color: "#fff",
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: ".01em",
              marginBottom: 6,
            }}
          >
            {t.appName}
          </h1>
          <p style={{ color: "rgba(255,255,255,.7)", fontSize: 15, marginBottom: event ? 16 : 32 }}>
            {t.appSub}
          </p>
          {event && (
            <div
              style={{
                display: "inline-block",
                background: "rgba(255,255,255,.1)",
                border: "1px solid rgba(255,255,255,.25)",
                borderRadius: 10,
                padding: "10px 18px",
                marginBottom: 28,
              }}
            >
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, fontFamily: "'Lora',Georgia,serif" }}>
                {event.name}
              </div>
              <div style={{ color: "rgba(255,255,255,.7)", fontSize: 12, marginTop: 2 }}>
                {event.date}{event.location ? ` · ${event.location}` : ""}
              </div>
            </div>
          )}
          {event && (
            <div style={{ marginBottom: 20 }}>
              <DeadlineBanner event={event} t={t} />
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              className="btn btn-accent"
              style={{ padding: "14px 24px", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              onClick={onPublicRegister}
            >
              <ClipboardList size={18} /> {t.myReg}
            </button>
            <button
              className="btn btn-ghost"
              style={{
                padding: "14px 24px",
                fontSize: 15,
                borderColor: "rgba(255,255,255,.3)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
              onClick={onLookup}
            >
              <Search size={18} /> {lang === "en" ? "Manage my registration" : "Consultar inscrição"}
            </button>
            <button
              className="btn btn-ghost"
              style={{
                padding: "14px 24px",
                fontSize: 15,
                borderColor: "rgba(255,255,255,.3)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
              onClick={() => setMode("pin")}
            >
              <Lock size={18} /> {t.teamAccess}
            </button>
          </div>
        </div>
      ) : (
        <PinLogin
          pin={pin}
          setPin={setPin}
          err={err}
          setErr={setErr}
          onSubmit={handlePinSubmit}
          onBack={() => setMode("choose")}
          lang={lang}
          t={t}
        />
      )}
    </div>
  );
}

export default LoginScreen;
