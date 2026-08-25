// Public-facing capacity indicator for the home page — distinct from CapBar.jsx
// (staff dashboards, 3 thresholds, dense styling): this needs the 4 stages the
// event organizers asked for and the celebratory white-card look already
// established on the login page.
export default function RegistrationThermometer({ event, activeCount, waitlistedCount = 0, lang }) {
  if (!event?.capacity) return null;
  const base = Math.min(activeCount, event.capacity);
  const pct = Math.min(100, Math.round((base / event.capacity) * 100));
  const spotsLeft = Math.max(0, event.capacity - activeCount);
  const isFull = spotsLeft === 0;

  // Capacity was increased if spots just opened up but there's still a waitlist
  const capacityExpanded = !isFull && waitlistedCount > 0;

  const stage = isFull ? "red"
    : pct <= 50 ? "green" : pct <= 75 ? "yellow" : pct <= 90 ? "orange" : "red";
  const color = { green: "#2d8a4e", yellow: "#eab308", orange: "#d4820a", red: "#c0392b" }[stage];

  const pt = lang !== "en";
  const isBlocked = !!event?.registration_paused || !!event?.registrations_locked;

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ background: "var(--border,#e5e7eb)", borderRadius: 99, height: 10, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 99, background: color, transition: "width .5s, background .5s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, fontSize: 12, color: "#6b7280" }}>
        <span>
          {base}/{event.capacity} {pt ? "inscritos" : "registered"}
          {capacityExpanded && (
            <span style={{ marginLeft: 6, fontSize: 11, color: "#2d8a4e", fontWeight: 600 }}>
              ({pt ? "capacidade aumentada" : "capacity expanded"})
            </span>
          )}
        </span>
        {isBlocked ? null : isFull ? (
          <span style={{ fontWeight: 700, color: "#c0392b" }}>
            ⚠ {pt ? "Não há mais vagas disponíveis" : "No spots available"}
          </span>
        ) : stage === "orange" || stage === "red" ? (
          <span style={{ fontWeight: 700, color }}>
            {pt ? `⚠ Apenas ${spotsLeft} vaga${spotsLeft === 1 ? "" : "s"} restante${spotsLeft === 1 ? "" : "s"}!` : `⚠ Only ${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left!`}
          </span>
        ) : stage === "yellow" ? (
          <span style={{ fontWeight: 600, color }}>{pt ? "Garanta sua vaga!" : "Secure your spot!"}</span>
        ) : null}
      </div>
    </div>
  );
}
