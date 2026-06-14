import { describe, it, expect } from "vitest";
import { mapReg, mapApproval } from "../hooks/useAppData.js";

// ── mapReg ────────────────────────────────────────────────────────────────────

const baseRow = {
  id: "abc-123",
  reg_number: "MCC-20260613-0001",
  event_id: "evt-1",
  member_id: "mem-1",
  member_name: "João Silva",
  badge_name: "João",
  category: "Adulto",
  church: "Newark, NJ - EUA",
  role: "Diácono",
  family_id: null,
  team: "Participante",
  presence: "unknown",
  fee: "25.00",
  paid: false,
  exempt: false,
  cancelled: false,
  waitlisted: false,
  waitlist_reason: null,
  excedente: false,
  needs_translation: false,
  note: "[B1749900000000] | Tel: +1 555 0000",
  badge_printed: false,
  timeline: [],
  registered_at: "2026-06-13",
  registered_by: "Atendente 1",
  checked_in_at: null,
  checkin_method: null,
};

describe("mapReg", () => {
  it("maps snake_case DB columns to camelCase", () => {
    const r = mapReg(baseRow);
    expect(r.id).toBe("abc-123");
    expect(r.regNumber).toBe("MCC-20260613-0001");
    expect(r.eventId).toBe("evt-1");
    expect(r.memberId).toBe("mem-1");
    expect(r.memberName).toBe("João Silva");
    expect(r.badgeName).toBe("João");
    expect(r.registeredAt).toBe("2026-06-13");
    expect(r.registeredBy).toBe("Atendente 1");
  });

  it("coerces fee to number", () => {
    const r = mapReg(baseRow);
    expect(r.fee).toBe(25);
    expect(typeof r.fee).toBe("number");
  });

  it("coerces boolean flags", () => {
    const r = mapReg(baseRow);
    expect(r.paid).toBe(false);
    expect(r.exempt).toBe(false);
    expect(r.cancelled).toBe(false);
    expect(r.waitlisted).toBe(false);
    expect(r.excedente).toBe(false);
    expect(r.badgePrinted).toBe(false);
  });

  it("defaults presence to 'unknown' when null", () => {
    const r = mapReg({ ...baseRow, presence: null });
    expect(r.presence).toBe("unknown");
  });

  it("falls back badgeName to member_name when badge_name is absent", () => {
    const r = mapReg({ ...baseRow, badge_name: null });
    expect(r.badgeName).toBe("João Silva");
  });

  it("defaults team to 'Participante' when null", () => {
    const r = mapReg({ ...baseRow, team: null });
    expect(r.team).toBe("Participante");
  });

  it("defaults timeline to empty array when null", () => {
    const r = mapReg({ ...baseRow, timeline: null });
    expect(r.timeline).toEqual([]);
  });

  it("marks paid correctly", () => {
    const r = mapReg({ ...baseRow, paid: true });
    expect(r.paid).toBe(true);
  });

  it("marks exempt correctly", () => {
    const r = mapReg({ ...baseRow, exempt: true, fee: "0" });
    expect(r.exempt).toBe(true);
    expect(r.fee).toBe(0);
  });

  it("maps waitlisted with reason", () => {
    const r = mapReg({ ...baseRow, waitlisted: true, waitlist_reason: "Capacidade esgotada" });
    expect(r.waitlisted).toBe(true);
    expect(r.waitlistReason).toBe("Capacidade esgotada");
  });

  it("maps checkin fields", () => {
    const r = mapReg({ ...baseRow, checked_in_at: "2026-06-14T10:00:00", checkin_method: "qr" });
    expect(r.checkedInAt).toBe("2026-06-14T10:00:00");
    expect(r.checkinMethod).toBe("qr");
  });
});

// ── batch token extraction ────────────────────────────────────────────────────

function extractBatchId(note) {
  const m = (note || "").match(/\[B\d+\]/);
  return m ? m[0] : null;
}

describe("extractBatchId", () => {
  it("extracts token from a note with contact info", () => {
    expect(extractBatchId("[B1749900000000] | Tel: +1 555 0000")).toBe("[B1749900000000]");
  });

  it("extracts token from a note with only the token", () => {
    expect(extractBatchId("[B1000000000000]")).toBe("[B1000000000000]");
  });

  it("returns null when no token present", () => {
    expect(extractBatchId("Tel: +1 555 0000")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(extractBatchId("")).toBeNull();
  });

  it("returns null for null", () => {
    expect(extractBatchId(null)).toBeNull();
  });
});

// ── reg number date parsing ───────────────────────────────────────────────────

function dateFromRegNumber(regNumber) {
  const d = (regNumber || "").split("-")[1] || "";
  return d.length === 8 ? `${d.slice(6, 8)}/${d.slice(4, 6)}/${d.slice(0, 4)}` : "";
}

describe("dateFromRegNumber", () => {
  it("parses a standard reg number", () => {
    expect(dateFromRegNumber("MCC-20260613-0001")).toBe("13/06/2026");
  });

  it("returns empty string for malformed reg number", () => {
    expect(dateFromRegNumber("INVALID")).toBe("");
  });

  it("returns empty string for null", () => {
    expect(dateFromRegNumber(null)).toBe("");
  });
});

// ── status label logic ────────────────────────────────────────────────────────

function getRegStatus(reg) {
  if (reg.cancelled)  return "Cancelado";
  if (reg.waitlisted) return "Lista de Espera";
  if (reg.excedente)  return "Excedente";
  if (reg.exempt)     return "Isento";
  if (reg.paid)       return "Pago";
  return "Pendente";
}

const base = { cancelled: false, waitlisted: false, excedente: false, exempt: false, paid: false };

describe("getRegStatus", () => {
  it("returns Pendente for a fresh registration", () => {
    expect(getRegStatus(base)).toBe("Pendente");
  });
  it("returns Pago when paid", () => {
    expect(getRegStatus({ ...base, paid: true })).toBe("Pago");
  });
  it("returns Isento when exempt", () => {
    expect(getRegStatus({ ...base, exempt: true })).toBe("Isento");
  });
  it("returns Lista de Espera when waitlisted", () => {
    expect(getRegStatus({ ...base, waitlisted: true })).toBe("Lista de Espera");
  });
  it("returns Excedente when excedente", () => {
    expect(getRegStatus({ ...base, excedente: true })).toBe("Excedente");
  });
  it("returns Cancelado when cancelled (takes priority)", () => {
    expect(getRegStatus({ ...base, cancelled: true, paid: true })).toBe("Cancelado");
  });
});
