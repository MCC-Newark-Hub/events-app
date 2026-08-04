// Family membership is bidirectional and not always kept in sync: member.familyId
// is set by most editors, but FamiliesPanel's own editor only writes family.memberIds.
// Union both directions so grouping doesn't silently drop members.
export function familyIdOf(member, families) {
  if (member.familyId) return member.familyId;
  const viaFamily = (families || []).find((f) => (f.memberIds || []).includes(member.id));
  return viaFamily ? viaFamily.id : null;
}

export function groupByFamily(members, families) {
  const groups = new Map();
  for (const m of members || []) {
    const fid = familyIdOf(m, families);
    if (!groups.has(fid)) groups.set(fid, []);
    groups.get(fid).push(m);
  }
  const withFamily = [];
  for (const [fid, mems] of groups) {
    if (fid === null) continue;
    const fam = (families || []).find((f) => f.id === fid);
    withFamily.push({ familyId: fid, familyName: fam?.name || "Família", members: mems });
  }
  withFamily.sort((a, b) => a.familyName.localeCompare(b.familyName));
  if (groups.has(null)) {
    withFamily.push({ familyId: null, familyName: "Sem Família", members: groups.get(null) });
  }
  return withFamily;
}
