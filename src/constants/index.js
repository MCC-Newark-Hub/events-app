// ── Categories, Roles, Teams, Churches ────────────────────────────────────────

export const CATEGORIES = ["0-3", "Criança", "Intermediário", "Adolescente", "Jovem", "Adulto"];

export const ROLE_OPTIONS = [
  "",
  "Pastor",
  "Ungido",
  "Diácono",
  "Obreiro",
  "Grupo de Louvor",
  "Instrumentista",
  "Instrumentista Aprendiz",
  "Operador de Som",
  "Grupo de Intercessão",
  "Grupo de Oração",
  "Grupo de Limpeza",
  "Professor(a) de Adolescentes",
  "Professor(a) de Crianças",
  "Professor(a) de Intermediários",
  "Professor(a) de Jovens",
  "Secretário(a) de GA",
  "Secretário(a) de Igreja",
  "Responsável - Grupo de Louvor",
  "Responsável - Inscrições",
  "Responsável - Instrumentistas",
  "Responsável - Jovens",
  "Responsável - Professores CIA",
  "Primeiro Tesoureiro",
  "Segundo Tesoureiro",
  "Comissão de Contas",
  "Trabalho de Senhoras - Apoio",
  "Trabalho de Senhoras - Coordenadora",
  "Trabalho de Senhoras - Louvor/Palavra",
  "Intérprete de Libras",
  "Tradutor",
  "Mídias Sociais",
];

export const ROLE_GROUPS = [
  { group: "Obreiro", roles: ["Pastor", "Ungido", "Diácono", "Obreiro"] },
  {
    group: "Louvor",
    roles: ["Grupo de Louvor", "Instrumentista", "Instrumentista Aprendiz", "Operador de Som"],
  },
  { group: "Intercessão", roles: ["Grupo de Intercessão", "Grupo de Oração"] },
  { group: "Limpeza", roles: ["Grupo de Limpeza"] },
  {
    group: "Professores",
    roles: [
      "Professor(a) de Adolescentes",
      "Professor(a) de Crianças",
      "Professor(a) de Intermediários",
      "Professor(a) de Jovens",
    ],
  },
  { group: "Secretaria", roles: ["Secretário(a) de GA", "Secretário(a) de Igreja"] },
  {
    group: "Responsáveis",
    roles: [
      "Responsável - Grupo de Louvor",
      "Responsável - Inscrições",
      "Responsável - Instrumentistas",
      "Responsável - Jovens",
      "Responsável - Professores CIA",
    ],
  },
  {
    group: "Tesouraria",
    roles: ["Primeiro Tesoureiro", "Segundo Tesoureiro", "Comissão de Contas"],
  },
  {
    group: "Senhoras",
    roles: [
      "Trabalho de Senhoras - Apoio",
      "Trabalho de Senhoras - Coordenadora",
      "Trabalho de Senhoras - Louvor/Palavra",
    ],
  },
  { group: "Outros", roles: ["Intérprete de Libras", "Tradutor", "Mídias Sociais"] },
];

export const TEAMS = [
  "Participante",
  "Pastores",
  "Ungidos",
  "Diáconos",
  "Grupo de Louvor",
  "Cozinha",
  "Limpeza",
  "Secretaria",
  "Segurança",
  "Som & Projeção",
  "Tradução",
  "Transporte",
  "Professoras",
];
export const SERVICE_TEAMS = TEAMS.filter((t) => t !== "Participante");

export const CHURCH_LIST = [
  { display: "Newark, NJ", code: "EUA" },
  { display: "New York, NY", code: "EUA" },
  { display: "Philadelphia, PA", code: "EUA" },
  { display: "Toms River, NJ", code: "EUA" },
  { display: "Framingham, MA", code: "EUA" },
  { display: "Milford, MA", code: "EUA" },
  { display: "Everett, MA", code: "EUA" },
  { display: "Danbury, CT", code: "EUA" },
  { display: "Falls Church, VA", code: "EUA" },
  { display: "Gardner, MA", code: "EUA" },
  { display: "Pompano Beach, FL", code: "EUA" },
  { display: "Richmond, MA", code: "EUA" },
  { display: "Provo, UT", code: "EUA" },
  { display: "Hempstead, NY", code: "EUA" },
  { display: "Ajax, ON", code: "CAN" },
];

export const CHURCHES = CHURCH_LIST.map((c) => c.display + " - " + c.code);

export const churchDisplay = (raw) => {
  if (!raw || raw === "Sem Igreja") return "";
  if (raw.startsWith("Outra: ")) return raw.slice(7);
  const found = CHURCH_LIST.find((c) => raw.startsWith(c.display));
  return found ? found.display : raw.replace(/ - (EUA|CAN|BRA)$/, "");
};

export const churchCode = (raw) => {
  if (!raw || raw === "Sem Igreja" || raw.startsWith("Outra: ")) return "";
  const m = raw.match(/- (EUA|CAN|BRA)$/);
  if (m) return m[1];
  const found = CHURCH_LIST.find((c) => raw.startsWith(c.display));
  return found ? found.code : "";
};

// ── System Roles ───────────────────────────────────────────────────────────────
export const ROLES_SYS = {
  ADMIN: "admin",
  CLERK: "clerk",
  PASTOR: "pastor",
  GA_LEADER: "ga_leader",
  TEAM_LEADER: "team_leader",
};

// ── Helpers ────────────────────────────────────────────────────────────────────
export const fmt = (n) => `$${Number(n).toFixed(2)}`;
export const daysSince = (dateStr) =>
  Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);

export const OBREIRO_ROLES = ["Pastor", "Ungido", "Diácono", "Obreiro"];

export const isDeadlineExempt = (reg, allEventRegs = []) => {
  if (reg.paid || reg.exempt || reg.cancelled || reg.waitlisted) return true;
  if (OBREIRO_ROLES.includes(reg.role)) return true;
  if (reg.team && reg.team !== "Participante") return true;
  if (reg.familyId && allEventRegs.length > 0) {
    const familyRegs = allEventRegs.filter((r) => r.familyId === reg.familyId && !r.cancelled);
    if (familyRegs.some((r) => OBREIRO_ROLES.includes(r.role))) return true;
    if (familyRegs.some((r) => r.team && r.team !== "Participante")) return true;
  }
  return false;
};

export const deadlineStatus = (reg, event, allEventRegs = []) => {
  if (!event?.paymentDeadlineDays || isDeadlineExempt(reg, allEventRegs)) return null;
  const days = daysSince(reg.registeredAt);
  const deadline = event.paymentDeadlineDays;
  const remaining = deadline - days;
  if (remaining <= 0) return { overdue: true, remaining: 0, label: "Prazo expirado" };
  if (remaining <= 2)
    return {
      overdue: false,
      urgent: true,
      remaining,
      label: `${remaining}d restante${remaining === 1 ? "" : "s"}`,
    };
  return {
    overdue: false,
    urgent: false,
    remaining,
    label: `${remaining}d restante${remaining === 1 ? "" : "s"}`,
  };
};

export const ROLE_BADGE = {
  Pastor: "badge-purple",
  Ungido: "badge-blue",
  Diácono: "badge-green",
  "": "badge-gray",
};

export const STATUS_CFG = {
  not_registered: { dot: "dot-gray", badge: "badge-gray" },
  pending: { dot: "dot-yellow", badge: "badge-yellow" },
  confirmed: { dot: "dot-green", badge: "badge-green" },
};
