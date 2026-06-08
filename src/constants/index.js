// ── Categories, Roles, Teams, Churches ────────────────────────────────────────

export const CATEGORIES = ["0-3", "Criança", "Intermediário", "Adolescente", "Jovem", "Adulto"];

export const ROLE_OPTIONS = [
  "",
  "Pastor", "Ungido", "Diácono", "Obreiro",
  "Grupo de Louvor", "Instrumentista", "Instrumentista Aprendiz", "Operador de Som",
  "Grupo de Intercessão", "Grupo de Oração",
  "Grupo de Limpeza",
  "Professor(a) de Adolescentes", "Professor(a) de Crianças",
  "Professor(a) de Intermediários", "Professor(a) de Jovens",
  "Secretário(a) de GA", "Secretário(a) de Igreja",
  "Responsável - Grupo de Louvor", "Responsável - Inscrições",
  "Responsável - Instrumentistas", "Responsável - Jovens", "Responsável - Professores CIA",
  "Primeiro Tesoureiro", "Segundo Tesoureiro", "Comissão de Contas",
  "Trabalho de Senhoras - Apoio", "Trabalho de Senhoras - Coordenadora",
  "Trabalho de Senhoras - Louvor/Palavra",
  "Intérprete de Libras", "Tradutor", "Mídias Sociais",
];

export const ROLE_GROUPS = [
  { group: "Obreiro",      roles: ["Pastor", "Ungido", "Diácono", "Obreiro"] },
  { group: "Louvor",       roles: ["Grupo de Louvor", "Instrumentista", "Instrumentista Aprendiz", "Operador de Som"] },
  { group: "Intercessão",  roles: ["Grupo de Intercessão", "Grupo de Oração"] },
  { group: "Limpeza",      roles: ["Grupo de Limpeza"] },
  { group: "Professores",  roles: ["Professor(a) de Adolescentes", "Professor(a) de Crianças", "Professor(a) de Intermediários", "Professor(a) de Jovens"] },
  { group: "Secretaria",   roles: ["Secretário(a) de GA", "Secretário(a) de Igreja"] },
  { group: "Responsáveis", roles: ["Responsável - Grupo de Louvor", "Responsável - Inscrições", "Responsável - Instrumentistas", "Responsável - Jovens", "Responsável - Professores CIA"] },
  { group: "Tesouraria",   roles: ["Primeiro Tesoureiro", "Segundo Tesoureiro", "Comissão de Contas"] },
  { group: "Senhoras",     roles: ["Trabalho de Senhoras - Apoio", "Trabalho de Senhoras - Coordenadora", "Trabalho de Senhoras - Louvor/Palavra"] },
  { group: "Outros",       roles: ["Intérprete de Libras", "Tradutor", "Mídias Sociais"] },
];

export const TEAMS = ["Participante", "Pastores", "Ungidos", "Diáconos", "Grupo de Louvor", "Cozinha", "Limpeza", "Secretaria", "Segurança", "Som & Projeção", "Tradução", "Transporte", "Professoras"];
export const SERVICE_TEAMS = TEAMS.filter(t => t !== "Participante");

export const CHURCH_LIST = [
  { display: "Newark, NJ",        code: "EUA" },
  { display: "New York, NY",       code: "EUA" },
  { display: "Philadelphia, PA",   code: "EUA" },
  { display: "Toms River, NJ",     code: "EUA" },
  { display: "Framingham, MA",     code: "EUA" },
  { display: "Milford, MA",        code: "EUA" },
  { display: "Everett, MA",        code: "EUA" },
  { display: "Danbury, CT",        code: "EUA" },
  { display: "Falls Church, VA",   code: "EUA" },
  { display: "Gardner, MA",        code: "EUA" },
  { display: "Pompano Beach, FL",  code: "EUA" },
  { display: "Richmond, MA",       code: "EUA" },
  { display: "Provo, UT",          code: "EUA" },
  { display: "Hempstead, NY",      code: "EUA" },
  { display: "Ajax, ON",           code: "CAN" },
];

export const CHURCHES = CHURCH_LIST.map(c => c.display + " - " + c.code);

