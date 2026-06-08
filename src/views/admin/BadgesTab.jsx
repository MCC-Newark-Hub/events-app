import { useT } from "@/i18n/strings";
import { ROLE_BADGE } from "@/constants";

export default function BadgesTab({ regs, event }) {
  const t = useT();
  const er = regs.filter((r) => r.eventId === event?.id && !r.cancelled && !r.waitlisted);
  return (
    <div>
      <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 12 }}>{t.badgePreview}</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
          gap: 10,
        }}
      >
        {er.slice(0, 15).map((r) => (
          <div
            key={r.id}
            style={{
              border: `2px solid ${r.excedente ? "#ff6b35" : "#1a3a6b"}`,
              borderRadius: 10,
              padding: "12px 14px",
              textAlign: "center",
              background: "#fff",
            }}
          >
            <div
              style={{
                fontSize: 8,
                color: "#6b7280",
                marginBottom: 3,
                letterSpacing: ".05em",
                fontWeight: 700,
              }}
            >
              IGREJA CRISTÃ MARANATA
            </div>
            {r.excedente && (
              <div style={{ fontSize: 9, color: "#c4390a", fontWeight: 700, marginBottom: 2 }}>
                ⚡ EXCEDENTE
              </div>
            )}
            <div
              style={{
                fontFamily: "'Lora',Georgia,serif",
                fontSize: 15,
                fontWeight: 700,
                color: "#8B0000",
                marginBottom: 2,
              }}
            >
              {r.badgeName || r.memberName}
            </div>
            {r.badgeName && r.badgeName !== r.memberName && (
              <div style={{ fontSize: 9, color: "#9ca3af", marginBottom: 4 }}>{r.memberName}</div>
            )}
            <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 5 }}>{r.church}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 3, flexWrap: "wrap" }}>
              <span className="badge badge-blue" style={{ fontSize: 9 }}>
                {r.category}
              </span>
              {r.role && (
                <span className={`badge ${ROLE_BADGE[r.role]}`} style={{ fontSize: 9 }}>
                  {r.role}
                </span>
              )}
              <span className="badge badge-gray" style={{ fontSize: 9 }}>
                {r.team}
              </span>
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 8, color: "#9ca3af", marginTop: 5 }}>
              {r.regNumber}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
