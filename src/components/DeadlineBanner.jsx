import { getDeadlineStatus } from "@/lib/registrationDeadline";

// Styled for the dark maroon/navy gradient background both call sites (LoginScreen,
// PublicPortal header) share — not the light card backgrounds used elsewhere.
const TIER_STYLE = {
  week: { bg: "rgba(255,255,255,.1)", border: "rgba(255,255,255,.3)", color: "#fff", icon: "🗓️" },
  three_days: { bg: "rgba(245,158,11,.18)", border: "rgba(245,158,11,.5)", color: "#fde68a", icon: "⏰" },
  today: { bg: "rgba(220,38,38,.22)", border: "rgba(248,113,113,.6)", color: "#fecaca", icon: "⚠️" },
  past: { bg: "rgba(220,38,38,.32)", border: "rgba(248,113,113,.8)", color: "#fecaca", icon: "🚫" },
};

export default function DeadlineBanner({ event, t, style }) {
  const tier = getDeadlineStatus(event?.registration_deadline);
  if (!tier) return null;
  const s = TIER_STYLE[tier];
  const message = { week: t.deadlineWeek, three_days: t.deadlineThreeDays, today: t.deadlineToday, past: t.deadlinePast }[tier];
  return (
    <div
      style={{
        display: "inline-block",
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
        borderRadius: 10,
        padding: "8px 16px",
        fontSize: 13,
        fontWeight: 600,
        maxWidth: 420,
        ...style,
      }}
    >
      {s.icon} {message}
    </div>
  );
}