export const churchDisplay = (raw) => {
  if (!raw || raw === "Sem Igreja") return "";
  if (raw.startsWith("Outra: ")) return raw.slice(7);
  const found = CHURCH_LIST.find(c => raw.startsWith(c.display));
  return found ? found.display : raw.replace(/ - (EUA|CAN|BRA)$/, "");
};

export const churchCode = (raw) => {
  if (!raw || raw === "Sem Igreja" || raw.startsWith("Outra: ")) return "";
  const m = raw.match(/- (EUA|CAN|BRA)$/);
  if (m) return m[1];
  const found = CHURCH_LIST.find(c => raw.startsWith(c.display));
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
export const fmt = n => `$${Number(n).toFixed(2)}`;
export const daysSince = dateStr => Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);

export const OBREIRO_ROLES = ["Pastor", "Ungido", "Diácono", "Obreiro"];

export const isDeadlineExempt = (reg, allEventRegs = []) => {
  if (reg.paid || reg.exempt || reg.cancelled || reg.waitlisted) return true;
  if (OBREIRO_ROLES.includes(reg.role)) return true;
  if (reg.team && reg.team !== "Participante") return true;
  if (reg.familyId && allEventRegs.length > 0) {
    const familyRegs = allEventRegs.filter(r => r.familyId === reg.familyId && !r.cancelled);
    if (familyRegs.some(r => OBREIRO_ROLES.includes(r.role))) return true;
    if (familyRegs.some(r => r.team && r.team !== "Participante")) return true;
  }
  return false;
};

export const deadlineStatus = (reg, event, allEventRegs = []) => {
  if (!event?.paymentDeadlineDays || isDeadlineExempt(reg, allEventRegs)) return null;
  const days = daysSince(reg.registeredAt);
  const deadline = event.paymentDeadlineDays;
  const remaining = deadline - days;
  if (remaining <= 0) return { overdue: true, remaining: 0, label: "Prazo expirado" };
  if (remaining <= 2) return { overdue: false, urgent: true, remaining, label: `${remaining}d restante${remaining === 1 ? "" : "s"}` };
  return { overdue: false, urgent: false, remaining, label: `${remaining}d restante${remaining === 1 ? "" : "s"}` };
};

export const ROLE_BADGE = { "Pastor": "badge-purple", "Ungido": "badge-blue", "Diácono": "badge-green", "": "badge-gray" };

export const STATUS_CFG = {
  not_registered: { dot: "dot-gray",   badge: "badge-gray" },
  pending:        { dot: "dot-yellow", badge: "badge-yellow" },
  confirmed:      { dot: "dot-green",  badge: "badge-green" },
};

