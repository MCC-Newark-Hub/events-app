// A member can only be on one service team per event, with one exception:
// a Diácono may be on "Diáconos" plus exactly one additional team.
export function findMemberTeams(rosters, eventId, mid, excludeTeam) {
  return (rosters || [])
    .filter((r) => r.eventId === eventId && r.team !== excludeTeam && (r.memberIds || []).includes(mid))
    .map((r) => ({ team: r.team, leaderId: r.leaderId }));
}

export function canAssignToTeam({ rosters, eventId, memberId, targetTeam, memberRole, memberRoles, ignoreTeam }) {
  const existing = findMemberTeams(rosters, eventId, memberId, targetTeam).filter((e) => e.team !== ignoreTeam);
  if (existing.length === 0) return { allowed: true };

  // A member can hold several roles at once — check the full set (memberRoles),
  // not just the legacy single memberRole, so someone whose Diácono role isn't
  // first in their roles array still gets the two-team exception. memberRole is
  // kept as a fallback for any caller that hasn't been updated to pass the array.
  const isDiacono = (memberRoles || (memberRole ? [memberRole] : [])).includes("Diácono");
  if (isDiacono && existing.length === 1) {
    const other = existing[0].team;
    if (other === "Diáconos" || targetTeam === "Diáconos") return { allowed: true };
  }

  return { allowed: false, conflictTeam: existing[0].team };
}
