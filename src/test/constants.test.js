import { describe, it, expect } from "vitest";
import {
  fmt,
  daysSince,
  isDeadlineExempt,
  deadlineStatus,
  churchDisplay,
  churchCode,
  OBREIRO_ROLES,
  SERVICE_TEAMS,
} from "../constants/index.js";

describe("fmt", () => {
  it("formats 25 as $25.00", () => {
    expect(fmt(25)).toBe("$25.00");
  });
  it("formats 0 as $0.00", () => {
    expect(fmt(0)).toBe("$0.00");
  });
  it("formats decimal amounts", () => {
    expect(fmt(12.5)).toBe("$12.50");
  });
});

describe("daysSince", () => {
  it("returns 0 for today", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(daysSince(today)).toBe(0);
  });
});

describe("isDeadlineExempt", () => {
  it("returns true for Pastor role", () => {
    const reg = { role: "Pastor", paid: false, exempt: false, cancelled: false, waitlisted: false };
    expect(isDeadlineExempt(reg)).toBe(true);
  });

  it("returns true for Ungido role", () => {
    const reg = { role: "Ungido", paid: false, exempt: false, cancelled: false, waitlisted: false };
    expect(isDeadlineExempt(reg)).toBe(true);
  });

  it("returns true for a service team member", () => {
    const reg = {
      role: "",
      team: "Cozinha",
      paid: false,
      exempt: false,
      cancelled: false,
      waitlisted: false,
    };
    expect(isDeadlineExempt(reg)).toBe(true);
  });

  it("returns false for pending/unpaid Adulto with no special role or team", () => {
    const reg = {
      role: "",
      team: "Participante",
      paid: false,
      exempt: false,
      cancelled: false,
      waitlisted: false,
      category: "Adulto",
    };
    expect(isDeadlineExempt(reg)).toBe(false);
  });
});

describe("deadlineStatus", () => {
  it("returns null when no event", () => {
    const reg = { role: "", team: "Participante", paid: false, exempt: false, cancelled: false, waitlisted: false, registeredAt: "2026-01-01" };
    expect(deadlineStatus(reg, null)).toBeNull();
  });

  it("returns null when no paymentDeadlineDays on event", () => {
    const reg = { role: "", team: "Participante", paid: false, exempt: false, cancelled: false, waitlisted: false, registeredAt: "2026-01-01" };
    expect(deadlineStatus(reg, {})).toBeNull();
  });

  const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
  const event = { paymentDeadlineDays: 7 };
  const base = { memberId: "M1", role: "", team: "Participante", paid: false, exempt: false, cancelled: false, waitlisted: false, category: "Adulto" };

  it("works against a real Supabase-loaded event, which only has snake_case payment_deadline_days", () => {
    const snakeCaseEvent = { payment_deadline_days: 7 };
    const reg = { ...base, registeredAt: daysAgo(10) };
    expect(deadlineStatus(reg, snakeCaseEvent, [reg])?.overdue).toBe(true);
  });

  it("counts from the member's earliest attempt, including a cancelled one, not just this row", () => {
    const cancelledAttempt = { ...base, registeredAt: daysAgo(10), cancelled: true };
    const reg = { ...base, registeredAt: daysAgo(0) };
    expect(deadlineStatus(reg, event, [cancelledAttempt, reg])?.overdue).toBe(true);
  });

  it("does not pick up another member's earlier attempt", () => {
    const otherMembersOldAttempt = { ...base, memberId: "M2", registeredAt: daysAgo(30), cancelled: true };
    const reg = { ...base, registeredAt: daysAgo(0) };
    expect(deadlineStatus(reg, event, [otherMembersOldAttempt, reg])?.overdue).toBe(false);
  });

  it("does not pool history across GUEST registrations", () => {
    const otherGuestOldAttempt = { ...base, memberId: "GUEST", registeredAt: daysAgo(30), cancelled: true };
    const reg = { ...base, memberId: "GUEST", registeredAt: daysAgo(0) };
    expect(deadlineStatus(reg, event, [otherGuestOldAttempt, reg])?.overdue).toBe(false);
  });
});

describe("churchDisplay", () => {
  it("returns city without country code", () => {
    expect(churchDisplay("Newark, NJ - EUA")).toBe("Newark, NJ");
  });

  it("returns empty string for null", () => {
    expect(churchDisplay(null)).toBe("");
  });

  it("handles Outra prefix", () => {
    expect(churchDisplay("Outra: My Church")).toBe("My Church");
  });
});

describe("churchCode", () => {
  it("returns EUA for US churches", () => {
    expect(churchCode("Newark, NJ - EUA")).toBe("EUA");
  });

  it("returns CAN for Canadian churches", () => {
    expect(churchCode("Ajax, ON - CAN")).toBe("CAN");
  });

  it("returns empty string for null", () => {
    expect(churchCode(null)).toBe("");
  });
});