// ── Seed Data ──────────────────────────────────────────────────────────────────
export const INIT_MEMBERS = [
  { id: "M001", gender: "M", name: "Nairon Pimentel",     badgeName: "Nairon",    category: "Adulto",        church: "Newark, NJ - EUA",        role: "Pastor",  familyId: "F001", gaId: "GA001" },
  { id: "M002", gender: "F", name: "Rose Pimentel",        badgeName: "Rose",      category: "Adulto",        church: "Newark, NJ - EUA",        role: "",        familyId: "F001", gaId: "GA001" },
  { id: "M003", gender: "M", name: "Lucas Pimentel",       badgeName: "Lucas",     category: "Jovem",         church: "Newark, NJ - EUA",        role: "",        familyId: "F001", gaId: "GA001" },
  { id: "M004", gender: "M", name: "Gabriel Pimentel",     badgeName: "Gabriel",   category: "Jovem",         church: "Newark, NJ - EUA",        role: "",        familyId: "F001", gaId: "GA001" },
  { id: "M005", gender: "M", name: "Jairo Oliveira",       badgeName: "Jairo",     category: "Adulto",        church: "Newark, NJ - EUA",        role: "Pastor",  familyId: null,   gaId: "GA001" },
  { id: "M006", gender: "F", name: "Cristina Oliveira",    badgeName: "Cris",      category: "Adulto",        church: "Newark, NJ - EUA",        role: "",        familyId: null,   gaId: "GA001" },
  { id: "M007", gender: "M", name: "Reinaldo Gonçalves",   badgeName: "Reinaldo",  category: "Adulto",        church: "New York, NY - EUA",      role: "Diácono", familyId: "F003", gaId: "GA002" },
  { id: "M008", gender: "F", name: "Adriana Gonçalves",    badgeName: "Adriana",   category: "Adulto",        church: "New York, NY - EUA",      role: "",        familyId: "F003", gaId: "GA002" },
  { id: "M009", gender: "F", name: "Liz Gonçalves",        badgeName: "Liz",       category: "Criança",       church: "New York, NY - EUA",      role: "",        familyId: "F003", gaId: "GA002" },
  { id: "M010", gender: "M", name: "Filipe Santos",        badgeName: "Filipe",    category: "Adulto",        church: "Newark, NJ - EUA",        role: "",        familyId: null,   gaId: "GA001" },
  { id: "M011", gender: "M", name: "Leonard Alves",        badgeName: "Leonard",   category: "Adulto",        church: "Newark, NJ - EUA",        role: "Diácono", familyId: "F006", gaId: "GA001" },
  { id: "M012", gender: "F", name: "Tatiana Alves",        badgeName: "Tati",      category: "Adulto",        church: "Newark, NJ - EUA",        role: "",        familyId: "F006", gaId: "GA001" },
  { id: "M013", gender: "M", name: "Samuel Alves",         badgeName: "Samuel",    category: "Intermediário", church: "Newark, NJ - EUA",        role: "",        familyId: "F006", gaId: "GA001" },
  { id: "M014", gender: "F", name: "Olivia Alves",         badgeName: "Olivia",    category: "Criança",       church: "Newark, NJ - EUA",        role: "",        familyId: "F006", gaId: "GA001" },
  { id: "M015", gender: "M", name: "Jonas do Carmo",       badgeName: "Jonas",     category: "Adulto",        church: "Newark, NJ - EUA",        role: "",        familyId: "F005", gaId: "GA001" },
  { id: "M016", gender: "M", name: "Breno do Carmo",       badgeName: "Breno",     category: "Jovem",         church: "Newark, NJ - EUA",        role: "",        familyId: "F005", gaId: "GA001" },
  { id: "M017", gender: "F", name: "Melissa do Carmo",     badgeName: "Mel",       category: "Jovem",         church: "Newark, NJ - EUA",        role: "",        familyId: "F005", gaId: "GA001" },
  { id: "M018", gender: "M", name: "Gabriel Campaganani",  badgeName: "Gabriel C", category: "Adulto",        church: "Newark, NJ - EUA",        role: "",        familyId: "F002", gaId: "GA001" },
  { id: "M019", gender: "F", name: "Nathalia Freitas",     badgeName: "Nathalia",  category: "Adulto",        church: "Newark, NJ - EUA",        role: "",        familyId: "F002", gaId: "GA001" },
  { id: "M020", gender: "M", name: "Miguel Campaganani",   badgeName: "Miguel",    category: "Adolescente",   church: "Newark, NJ - EUA",        role: "",        familyId: "F002", gaId: "GA001" },
  { id: "M021", gender: "M", name: "Filipe Bicalho",       badgeName: "Filipe B",  category: "Adulto",        church: "Newark, NJ - EUA",        role: "Diácono", familyId: "F004", gaId: "GA001" },
  { id: "M022", gender: "F", name: "Sulamita Bicalho",     badgeName: "Suli",      category: "Adulto",        church: "Newark, NJ - EUA",        role: "",        familyId: "F004", gaId: "GA001" },
  { id: "M023", gender: "F", name: "Isabel Bicalho",       badgeName: "Isabel",    category: "Criança",       church: "Newark, NJ - EUA",        role: "",        familyId: "F004", gaId: "GA001" },
  { id: "M024", gender: "M", name: "Anderson Maria",       badgeName: "Anderson",  category: "Adulto",        church: "Newark, NJ - EUA",        role: "Diácono", familyId: null,   gaId: "GA001" },
  { id: "M025", gender: "M", name: "Ricardo Menezes",      badgeName: "Ricardo",   category: "Adulto",        church: "New York, NY - EUA",      role: "",        familyId: null,   gaId: "GA002" },
  { id: "M026", gender: "F", name: "Ákila Nascimento",     badgeName: "Ákila",     category: "Adulto",        church: "Philadelphia, PA - EUA",  role: "",        familyId: null,   gaId: "GA003" },
  { id: "M027", gender: "F", name: "Viviane Bessoni",      badgeName: "Viviane",   category: "Adulto",        church: "Philadelphia, PA - EUA",  role: "",        familyId: "F007", gaId: "GA003" },
  { id: "M028", gender: "M", name: "Mateus Bessoni",       badgeName: "Mateus",    category: "Adulto",        church: "Philadelphia, PA - EUA",  role: "Diácono", familyId: "F007", gaId: "GA003" },
  { id: "M029", gender: "M", name: "Felipe Bessoni",       badgeName: "Felipe",    category: "Jovem",         church: "Philadelphia, PA - EUA",  role: "",        familyId: "F007", gaId: "GA003" },
  { id: "M030", gender: "F", name: "Dayani Baptista",      badgeName: "Dayani",    category: "Adulto",        church: "Philadelphia, PA - EUA",  role: "",        familyId: null,   gaId: "GA003" },
  { id: "M031", gender: "M", name: "Afonso Carvalho",      badgeName: "Afonso",    category: "Adulto",        church: "Philadelphia, PA - EUA",  role: "",        familyId: null,   gaId: "GA003" },
  { id: "M032", gender: "M", name: "Edgard Soares",        badgeName: "Edgard",    category: "Adulto",        church: "New York, NY - EUA",      role: "",        familyId: null,   gaId: "GA002" },
  { id: "M033", gender: "M", name: "José de Freitas",      badgeName: "José",      category: "Adulto",        church: "Philadelphia, PA - EUA",  role: "",        familyId: null,   gaId: "GA003" },
  { id: "M034", gender: "M", name: "Wenderson Silva",      badgeName: "Wenderson", category: "Adulto",        church: "Newark, NJ - EUA",        role: "",        familyId: null,   gaId: "GA001" },
  { id: "M035", gender: "M", name: "Jésus Gomez",          badgeName: "Jésus",     category: "Adulto",        church: "Philadelphia, PA - EUA",  role: "",        familyId: null,   gaId: "GA003" },
  { id: "M036", gender: "M", name: "Narciso Pereira",      badgeName: "Narciso",   category: "Adulto",        church: "Newark, NJ - EUA",        role: "",        familyId: null,   gaId: "GA001" },
];

