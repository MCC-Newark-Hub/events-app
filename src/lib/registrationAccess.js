import { getDeadlineStatus } from "@/lib/registrationDeadline";

// Returns the reason new registrations are restricted, or null if open.
// Priority: locked > paused > full > past deadline.
export function getRegistrationRestriction(event, isFull) {
  if (!event) return null;
  if (event.registrations_locked) return "locked";
  if (event.registration_paused) return "paused";
  if (isFull) return "full";
  if (getDeadlineStatus(event.registration_deadline) === "past") return "deadline";
  return null;
}

export function restrictionLabel(restriction, lang) {
  const pt = {
    locked: "Inscrições encerradas",
    paused: "Inscrições pausadas",
    full: "Capacidade esgotada",
    deadline: "Prazo de inscrição encerrado",
  };
  const en = {
    locked: "Registrations closed",
    paused: "Registrations paused",
    full: "Capacity reached",
    deadline: "Registration deadline passed",
  };
  const map = lang === "en" ? en : pt;
  return map[restriction] ?? restriction;
}

export function restrictionApprovalType(restriction) {
  return restriction === "full" ? "capacity_override" : "late_registration";
}
