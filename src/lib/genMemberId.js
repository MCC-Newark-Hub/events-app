// `members.id` has no DB-side default (existing rows use an "M001"-style sequence
// seeded outside the app), so every insert must supply one. A random suffix avoids
// races between concurrent inserts (e.g. two people self-registering at once),
// matching the id-generation pattern already used for families/assistance_groups.
export function genMemberId() {
  const rand = Math.random().toString(16).slice(2, 8).toUpperCase().padEnd(6, "0");
  return "MU" + rand;
}