export const INIT_FAMILIES = [
  { id: "F001", name: "Família Pimentel",     memberIds: ["M001", "M002", "M003", "M004"] },
  { id: "F002", name: "Família Campaganani",  memberIds: ["M018", "M019", "M020"] },
  { id: "F003", name: "Família Gonçalves",    memberIds: ["M007", "M008", "M009"] },
  { id: "F004", name: "Família Bicalho",      memberIds: ["M021", "M022", "M023"] },
  { id: "F005", name: "Família do Carmo",     memberIds: ["M015", "M016", "M017"] },
  { id: "F006", name: "Família Alves",        memberIds: ["M011", "M012", "M013", "M014"] },
  { id: "F007", name: "Família Bessoni",      memberIds: ["M027", "M028", "M029"] },
];

export const INIT_GAS = [
  { id: "GA001", name: "GA Newark Central", church: "Newark, NJ - EUA",        leaderId: "M011", description: "" },
  { id: "GA002", name: "GA New York",       church: "New York, NY - EUA",      leaderId: "M007", description: "" },
  { id: "GA003", name: "GA Philadelphia",   church: "Philadelphia, PA - EUA",  leaderId: "M031", description: "" },
];

export const INIT_ROSTERS = [
  { eventId: "EVT001", team: "Cozinha",         leaderId: "", description: "", memberIds: ["M027", "M030", "M031"] },
  { eventId: "EVT001", team: "Grupo de Louvor", leaderId: "", description: "", memberIds: ["M003", "M026", "M029"] },
  { eventId: "EVT001", team: "Diáconos",        leaderId: "", description: "", memberIds: ["M007", "M011", "M021", "M024"] },
  { eventId: "EVT001", team: "Limpeza",         memberIds: ["M015"] },
  { eventId: "EVT001", team: "Pastores",        memberIds: ["M001", "M005"] },
  { eventId: "EVT001", team: "Segurança",       memberIds: ["M010", "M025", "M033"] },
  { eventId: "EVT001", team: "Som & Projeção",  memberIds: ["M034"] },
  { eventId: "EVT001", team: "Tradução",        memberIds: ["M035"] },
  { eventId: "EVT001", team: "Transporte",      memberIds: ["M036"] },
  { eventId: "EVT001", team: "Professoras",     memberIds: ["M032"] },
  { eventId: "EVT001", team: "Secretaria",      memberIds: ["M011"] },
];

