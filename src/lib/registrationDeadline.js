// Which tier of deadline warning applies to an event's registration_deadline
// (a "YYYY-MM-DD" date string), given the current date. Returns null when
// there's no deadline configured or it's still more than a week away.
export function getDeadlineStatus(registrationDeadline, now = new Date()) {
  if (!registrationDeadline) return null;
  const today = new Date(now.toISOString().slice(0, 10) + "T00:00:00");
  const deadline = new Date(registrationDeadline + "T00:00:00");
  const daysUntil = Math.round((deadline - today) / (1000 * 60 * 60 * 24));
  if (daysUntil < 0) return "past";
  if (daysUntil === 0) return "today";
  if (daysUntil <= 3) return "three_days";
  if (daysUntil <= 7) return "week";
  return null;
}

// "YYYY-MM-DD" -> "DD/MM/YYYY"
export function formatDeadlineDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export function deadlineLabel(lang) {
  return lang === "en" ? "Registration deadline" : "Prazo para inscrições";
}

// Event title with the registration deadline appended, for Topbar `sub` lines.
export function eventSubtitle(event, lang) {
  const name = event?.name || "";
  if (!event?.registration_deadline) return name;
  return `${name} (${deadlineLabel(lang)}: ${formatDeadlineDate(event.registration_deadline)})`;
}
