export function newMemberForm() {
  return { id: null, firstName: "", lastName: "", badgeName: "", gender: "M", category: "Adulto", role: "", familyId: "", gaId: "", allergies: "", specialNeeds: "", notes: "" };
}

export function memberToForm(m) {
  return { id: m.id, firstName: m.firstName || "", lastName: m.lastName || "", badgeName: m.badgeName || "", gender: m.gender || "M", category: m.category || "Adulto", role: m.role || "", familyId: m.familyId || "", gaId: m.gaId || "", allergies: m.allergies || "", specialNeeds: m.specialNeeds || "", notes: m.notes || "" };
}