export const INIT_USERS = [
  { id: 1,  name: "Admin Geral",     sysRole: "admin",       pin: "1234", initials: "AG", church: null,                       gaIds: [],          teamLeads: [] },
  { id: 2,  name: "Filipe Bicalho",  sysRole: "clerk",       pin: "2222", initials: "FB", church: "Newark, NJ - EUA",         gaIds: [],          teamLeads: [] },
  { id: 3,  name: "Leonard Alves",   sysRole: "clerk",       pin: "3333", initials: "LA", church: "Newark, NJ - EUA",         gaIds: [],          teamLeads: [] },
  { id: 4,  name: "Pastor Nairon",   sysRole: "pastor",      pin: "4444", initials: "PN", church: null,                       gaIds: [],          teamLeads: [] },
  { id: 5,  name: "Leonard Alves",   sysRole: "ga_leader",   pin: "5555", initials: "LA", church: "Newark, NJ - EUA",         gaIds: ["GA001"],   teamLeads: [] },
  { id: 6,  name: "Afonso Carvalho", sysRole: "ga_leader",   pin: "6666", initials: "AC", church: "Philadelphia, PA - EUA",   gaIds: ["GA003"],   teamLeads: [] },
  { id: 7,  name: "Afonso Carvalho", sysRole: "team_leader", pin: "7001", initials: "AC", church: null, gaIds: [], teamLeads: ["Cozinha"] },
  { id: 8,  name: "Edgard Soares",   sysRole: "team_leader", pin: "7002", initials: "ES", church: null, gaIds: [], teamLeads: ["Professoras"] },
  { id: 9,  name: "Leonard Alves",   sysRole: "team_leader", pin: "7003", initials: "LA", church: null, gaIds: [], teamLeads: ["Secretaria"] },
  { id: 10, name: "José de Freitas", sysRole: "team_leader", pin: "7004", initials: "JF", church: null, gaIds: [], teamLeads: ["Segurança"] },
  { id: 11, name: "Wenderson Silva", sysRole: "team_leader", pin: "7005", initials: "WS", church: null, gaIds: [], teamLeads: ["Som & Projeção"] },
  { id: 12, name: "Jésus Gomez",     sysRole: "team_leader", pin: "7006", initials: "JG", church: null, gaIds: [], teamLeads: ["Tradução"] },
  { id: 13, name: "Narciso Pereira", sysRole: "team_leader", pin: "7007", initials: "NP", church: null, gaIds: [], teamLeads: ["Transporte"] },
  { id: 14, name: "Anderson Maria",  sysRole: "team_leader", pin: "7008", initials: "AM", church: null, gaIds: [], teamLeads: ["Grupo de Louvor"] },
  { id: 15, name: "Jonas do Carmo",  sysRole: "team_leader", pin: "7009", initials: "JC", church: null, gaIds: [], teamLeads: ["Limpeza"] },
  { id: 16, name: "Filipe Bicalho",  sysRole: "team_leader", pin: "7010", initials: "FB", church: null, gaIds: [], teamLeads: ["Diáconos"] },
];

export const SAMPLE_EVENT = {
  id: "EVT001", name: "Seminário Para Principiantes 2026", prefix: "PHL", locationCode: "PHL",
  date: "2026-06-06", time: "10:30", location: "Philadelphia, PA", capacity: 14,
  fees: { "0-3": 0, "Criança": 0, "Intermediário": 0, "Adolescente": 25, "Jovem": 25, "Adulto": 25 },
  paymentDeadlineDays: 7, status: "active",
};

