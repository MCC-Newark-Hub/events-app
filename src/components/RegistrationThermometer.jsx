// Public-facing capacity indicator for the home page — distinct from CapBar.jsx
// (staff dashboards, 3 thresholds, dense styling): this needs the 4 stages the
// event organizers asked for and the celebratory white-card look already
// established on the login page.
export default function RegistrationThermometer({ event, activeCount, lang }) {
  if (!event?.capacity) return null;
  const base = Math.min(activeCount, event.capacity);
  const pct = Math.min(100, Math.round((base / event.capacity) * 100));
  const spotsLeft = Math.max(0, event.capacity - activeCount);

  const stage =
    pct <= 50 ? "green" : pct <= 75 ? "yellow" : pct <= 90 ? "orange" : "red";
  const color = { green: "#2d8a4e", yellow: "#eab308", orange: "#d4820a", red: "#c0392b" }[stage];

  // "Secure your spot" starts at orange (76%+) — yellow is still comfortably early
  // for a church audience, orange is where real scarcity starts to matter.
  const showSecureMessage = stage === "orange" || stage === "red";

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ background: "var(--border,#e5e7eb)", borderRadius: 99, height: 10, overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 99,
            background: color,
            transition: "width .5s, background .5s",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 6,
          fontSize: 12,
          color: "#6b7280",
        }}
      >
        <span>
          {base}/{event.capacity} {lang === "en" ? "registered" : "inscritos"}
        </span>
        {showSecureMessage && (
          <span style={{ fontWeight: 700, color }}>
            {stage === "red"
              ? (lang === "en"
                  ? `⚠ Only ${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left!`
                  : `⚠ Apenas ${spotsLeft} vaga${spotsLeft === 1 ? "" : "s"} restante${spotsLeft === 1 ? "" : "s"}!`)
              : (lang === "en" ? "Secure your spot!" : "Garanta sua vaga!")}
          </span>
        )}
      </div>
    </div>
  );
}
