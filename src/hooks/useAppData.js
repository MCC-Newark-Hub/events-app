import { useState, useMemo, useEffect } from "react";
import { CHURCH_LIST } from "@/constants";
import { sb } from "@/lib/supabase";

// ── DB → app object mappers ───────────────────────────────────────────────────
export function mapMember(m) {
  return {
    id: m.id,
    name: m.name,
    badgeName: m.badge_name,
    gender: m.gender,
    category: m.category,
    church: m.church,
    role: m.role || "",
    familyId: m.family_id,
    gaId: m.ga_id,
  };
}
export function mapFamily(f) {
  return { id: f.id, name: f.name, memberIds: f.member_ids || [] };
}
export function mapGA(g) {
  return {
    id: g.id,
    name: g.name,
    church: g.church,
    leaderId: g.leader_id,
    description: g.description || "",
  };
}
export function mapReg(r) {
  return {
    id: r.id,
    regNumber: r.reg_number,
    eventId: r.event_id,
    memberId: r.member_id,
    memberName: r.member_name,
    badgeName: r.badge_name || r.member_name,
    category: r.category,
    church: r.church,
    role: r.role,
    familyId: r.family_id,
    team: r.team || "Participante",
    fee: Number(r.fee || 0),
    paid: !!r.paid,
    exempt: !!r.exempt,
    cancelled: !!r.cancelled,
    waitlisted: !!r.waitlisted,
    waitlistReason: r.waitlist_reason,
    excedente: !!r.excedente,
    needsTranslation: !!r.needs_translation,
    note: r.note || "",
    badgePrinted: !!r.badge_printed,
    timeline: r.timeline || [],
    registeredAt: r.registered_at,
    registeredBy: r.registered_by,
  };
}
export function mapApproval(a) {
  return {
    id: a.id,
    eventId: a.event_id,
    memberId: a.member_id,
    memberName: a.member_name,
    type: a.type,
    reason: a.reason,
    status: a.status,
    requestedBy: a.requested_by,
    resolvedBy: a.resolved_by,
    resolvedAt: a.resolved_at,
    createdAt: a.created_at,
  };
}
export function mapRoster(r) {
  return {
    id: r.id,
    eventId: r.event_id,
    team: r.team,
    leaderId: r.leader_id,
    description: r.description || "",
    memberIds: r.member_ids || [],
  };
}

const OBREIRO_ROLES = ["Pastor", "Ungido", "Diácono", "Obreiro"];

