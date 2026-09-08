import { useNavigate } from "react-router-dom";
import { Home, LogOut } from "lucide-react";
import ICMLogo from "@/components/ICMLogo";
import { STRINGS } from "@/i18n/strings";

export default function HubTopbar({ user, logout, lang, setLang, theme, toggleTheme, sectionLabel }) {
  const navigate = useNavigate();
  const t = STRINGS[lang] || STRINGS.pt;

  return (
    <div className="topbar" style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 20px" }}>
      <button
        onClick={() => navigate("/")}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", opacity: 0.85 }}
        title="Hub"
      >
        <Home size={18} color="#fff" />
      </button>

      <ICMLogo height={28} style={{ filter: "brightness(0) invert(1)", opacity: 0.9 }} />

      {sectionLabel && (
        <>
          <span style={{ color: "rgba(255,255,255,.4)", fontSize: 16 }}>/</span>
          <span style={{ color: "#fff", fontFamily: "'Lora',Georgia,serif", fontSize: 15, fontWeight: 700 }}>
            {sectionLabel}
          </span>
        </>
      )}

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", gap: 4 }}>
        {["pt", "en"].map((l) => (
          <button key={l} className={`lang-btn ${lang === l ? "active" : ""}`} onClick={() => setLang(l)}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <button
        className="btn btn-ghost btn-sm"
        onClick={toggleTheme}
        style={{ color: "rgba(255,255,255,.8)", borderColor: "rgba(255,255,255,.2)", fontSize: 16, padding: "4px 8px" }}
        title={theme === "light" ? "Modo escuro" : "Modo claro"}
      >
        {theme === "light" ? "🌙" : "☀️"}
      </button>

      {user && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="avatar" style={{ width: 30, height: 30, fontSize: 12 }}>
            {user.initials || user.name?.slice(0, 2).toUpperCase()}
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={logout}
            style={{ color: "rgba(255,255,255,.8)", borderColor: "rgba(255,255,255,.2)" }}
            title={t.logout || "Sair"}
          >
            <LogOut size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
