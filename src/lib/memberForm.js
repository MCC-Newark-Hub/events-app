export function newMemberForm() {
  return { id: null, firstName: "", lastName: "", badgeName: "", gender: "M", category: "Adulto", roles: [], familyId: "", gaId: "", allergies: "", specialNeeds: "", notes: "" };
}

export function memberToForm(m) {
  // roles falls back to [role] for members whose roles array is empty/missing —
  // otherwise a member edited before roles existed would open with no roles at
  // all, and saving would wipe their one legacy role instead of just carrying it over.
  const roles = m.roles && m.roles.length > 0 ? m.roles : (m.role ? [m.role] : []);
  return { id: m.id, firstName: m.firstName || "", lastName: m.lastName || "", badgeName: m.badgeName || "", gender: m.gender || "M", category: m.category || "Adulto", roles, familyId: m.familyId || "", gaId: m.gaId || "", allergies: m.allergies || "", specialNeeds: m.specialNeeds || "", notes: m.notes || "" };
}