export function useAppData({ getUserRef, notify }) {
  // Support both a getter function (for ref-based pattern) and a direct value
  const getUser = typeof getUserRef === "function" ? getUserRef : () => getUserRef;
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null);
  const [events, setEvents] = useState([]);
  const [regs, setRegs] = useState([]);
  const [members, setMembers] = useState([]);
  const [families, setFamilies] = useState([]);
  const [gas, setGas] = useState([]);
  const [churches, setChurches] = useState(CHURCH_LIST);
  const [rosters, setRosters] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [event, setEvent] = useState(null);
  const [seq, setSeq] = useState(0);
  const [dbCategories, setDbCategories] = useState([]);
  const [dbFunctions, setDbFunctions] = useState([]);
  const [dbUsers, setDbUsers] = useState([]);

  // ── Load all data from Supabase on mount ─────────────────────────────────
  useEffect(function () {
    var cancelled = false;
    async function loadAll() {
      setLoading(true);
      try {
        var [evRes, memRes, famRes, gaRes, regRes, aprRes, rosRes, chrRes, usrRes, catRes, fnRes] =
          await Promise.all([
            sb.from("events").select("*").order("date"),
            sb.from("members").select("*").order("name"),
            sb.from("families").select("*"),
            sb.from("assistance_groups").select("*"),
            sb.from("registrations").select("*").order("created_at"),
            sb.from("approvals").select("*").order("created_at"),
            sb.from("rosters").select("*"),
            sb.from("churches").select("*").order("display"),
            sb.from("app_users").select("*"),
            sb.from("categories").select("*").order("sort_order"),
            sb.from("functions").select("*").order("sort_order"),
          ]);
        if (cancelled) return;
        if (evRes.error) {
          setDbError(evRes.error.message);
          setLoading(false);
          return;
        }
        var evList = evRes.data || [];
        setEvents(evList);
        setEvent(evList[0] || null);
        setMembers((memRes.data || []).map(mapMember));
        setFamilies((famRes.data || []).map(mapFamily));
        setGas((gaRes.data || []).map(mapGA));
        setRegs((regRes.data || []).map(mapReg));
        setApprovals((aprRes.data || []).map(mapApproval));
        setRosters((rosRes.data || []).map(mapRoster));
        if (chrRes.data && chrRes.data.length > 0) setChurches(chrRes.data);
        setDbUsers(usrRes.data || []);
        if (catRes.data && catRes.data.length > 0) setDbCategories(catRes.data);
        if (fnRes.data && fnRes.data.length > 0) setDbFunctions(fnRes.data);
        var maxSeq = (regRes.data || []).reduce(function (m, r) {
          var n = parseInt((r.reg_number || "").split("-")[2] || "0");
          return n > m ? n : m;
        }, 0);
        setSeq(maxSeq);
      } catch (e) {
        if (!cancelled) setDbError(e.message);
      }
      if (!cancelled) setLoading(false);
    }
    loadAll();
    return function () {
      cancelled = true;
    };
  }, []);

  // ── Derived state ─────────────────────────────────────────────────────────
  const activeRegs = useMemo(
    () => regs.filter((r) => r.eventId === event?.id && !r.cancelled && !r.waitlisted),
    [regs, event]
  );
  const activeCount = activeRegs.length;
  const isFull = event?.capacity ? activeCount >= event.capacity : false;
  const wlRegs = useMemo(
    () => regs.filter((r) => r.eventId === event?.id && r.waitlisted && !r.cancelled),
    [regs, event]
  );
  const exRegs = useMemo(() => activeRegs.filter((r) => r.excedente), [activeRegs]);
  const pendingApprovals = useMemo(
    () => approvals.filter((a) => a.eventId === event?.id && a.status === "pending"),
    [approvals, event]
  );

  // ── Mutations ─────────────────────────────────────────────────────────────
  const addReg = function (data, forceExcedente) {
    forceExcedente = forceExcedente || false;
    var fees = event.fees || {};
    var fee = fees[data.category] != null ? fees[data.category] : 0;
    var n = seq + 1;
    var d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    var isAutoExempt = OBREIRO_ROLES.includes(data.role);
    var isExempt = isAutoExempt || data.exempt || false;
    var isWaitlisted = !forceExcedente && isFull && !isExempt;
    var today = new Date().toISOString().slice(0, 10);
    var byName = getUser() ? getUser().name : "Sistema";
    var timeline = [
      { status: "Submetido", date: today, by: byName },
      { status: "Pendente", date: today, by: "Sistema" },
    ];
    var regNumber = event.prefix + "-" + d + "-" + String(n).padStart(4, "0");
    var dbRow = {
      reg_number: regNumber,
      event_id: event.id,
      member_id: data.memberId || "GUEST",
      member_name: data.memberName,
      badge_name: data.badgeName || data.memberName,
      category: data.category,
      church: data.church || "",
      role: data.role || "",
      family_id: data.familyId || null,
      team: data.team || "Participante",
      fee: isExempt ? 0 : fee,
      paid: data.paid || false,
      exempt: isExempt,
      cancelled: false,
      waitlisted: isWaitlisted,
      waitlist_reason: isWaitlisted ? "Capacidade esgotada" : null,
      excedente: forceExcedente,
      needs_translation: data.needsTranslation || false,
      note: data.note || "",
      badge_printed: false,
      timeline: timeline,
      registered_at: today,
      registered_by: byName,
    };
    var r = mapReg({ ...dbRow, id: "tmp-" + n, reg_number: regNumber });
    setRegs(function (p) {
      return [...p, r];
    });
    setSeq(n);
    var label = forceExcedente ? "Excedente" : isWaitlisted ? "Em Espera" : "OK";
    notify(data.memberName + " " + label + "! (" + regNumber + ")");
    sb.from("registrations")
      .insert(dbRow)
      .then(function (res) {
        if (res.error) {
          console.error("addReg DB error:", res.error);
          return;
        }
        setRegs(function (p) {
          return p.map(function (x) {
            return x.regNumber === regNumber ? mapReg(res.data) : x;
          });
        });
      });
    return r;
  };

  const updateReg = function (id, upd, timelineEntry) {
    timelineEntry = timelineEntry || null;
    var freedSlot = false;
    var today = new Date().toISOString().slice(0, 10);
    var byName = getUser() ? getUser().name : "Sistema";
    var updatedReg = null;
    setRegs(function (p) {
      return p.map(function (r) {
        if (r.id !== id) return r;
        if ((upd.cancelled || upd.waitlisted) && !r.cancelled && !r.waitlisted) freedSlot = true;
        var updated = Object.assign({}, r, upd);
        if (timelineEntry) {
          updated.timeline = [].concat(r.timeline || [], [
            Object.assign({}, timelineEntry, { date: today, by: byName }),
          ]);
        }
        updatedReg = updated;
        return updated;
      });
    });
    notify("Atualizado!");
    if (freedSlot) {
      setTimeout(function () {
        setRegs(function (curr) {
          var wl = curr.filter(function (r) {
            return r.eventId === event?.id && r.waitlisted && !r.cancelled;
          });
          if (wl.length > 0)
            notify("Vaga liberada! " + wl[0].memberName + " esta em 1o na lista de espera.");
          return curr;
        });
      }, 400);
    }
    var dbUpd = {};
    if (upd.paid != null) dbUpd.paid = upd.paid;
    if (upd.exempt != null) dbUpd.exempt = upd.exempt;
    if (upd.cancelled != null) dbUpd.cancelled = upd.cancelled;
    if (upd.waitlisted != null) dbUpd.waitlisted = upd.waitlisted;
    if (upd.waitlistReason != null) dbUpd.waitlist_reason = upd.waitlistReason;
    if (upd.excedente != null) dbUpd.excedente = upd.excedente;
    if (upd.badgePrinted != null) dbUpd.badge_printed = upd.badgePrinted;
    if (upd.note != null) dbUpd.note = upd.note;
    if (upd.fee != null) dbUpd.fee = upd.fee;
    if (upd.team != null) dbUpd.team = upd.team;
    if (timelineEntry && updatedReg) dbUpd.timeline = updatedReg.timeline;
    if (Object.keys(dbUpd).length > 0) {
      sb.from("registrations")
        .eq("id", id)
        .update(dbUpd)
        .then(function (res) {
          if (res.error) console.error("updateReg DB error:", res.error);
        });
    }
  };

  const submitApproval = function (data) {
    var today = new Date().toISOString().slice(0, 10);
    var dbRow = {
      event_id: data.eventId,
      member_id: data.memberId,
      member_name: data.memberName,
      type: data.type,
      reason: data.reason || "",
      status: "pending",
      requested_by: getUser() ? getUser().name : "Sistema",
    };
    var tmp = { id: "tmp-apr-" + Date.now(), status: "pending", createdAt: today, ...data };
    setApprovals(function (p) {
      return [...p, tmp];
    });
    notify("Solicitacao enviada ao pastor!");
    sb.from("approvals")
      .insert(dbRow)
      .then(function (res) {
        if (res.error) {
          console.error("submitApproval error:", res.error);
          return;
        }
        setApprovals(function (p) {
          return p.map(function (a) {
            return a.id === tmp.id ? mapApproval(res.data) : a;
          });
        });
      });
    return tmp;
  };

  const resolveApproval = function (id, approved, pastorNote) {
    pastorNote = pastorNote || "";
    var apr = approvals.find(function (a) {
      return a.id === id;
    });
    var today = new Date().toISOString().slice(0, 10);
    setApprovals(function (p) {
      return p.map(function (a) {
        return a.id === id
          ? Object.assign({}, a, {
              status: approved ? "approved" : "denied",
              pastorNote,
              resolvedAt: today,
            })
          : a;
      });
    });
    sb.from("approvals")
      .eq("id", id)
      .update({
        status: approved ? "approved" : "denied",
        resolved_by: getUser() ? getUser().name : "Pastor",
        resolved_at: today,
      })
      .then(function (res) {
        if (res.error) console.error("resolveApproval error:", res.error);
      });
    if (!apr) return;
    if (approved) {
      if (apr.type === "capacity_override") {
        addReg(
          {
            memberId: apr.memberId,
            memberName: apr.memberName,
            badgeName: apr.memberName,
            category: apr.category,
            church: apr.church,
            role: apr.role,
            team: apr.team,
            fee: apr.fee,
            paid: false,
            exempt: false,
            note: apr.note,
          },
          true
        );
      } else if (apr.type === "exemption") {
        updateReg(apr.regId, { exempt: true, fee: 0 });
        notify("Isencao aprovada para " + apr.memberName + ".");
      }
    } else {
      notify("Solicitacao negada.");
    }
  };

  const promoteFromWaitlist = (regId) => {
    setRegs((p) =>
      p.map((r) =>
        r.id === regId
          ? {
              ...r,
              waitlisted: false,
              waitlistReason: null,
              timeline: [
                ...(r.timeline || []),
                {
                  status: "Confirmado",
                  date: new Date().toISOString().slice(0, 10),
                  by: getUser()?.name || "Sistema",
                  note: "Confirmado da lista de espera",
                },
              ],
            }
          : r
      )
    );
    notify("Participante confirmado da lista de espera!");
  };

  return {
    loading,
    dbError,
    events,
    setEvents,
    event,
    setEvent,
    regs,
    setRegs,
    members,
    setMembers,
    families,
    setFamilies,
    gas,
    setGas,
    churches,
    setChurches,
    rosters,
    setRosters,
    approvals,
    setApprovals,
    seq,
    setSeq,
    dbCategories,
    dbFunctions,
    dbUsers,
    setDbUsers,
    activeRegs,
    activeCount,
    isFull,
    wlRegs,
    exRegs,
    pendingApprovals,
    addReg,
    updateReg,
    submitApproval,
    resolveApproval,
    promoteFromWaitlist,
  };
}
