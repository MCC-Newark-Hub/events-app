import { BookOpen } from "lucide-react";

// CMSSection — Phase 4 placeholder.
// Will house member directory, families, GAs, roles, and lists
// extracted from AdminView once Phase 4 is implemented.
export default function CMSSection({ lang }) {
  const pt = lang !== "en";
  return (
    <div style={{ minHeight: "calc(100vh - 56px)", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: "#03223f18", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <BookOpen size={32} color="#03223f" />
        </div>
        <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
          {pt ? "Diretório" : "Directory"}
        </h2>
        <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>
          {pt
            ? "Gestão de membros, famílias, grupos de assistência e funções. Em construção."
            : "Member, family, GA and role management. Coming soon."}
        </p>
      </div>
    </div>
  );
}
