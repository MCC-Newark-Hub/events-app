import { ROLE_BADGE } from "@/constants";

// Read-only display of a member's role(s) — falls back to the legacy singular
// `role` field for members whose `roles` array hasn't been populated. Caps at
// `max` badges with a "+N" overflow indicator, since a member can hold several
// roles at once (worship team + instrumentalist + translation, etc.).
export default function RoleBadges({ member, max = 2, size = 11, empty = "—" }) {
  const roles = member?.roles && member.roles.length > 0 ? member.roles : (member?.role ? [member.role] : []);
  if (roles.length === 0) return <span style={{ color: "#9ca3af", fontSize: size + 1 }}>{empty}</span>;
  return (
    <span style={{ display: "inline-flex", gap: 4, flexWrap: "wrap" }}>
      {roles.slice(0, max).map((r) => (
        <span key={r} className={`badge ${ROLE_BADGE[r] || "badge-gray"}`} style={{ fontSize: size }}>{r}</span>
      ))}
      {roles.length > max && <span className="badge badge-gray" style={{ fontSize: size }}>+{roles.length - max}</span>}
    </span>
  );
}
