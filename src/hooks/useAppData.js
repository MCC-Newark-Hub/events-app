import { useState, useMemo, useEffect, useRef } from "react";
import { CHURCH_LIST } from "@/constants";
import { sb } from "@/lib/supabase";

// ── DB → app object mappers ───────────────────────────────────────────────────
export function mapMember(m) {
  return {
    id: m.id,
    name: m.name,
    firstName: m.first_name || '',
    lastName: m.last_name || '',
    badgeName: m.badge_name,
    gender: m.gender,
    category: m.category,
    church: m.church,
    role: m.role || '',
    roles: m.roles || (m.role ? [m.role] : []),
    familyId: m.family_id,
    gaId: m.ga_id,
    allergies: m.allergies || '',
    specialNeeds: m.special_needs || '',
    notes: m.notes || '',
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
    presence: r.presence || 'unknown',
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
    checkedInAt: r.checked_in_at || null,
    checkinMethod: r.checkin_method || null,
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

export function mapTeam(t) {
  return {
    id: t.id,
    name: t.name,
    sortOrder: t.sort_order ?? 0,
    isService: t.is_service ?? true,
    description: t.description || "",
    leaderId: t.leader_id || null,
    responsibilities: t.responsibilities || "",
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
  const [dbTeams, setDbTeams] = useState([]);
  const seqRef = useRef(0);

  // ── Load all data from Supabase on mount ─────────────────────────────────
  useEffect(function () {
    var cancelled = false;
    async function loadAll() {
      setLoading(true);
      try {
        var [evRes, memRes, famRes, gaRes, regRes, aprRes, rosRes, chrRes, usrRes, catRes, fnRes, teamsRes] =
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
            sb.from("teams").select("*").order("sort_order"),
          ]);
        if (cancelled) return;
        if (evRes.error) {
          setDbError(evRes.error.message);
          setLoading(false);
          return;
        }
        if (memRes.error) console.error("Members query failed:", memRes.error);
        var evList = evRes.data || [];
        setEvents(evList);
        setEvent(evList[0] || null);
        var memberList = (memRes.data || []).map(mapMember);
        if (memberList.length === 0) console.warn("Members loaded as empty — check Supabase RLS on the members table");
        setMembers(memberList);
        setFamilies((famRes.data || []).map(mapFamily));
        setGas((gaRes.data || []).map(mapGA));
        setRegs((regRes.data || []).map(mapReg));
        setApprovals((aprRes.data || []).map(mapApproval));
        setRosters((rosRes.data || []).map(mapRoster));
        if (chrRes.data && chrRes.data.length > 0) setChurches(chrRes.data);
        setDbUsers(usrRes.data || []);
        if (catRes.data && catRes.data.length > 0) setDbCategories(catRes.data);
        if (fnRes.data && fnRes.data.length > 0) setDbFunctions(fnRes.data);
        setDbTeams((teamsRes.data || []).map(mapTeam));
        var maxSeq = (regRes.data || []).reduce(function (m, r) {
          var n = parseInt((r.reg_number || "").split("-")[2] || "0");
          return n > m ? n : m;
        }, 0);
        setSeq(maxSeq);
        seqRef.current = maxSeq;
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

  // ── Real-time subscriptions ───────────────────────────────────────────────
  useEffect(function () {
    const extractSeq = (regNumber) => parseInt((regNumber || "").split("-")[2] || "0");

    const channel = sb
      .channel("db-changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "registrations" }, function (payload) {
        const r = mapReg(payload.new);
        setRegs(function (p) {
          // Replace our own optimistic entry if present (matched by reg_number)
          if (p.some(function (x) { return x.regNumber === r.regNumber; }))
            return p.map(function (x) { return x.regNumber === r.regNumber ? r : x; });
          // New reg from another clerk — keep seqRef ahead of it
          const seq = extractSeq(r.regNumber);
          if (seq > seqRef.current) seqRef.current = seq;
          return [...p, r];
        });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "registrations" }, function (payload) {
        const r = mapReg(payload.new);
        setRegs(function (p) { return p.map(function (x) { return x.id === r.id ? r : x; }); });
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "registrations" }, function (payload) {
        setRegs(function (p) { return p.filter(function (x) { return x.id !== payload.old.id; }); });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "approvals" }, function (payload) {
        const a = mapApproval(payload.new);
        setApprovals(function (p) {
          if (p.some(function (x) { return x.id === a.id; })) return p;
          return [...p, a];
        });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "approvals" }, function (payload) {
        const a = mapApproval(payload.new);
        setApprovals(function (p) { return p.map(function (x) { return x.id === a.id ? a : x; }); });
      })
      .subscribe();

    return function () { sb.removeChannel(channel); };
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
    var n = seqRef.current + 1;
    seqRef.current = n;
    var d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    var isAutoExempt = ["Pastor", "Ungido"].includes(data.role);
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
      .select()
      .single()
      .then(function (res) {
        if (res.error) {
          console.error("addReg DB error:", res.error);
          return;
        }
        if (!res.data) return;
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
        var autoExempt = (upd.role != null && ["Pastor", "Ungido"].includes(upd.role))
          ? { exempt: true, fee: 0 }
          : {};
        var updated = Object.assign({}, r, upd, autoExempt);
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
    if (upd.paid != null)       dbUpd.paid           = upd.paid;
    if (upd.exempt != null)     dbUpd.exempt         = upd.exempt;
    if (upd.cancelled != null)  dbUpd.cancelled      = upd.cancelled;
    if (upd.waitlisted != null) dbUpd.waitlisted     = upd.waitlisted;
    if (upd.waitlistReason != null) dbUpd.waitlist_reason = upd.waitlistReason;
    if (upd.excedente != null)  dbUpd.excedente      = upd.excedente;
    if (upd.badgePrinted != null) dbUpd.badge_printed = upd.badgePrinted;
    if (upd.note != null)       dbUpd.note           = upd.note;
    if (upd.fee != null)        dbUpd.fee            = upd.fee;
    if (upd.team != null)       dbUpd.team           = upd.team;
    if (upd.role != null) {
      dbUpd.role = upd.role;
      // Auto-exempt Pastors and Ungidos when role is set
      if (["Pastor", "Ungido"].includes(upd.role)) {
        dbUpd.exempt = true;
        dbUpd.fee = 0;
      }
    }
    if (upd.badgeName != null)  dbUpd.badge_name     = upd.badgeName;
    if (upd.presence != null)   dbUpd.presence       = upd.presence;
    if (timelineEntry && updatedReg) dbUpd.timeline = updatedReg.timeline;
    if (Object.keys(dbUpd).length > 0) {
      sb.from("registrations")
        .update(dbUpd)
        .eq("id", id)
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
      .select()
      .single()
      .then(function (res) {
        if (res.error) {
          console.error("submitApproval error:", res.error);
          return;
        }
        if (!res.data) return;
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
      .update({
        status: approved ? "approved" : "denied",
        resolved_by: getUser() ? getUser().name : "Pastor",
        resolved_at: today,
      })
      .eq("id", id)
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

  const updatePresence = async (regId, presence, method = 'manual') => {
    const now = new Date().toISOString();
    setRegs((p) =>
      p.map((r) =>
        r.id === regId
          ? { ...r, presence, checkinMethod: method, checkedInAt: now }
          : r
      )
    );
    await sb
      .from('registrations')
      .update({ presence, checkin_method: method, checked_in_at: now })
      .eq('id', regId);
  };

  const promoteFromWaitlist = (regId) => {
    const today = new Date().toISOString().slice(0, 10);
    const byName = getUser()?.name || "Sistema";
    const entry = { status: "Confirmado", date: today, by: byName, note: "Confirmado da lista de espera" };
    let updatedTimeline;
    setRegs((p) =>
      p.map((r) => {
        if (r.id !== regId) return r;
        updatedTimeline = [...(r.timeline || []), entry];
        return { ...r, waitlisted: false, waitlistReason: null, timeline: updatedTimeline };
      })
    );
    notify("Participante confirmado da lista de espera!");
    sb.from("registrations")
      .update({ waitlisted: false, waitlist_reason: null, timeline: updatedTimeline })
      .eq("id", regId)
      .then(({ error }) => { if (error) console.error("promoteFromWaitlist DB error:", error); });
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
    dbTeams,
    setDbTeams,
    activeRegs,
    activeCount,
    isFull,
    wlRegs,
    exRegs,
    pendingApprovals,
    addReg,
    updateReg,
    updatePresence,
    submitApproval,
    resolveApproval,
    promoteFromWaitlist,
  };
}