export const makeRegs = () => [
  { id: "REG001", regNumber: "PHL-20260419-001-1", eventId: "EVT001", memberId: "M001", memberName: "Nairon Pimentel",     badgeName: "Nairon",    category: "Adulto",        church: "Newark, NJ - EUA",       role: "Pastor",  team: "Pastores",        fee: 0,  paid: false, exempt: true,  cancelled: false, waitlisted: false, excedente: false, registeredAt: "2026-04-19", registeredBy: "Filipe Bicalho", gaId: "GA001", familyId: "F001", note: "" },
  { id: "REG002", regNumber: "PHL-20260419-002-1", eventId: "EVT001", memberId: "M002", memberName: "Rose Pimentel",       badgeName: "Rose",      category: "Adulto",        church: "Newark, NJ - EUA",       role: "",        team: "Participante",    fee: 25, paid: true,  exempt: false, cancelled: false, waitlisted: false, excedente: false, registeredAt: "2026-04-19", registeredBy: "Filipe Bicalho", gaId: "GA001", familyId: "F001", note: "" },
  { id: "REG003", regNumber: "PHL-20260419-003-1", eventId: "EVT001", memberId: "M003", memberName: "Lucas Pimentel",      badgeName: "Lucas",     category: "Jovem",         church: "Newark, NJ - EUA",       role: "",        team: "Grupo de Louvor", fee: 25, paid: false, exempt: false, cancelled: false, waitlisted: false, excedente: false, registeredAt: "2026-04-19", registeredBy: "Filipe Bicalho", gaId: "GA001", familyId: "F001", note: "" },
  { id: "REG004", regNumber: "PHL-20260419-004-1", eventId: "EVT001", memberId: "M007", memberName: "Reinaldo Gonçalves",  badgeName: "Reinaldo",  category: "Adulto",        church: "New York, NY - EUA",     role: "Diácono", team: "Diáconos",        fee: 25, paid: true,  exempt: false, cancelled: false, waitlisted: false, excedente: false, registeredAt: "2026-04-19", registeredBy: "Filipe Bicalho", gaId: "GA002", familyId: "F003", note: "" },
  { id: "REG005", regNumber: "PHL-20260419-005-1", eventId: "EVT001", memberId: "M008", memberName: "Adriana Gonçalves",   badgeName: "Adriana",   category: "Adulto",        church: "New York, NY - EUA",     role: "",        team: "Participante",    fee: 25, paid: false, exempt: false, cancelled: false, waitlisted: false, excedente: false, registeredAt: "2026-04-19", registeredBy: "Filipe Bicalho", gaId: "GA002", familyId: "F003", note: "" },
  { id: "REG006", regNumber: "PHL-20260419-006-1", eventId: "EVT001", memberId: "M009", memberName: "Liz Gonçalves",       badgeName: "Liz",       category: "Criança",       church: "New York, NY - EUA",     role: "",        team: "Participante",    fee: 0,  paid: false, exempt: true,  cancelled: false, waitlisted: false, excedente: false, registeredAt: "2026-04-19", registeredBy: "Filipe Bicalho", gaId: "GA002", familyId: "F003", note: "" },
  { id: "REG007", regNumber: "PHL-20260419-007-1", eventId: "EVT001", memberId: "M011", memberName: "Leonard Alves",       badgeName: "Leonard",   category: "Adulto",        church: "Newark, NJ - EUA",       role: "Diácono", team: "Diáconos",        fee: 25, paid: false, exempt: false, cancelled: false, waitlisted: false, excedente: false, registeredAt: "2026-04-19", registeredBy: "Filipe Bicalho", gaId: "GA001", familyId: "F006", note: "" },
  { id: "REG008", regNumber: "PHL-20260419-008-1", eventId: "EVT001", memberId: "M015", memberName: "Jonas do Carmo",      badgeName: "Jonas",     category: "Adulto",        church: "Newark, NJ - EUA",       role: "",        team: "Limpeza",         fee: 25, paid: true,  exempt: false, cancelled: false, waitlisted: false, excedente: false, registeredAt: "2026-04-19", registeredBy: "Filipe Bicalho", gaId: "GA001", familyId: "F005", note: "" },
  { id: "REG009", regNumber: "PHL-20260419-009-1", eventId: "EVT001", memberId: "M018", memberName: "Gabriel Campaganani", badgeName: "Gabriel C", category: "Adulto",        church: "Newark, NJ - EUA",       role: "",        team: "Participante",    fee: 25, paid: false, exempt: false, cancelled: false, waitlisted: false, excedente: false, registeredAt: "2026-04-19", registeredBy: "Filipe Bicalho", gaId: "GA001", familyId: "F002", note: "" },
  { id: "REG010", regNumber: "PHL-20260419-010-1", eventId: "EVT001", memberId: "M021", memberName: "Filipe Bicalho",      badgeName: "Filipe B",  category: "Adulto",        church: "Newark, NJ - EUA",       role: "Diácono", team: "Diáconos",        fee: 25, paid: false, exempt: false, cancelled: false, waitlisted: false, excedente: false, registeredAt: "2026-04-19", registeredBy: "Filipe Bicalho", gaId: "GA001", familyId: "F004", note: "" },
  { id: "REG011", regNumber: "PHL-20260514-011-1", eventId: "EVT001", memberId: "M026", memberName: "Ákila Nascimento",    badgeName: "Ákila",     category: "Adulto",        church: "Philadelphia, PA - EUA", role: "",        team: "Grupo de Louvor", fee: 25, paid: true,  exempt: false, cancelled: false, waitlisted: false, excedente: false, registeredAt: "2026-05-14", registeredBy: "Admin",          gaId: "GA003", familyId: null,   note: "" },
  { id: "REG012", regNumber: "PHL-20260514-012-1", eventId: "EVT001", memberId: "M027", memberName: "Viviane Bessoni",     badgeName: "Viviane",   category: "Adulto",        church: "Philadelphia, PA - EUA", role: "",        team: "Cozinha",         fee: 25, paid: true,  exempt: false, cancelled: false, waitlisted: false, excedente: false, registeredAt: "2026-05-14", registeredBy: "Admin",          gaId: "GA003", familyId: "F007", note: "" },
  { id: "REG013", regNumber: "PHL-20260514-013-1", eventId: "EVT001", memberId: "M024", memberName: "Anderson Maria",      badgeName: "Anderson",  category: "Adulto",        church: "Newark, NJ - EUA",       role: "Diácono", team: "Diáconos",        fee: 25, paid: false, exempt: false, cancelled: false, waitlisted: false, excedente: false, registeredAt: "2026-05-14", registeredBy: "Admin",          gaId: "GA001", familyId: null,   note: "" },
  { id: "REG014", regNumber: "PHL-20260514-014-1", eventId: "EVT001", memberId: "M010", memberName: "Filipe Santos",       badgeName: "Filipe",    category: "Adulto",        church: "Newark, NJ - EUA",       role: "",        team: "Segurança",       fee: 25, paid: false, exempt: false, cancelled: false, waitlisted: true,  excedente: false, registeredAt: "2026-05-14", registeredBy: "Admin",          gaId: "GA001", familyId: null,   note: "" },
  { id: "REG015", regNumber: "PHL-20260515-015-1", eventId: "EVT001", memberId: "M025", memberName: "Ricardo Menezes",     badgeName: "Ricardo",   category: "Adulto",        church: "New York, NY - EUA",     role: "",        team: "Participante",    fee: 25, paid: false, exempt: false, cancelled: false, waitlisted: true,  excedente: false, registeredAt: "2026-05-15", registeredBy: "Admin",          gaId: "GA002", familyId: null,   note: "" },
];

export const INIT_APPROVALS = [
  { id: "APR001", type: "capacity_override", eventId: "EVT001", requestedBy: "Filipe Bicalho", requestedById: 2, memberName: "Dayani Baptista", memberId: "M030", category: "Adulto", church: "Philadelphia, PA - EUA", role: "", team: "Cozinha",  fee: 25, note: "Chegou atrasada mas faz parte da equipe da cozinha.", status: "pending", createdAt: "2026-05-16" },
  { id: "APR002", type: "exemption",          eventId: "EVT001", requestedBy: "Leonard Alves",  requestedById: 3, memberName: "Jonas do Carmo",   memberId: "M015", regId: "REG008", category: "Adulto", church: "Newark, NJ - EUA",       role: "", team: "Limpeza", fee: 25, note: "Pastor autorizou isenção por contribuição especial.", status: "pending", createdAt: "2026-05-16" },
];