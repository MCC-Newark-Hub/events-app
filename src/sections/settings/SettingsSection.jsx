import { Settings } from "lucide-react";

// SettingsSection — Phase 5 placeholder.
// Will house Usuários & PINs, Auditoria, and app config
// extracted from AdminView once Phase 5 is implemented.
export default function SettingsSection({ lang }) {
  const pt = lang !== "en";
  return (
    <div style={{ minHeight: "calc(100vh - 56px)", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: "#4b556318", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Settings size={32} color="#4b5563" />
        </div>
        <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
          {pt ? "Configurações" : "Settings"}
        </h2>
        <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>
          {pt
            ? "Usuários, PINs, auditoria e configurações do sistema. Em construção."
            : "Users, PINs, audit log and system configuration. Coming soon."}
        </p>
      </div>
    </div>
  );
}
