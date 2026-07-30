import { sb } from "@/lib/supabase";

// Registrations store a snapshot of the member's name at registration time
// (registrations.member_name / badge_name), not a live lookup. When staff
// renames a member, call this right after the members update succeeds so
// their existing registrations don't keep showing the old name forever.
export async function syncRegistrationNames({ memberId, oldName, newName, newBadgeName, setRegs }) {
  if (!memberId || !newName || newName === oldName) return;
  const resolvedBadge = newBadgeName || newName;

  const { data: rows, error } = await sb
    .from("registrations")
    .select("id, badge_name")
    .eq("member_id", memberId)
    .eq("cancelled", false);
  if (error || !rows || rows.length === 0) return;

  for (const row of rows) {
    const syncBadge = !row.badge_name || row.badge_name === oldName;
    const patch = { member_name: newName };
    if (syncBadge) patch.badge_name = resolvedBadge;
    await sb.from("registrations").update(patch).eq("id", row.id);
  }

  if (setRegs) {
    setRegs((prev) =>
      prev.map((r) => {
        if (r.memberId !== memberId || r.cancelled) return r;
        const syncBadge = !r.badgeName || r.badgeName === oldName;
        return { ...r, memberName: newName, badgeName: syncBadge ? resolvedBadge : r.badgeName };
      })
    );
  }
}
