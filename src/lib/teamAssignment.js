// A member can only be on one service team per event, with one exception:
// a Diácono may be on "Diáconos" plus exactly one additional team.
export function findMemberTeams(rosters, eventId, mid, excludeTeam) {
  return (rosters || [])
    .filter((r) => r.eventId === eventId && r.team !== excludeTeam && (r.memberIds || []).includes(mid))
    .map((r) => ({ team: r.team, leaderId: r.leaderId }));
}

export function canAssignToTeam({ rosters, eventId, memberId, targetTeam, memberRole, ignoreTeam }) {
  const existing = findMemberTeams(rosters, eventId, memberId, targetTeam).filter((e) => e.team !== ignoreTeam);
  if (existing.length === 0) return { allowed: true };

  if (memberRole === "Diácono" && existing.length === 1) {
    const other = existing[0].team;
    if (other === "Diáconos" || targetTeam === "Diáconos") return { allowed: true };
  }

  return { allowed: false, conflictTeam: existing[0].team };
}
