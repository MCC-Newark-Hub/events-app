import { useState } from "react";
import { useT } from "@/i18n/strings";
import { CATEGORIES, ROLE_GROUPS, TEAMS, OBREIRO_ROLES, ROLE_BADGE, fmt } from "@/constants";
import { INIT_MEMBERS, INIT_FAMILIES } from "@/dev/seeds";
import FeeBox from "./FeeBox";
import ChurchSearch from "./ChurchSearch";

// Accent-insensitive search: "joao" matches "João"
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function RegModal({
  event,
  members,
  families: _families,
  churches,
  dbTeams,
  isFull,
  existingRegs,
  onClose,
  onSave,
  onRequestOverride,
  prefill,
}) {
  // Use DB teams if loaded, fallback to hardcoded constant
  const teamList = dbTeams && dbTeams.length > 0 ? dbTeams.map((t) => t.name) : TEAMS;
  const t = useT();
  const [mode, setMode] = useState("member");
  const [src, setSrc] = useState(prefill?.name || "");
  const [sel, setSel] = useState(prefill || null);
  const [selFam, setSelFam] = useState(null);
  const [famIds, setFamIds] = useState([]);
  const [overrideNote, setOverrideNote] = useState("");
  const [showOverride, setShowOverride] = useState(false);
  const [pendingData, setPendingData] = useState(null);
  const [bulkSel, setBulkSel] = useState([]);
  const [f, setF] = useState({
    team:
      prefill?.role === "Pastor"
        ? "Pastores"
        : prefill?.role === "Diácono"
          ? "Diáconos"
          : prefill?.role === "Ungido"
            ? "Ungidos"
            : "Participante",
    paid: false,
    exempt: false,
    note: "",
    needsTranslation: false,
    memberName: "",
    badgeName: "",
    category: "Adulto",
    church: "",
    role: "",
  });

  const avail = members.filter((m) => !existingRegs.find((r) => r.memberId === m.id));
  const results =
    src.length > 0
      ? avail.filter((m) => src.length === 0 ? true :norm(m.name).includes(norm(src))).slice(0, 20)
      : [];
  const pick = (m) => {
    setSel(m);
    setSrc(m.name);
    setF((p) => ({
      ...p,
      team:
        m.role === "Pastor"
          ? "Pastores"
          : m.role === "Diácono"
            ? "Diáconos"
            : m.role === "Ungido"
              ? "Ungidos"
              : "Participante",
      exempt: false,
      memberName: "",
      badgeName: "", // clear manual fields when switching to member mode
    }));
  };
  const isAutoPastor = sel?.role === "Pastor";
  const selFee = sel ? (isAutoPastor ? 0 : (event?.fees?.[sel.category] ?? 0)) : 0;
  const manFee = f.role === "Pastor" ? 0 : (event?.fees?.[f.category] ?? 0);

  const trySave = (data) => {
    const isExempt = data.role === "Pastor" || data.exempt || false;
    if (isFull && !isExempt) {
      setPendingData(data);
      setShowOverride(true);
    } else { onSave(data); onClose(); }
  };

  if (showOverride)
    return (
      <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal">
          <div style={{ fontSize: 32, textAlign: "center", marginBottom: 8 }}>⚡</div>
          <h3
            style={{
              fontFamily: "'Lora',Georgia,serif",
              fontSize: 20,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            {t.eventFull}
          </h3>
          <p style={{ color: "#6b7280", fontSize: 13, textAlign: "center", marginBottom: 18 }}>
            {t.eventFullDesc}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            <div
              style={{
                border: "1.5px solid var(--border)",
                borderRadius: 10,
                padding: "14px 16px",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>📋 {t.sendToWaitlist}</div>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>{t.waitlistNote}</p>
              <button
                className="btn btn-warn"
                style={{ width: "100%" }}
                onClick={() => {
                  onSave({ ...pendingData, waitlisted: true });
                  onClose();
                }}
              >
                {t.sendToWaitlist}
              </button>
            </div>
            <div
              style={{
                border: "1.5px solid #f59e0b",
                borderRadius: 10,
                padding: "14px 16px",
                background: "#fffbeb",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>⚡ {t.requestPastor}</div>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>{t.overrideNote}</p>
              <textarea
                rows={2}
                value={overrideNote}
                onChange={(e) => setOverrideNote(e.target.value)}
                placeholder={t.justification}
                style={{ marginBottom: 8 }}
              />
              <button
                className="btn btn-accent"
                style={{ width: "100%" }}
                onClick={() => {
                  onRequestOverride({
                    type: "capacity_override",
                    eventId: event.id,
                    ...pendingData,
                    note: overrideNote,
                  });
                  onClose();
                }}
              >
                {t.requestPastor}
              </button>
            </div>
          </div>
          <button
            className="btn btn-ghost"
            style={{ width: "100%" }}
            onClick={() => setShowOverride(false)}
          >
            {t.back}
          </button>
        </div>
      </div>
    );

  return (
    <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 20 }}>{t.addNew}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>
        {isFull && (
          <div
            style={{
              background: "#fff0e6",
              border: "1.5px solid #ff6b35",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 12,
              fontSize: 13,
              color: "#c4390a",
              fontWeight: 600,
            }}
          >
            ⚡ {t.eventFull}
          </div>
        )}
        <div className="pt" style={{ marginBottom: 14 }}>
          {[
            [
              { k: "member", l: t.memberMode },
              { k: "family", l: t.familyMode },
              { k: "manual", l: t.manualMode },
            ],
          ]
            .flat()
            .map(({ k, l }) => (
              <button
                key={k}
                className={`pt-btn ${mode === k ? "active" : ""}`}
                onClick={() => setMode(k)}
              >
                {l}
              </button>
            ))}
        </div>

        {mode === "member" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <div>
              <label>{t.searchMember}</label>
              <input
                value={src}
                onChange={(e) => {
                  setSrc(e.target.value);
                  setSel(null);
                }}
                placeholder={t.searchPlaceholder}
                autoFocus
              />
              {src.length === 0 && !sel && (
                <div style={{ marginTop: 6, fontSize: 12, color: "var(--muted)" }}>
                  {avail.length} membros disponíveis — digite para buscar
                </div>
              )}
              {results.length > 0 && !sel && (
                <div
                  style={{
                    border: "1.5px solid var(--border)",
                    borderRadius: 8,
                    marginTop: 4,
                    overflow: "hidden",
                    maxHeight: 220,
                    overflowY: "auto",
                  }}
                >
                  {results.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => pick(m)}
                      style={{
                        padding: "9px 14px",
                        cursor: "pointer",
                        borderTop: "1px solid var(--border)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      <span style={{ fontWeight: 600 }}>{m.name}</span>
                      <div style={{ display: "flex", gap: 5 }}>
                        <span className="badge badge-blue">{m.category}</span>
                        {m.role && <span className={`badge ${ROLE_BADGE[m.role]}`}>{m.role}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {sel && (
              <>
                <div
                  style={{
                    background: "#f8f9fb",
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontSize: 13,
                  }}
                >
                  <strong>{sel.name}</strong>
                  {sel.badgeName && sel.badgeName !== sel.name && (
                    <span style={{ color: "#6b7280" }}>
                      {" "}
                      ({t.badgeName}: {sel.badgeName})
                    </span>
                  )}
                  <span style={{ color: "#6b7280" }}>
                    {" "}
                    · {sel.category} · {sel.church}
                  </span>
                  {sel.role && (
                    <span className={`badge ${ROLE_BADGE[sel.role]}`} style={{ marginLeft: 8 }}>
                      {sel.role}
                    </span>
                  )}
                  {isAutoPastor && (
                    <span
                      style={{ marginLeft: 8, fontSize: 11, color: "#2d8a4e", fontWeight: 600 }}
                    >
                      ✓ {t.autoExempt}
                    </span>
                  )}
                </div>
                <div className="fr">
                  <div>
                    <label>{t.team}</label>
                    <select value={f.team} onChange={(e) => setF({ ...f, team: e.target.value })}>
                      {teamList.map((t2) => (
                        <option key={t2}>{t2}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ paddingTop: 20, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div className="cb">
                      <input
                        type="checkbox"
                        id="p1"
                        checked={f.paid}
                        onChange={(e) => setF({ ...f, paid: e.target.checked })}
                      />
                      <label htmlFor="p1">{t.paidNow}</label>
                    </div>
                    {!isAutoPastor && (
                      <div className="cb">
                        <input
                          type="checkbox"
                          id="e1"
                          checked={f.exempt}
                          onChange={(e) => setF({ ...f, exempt: e.target.checked })}
                        />
                        <label htmlFor="e1">
                          {t.exempt} ({t.exemptNote.split(".")[0]})
                        </label>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label>{t.notes}</label>
                  <input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
                </div>
                <FeeBox fee={selFee} paid={f.paid} isExempt={isAutoPastor} />
                {f.exempt && !isAutoPastor && (
                  <div
                    style={{
                      background: "#fffbeb",
                      border: "1px solid #f59e0b",
                      borderRadius: 8,
                      padding: "10px 14px",
                      fontSize: 12,
                      color: "#92400e",
                    }}
                  >
                    ⚠️ {t.exemptNote}
                  </div>
                )}
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    if (f.exempt && !isAutoPastor) {
                      onRequestOverride({
                        type: "exemption",
                        eventId: event.id,
                        memberId: sel.id,
                        memberName: sel.name,
                        category: sel.category,
                        church: sel.church,
                        role: sel.role,
                        team: f.team,
                        fee: event.fees[sel.category] ?? 0,
                        note: f.note,
                      });
                      onSave({
                        ...sel,
                        ...f,
                        memberId: sel.id,
                        memberName: sel.name,
                        badgeName: sel.badgeName || sel.name,
                        exempt: false,
                      });
                      onClose();
                    } else {
                      trySave({
                        ...sel,
                        ...f,
                        memberId: sel.id,
                        memberName: sel.name,
                        badgeName: sel.badgeName || sel.name,
                      });
                    }
                  }}
                >
                  {t.confirmReg}
                </button>
              </>
            )}
          </div>
        )}

        {mode === "family" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <div>
              <label>{t.familyLabel}</label>
              <select
                value={selFam?.id || ""}
                onChange={(e) => {
                  setSelFam(INIT_FAMILIES.find((x) => x.id === e.target.value) || null);
                  setFamIds([]);
                }}
              >
                <option value="">{t.selectFamily}</option>
                {INIT_FAMILIES.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </div>
            {selFam && (
              <>
                <div>
                  <label>{t.membersLabel}</label>
                  {selFam.memberIds.map((mid) => {
                    const m = INIT_MEMBERS.find((x) => x.id === mid);
                    const already = existingRegs.find((r) => r.memberId === mid);
                    if (!m) return null;
                    return (
                      <div
                        key={mid}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 0",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <input
                          type="checkbox"
                          style={{ width: "auto" }}
                          disabled={!!already}
                          checked={famIds.includes(mid)}
                          onChange={(e) =>
                            setFamIds((p) =>
                              e.target.checked ? [...p, mid] : p.filter((x) => x !== mid)
                            )
                          }
                        />
                        <span
                          style={{ flex: 1, fontSize: 14, color: already ? "#6b7280" : "#1a1e2e" }}
                        >
                          {m.name}
                        </span>
                        <span className="badge badge-blue">{m.category}</span>
                        {already ? (
                          <span className="badge badge-green">{t.confirmed}</span>
                        ) : (
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#d4820a" }}>
                            {fmt(event?.fees?.[m.category] ?? 0)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {famIds.length > 0 && (
                  <>
                    <div
                      style={{
                        background: "var(--sidebar-active-bg,#fdf5f5)",
                        borderRadius: 8,
                        padding: "10px 14px",
                        fontSize: 13,
                      }}
                    >
                      <strong>Total:</strong>{" "}
                      {fmt(
                        famIds.reduce((s, mid) => {
                          const m = INIT_MEMBERS.find((x) => x.id === mid);
                          return s + (event?.fees?.[m?.category] ?? 0);
                        }, 0)
                      )}{" "}
                      · {famIds.length} {t.persons}
                    </div>
                    <div className="fr">
                      <div>
                        <label>
                          {t.team} ({t.allTab})
                        </label>
                        <select
                          value={f.team}
                          onChange={(e) => setF({ ...f, team: e.target.value })}
                        >
                          {teamList.map((t2) => (
                            <option key={t2}>{t2}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ paddingTop: 20 }}>
                        <div className="cb">
                          <input
                            type="checkbox"
                            id="fp"
                            checked={f.paid}
                            onChange={(e) => setF({ ...f, paid: e.target.checked })}
                          />
                          <label htmlFor="fp">{t.paidNow}</label>
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        const sharedFamilyId = selFam.id || ("FAM-" + Date.now());
                        famIds.forEach((mid) => {
                          const m = INIT_MEMBERS.find((x) => x.id === mid);
                          if (m)
                            onSave({
                              ...m,
                              memberId: m.id,
                              memberName: m.name,
                              badgeName: m.badgeName || m.name,
                              category: m.category,
                              church: m.church || "",
                              role: m.role || "",
                              team: f.team,
                              paid: f.paid,
                              exempt: m.role === "Pastor",
                              note: f.note || "",
                              familyId: sharedFamilyId,
                            });
                        });
                        onClose();
                      }}
                    >
                      {t.confirmReg} ({famIds.length})
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {mode === "bulk" && (
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
              Selecione membros para registrar em lote. Clique para marcar/desmarcar.
            </div>
            <div
              style={{
                maxHeight: 260,
                overflowY: "auto",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: 6,
              }}
            >
              {avail
                .filter(function (m) {
                  return !src ||norm(m.name).includes(norm(src));
                })
                .map(function (m) {
                  var selected = bulkSel.some(function (x) {
                    return x.id === m.id;
                  });
                  return (
                    <div
                      key={m.id}
                      onClick={function () {
                        setBulkSel(function (p) {
                          return selected
                            ? p.filter(function (x) {
                                return x.id !== m.id;
                              })
                            : [...p, m];
                        });
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "7px 10px",
                        borderRadius: 6,
                        cursor: "pointer",
                        background: selected ? "#fdf5f5" : "transparent",
                        marginBottom: 2,
                        border: selected ? "1px solid #b41926" : "1px solid transparent",
                      }}
                    >
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 3,
                          border: "2px solid " + (selected ? "#b41926" : "#ccc"),
                          background: selected ? "#b41926" : "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {selected && (
                          <span style={{ color: "#fff", fontSize: 10, fontWeight: 900 }}>✓</span>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>
                          {m.category} · {m.church}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            {bulkSel.length > 0 && (
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 13, color: "var(--muted)" }}>
                  {bulkSel.length} selecionado(s)
                </span>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={function () {
                    bulkSel.forEach(function (m) {
                      onSave({
                        ...m,
                        memberId: m.id,
                        memberName: m.name,
                        badgeName: m.badgeName || m.name,
                        team:
                          m.role === "Pastor"
                            ? "Pastores"
                            : m.role === "Diácono"
                              ? "Diáconos"
                              : m.role === "Ungido"
                                ? "Ungidos"
                                : "Participante",
                        paid: false,
                        exempt: OBREIRO_ROLES.includes(m.role),
                        note: "",
                      });
                    });
                    onClose();
                  }}
                >
                  Registrar {bulkSel.length} membros
                </button>
              </div>
            )}
          </div>
        )}
        {mode === "manual" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <div className="fr">
              <div>
                <label>{t.fullName} *</label>
                <input
                  value={f.memberName}
                  onChange={(e) => setF({ ...f, memberName: e.target.value })}
                />
              </div>
              <div>
                <label>{t.badgeName}</label>
                <input
                  value={f.badgeName}
                  onChange={(e) => setF({ ...f, badgeName: e.target.value })}
                  placeholder={t.optional}
                />
              </div>
            </div>
            <div className="fr">
              <div>
                <label>{t.category} *</label>
                <select
                  value={f.category}
                  onChange={(e) => setF({ ...f, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>{t.role}</label>
                <select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
                  {[
                    <option key="" value="">
                      {t.noRole}
                    </option>,
                    ...ROLE_GROUPS.map((g) => (
                      <optgroup key={g.group} label={g.group}>
                        {g.roles.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </optgroup>
                    )),
                  ]}
                </select>
              </div>
            </div>
            <div>
              <label>{t.church}</label>
              <ChurchSearch
                churches={churches}
                value={f.church}
                onChange={(v) => setF({ ...f, church: v })}
                placeholder={t.selectChurch}
              />
            </div>
            <div>
              <label>{t.team}</label>
              <select value={f.team} onChange={(e) => setF({ ...f, team: e.target.value })}>
                {teamList.map((t2) => (
                  <option key={t2}>{t2}</option>
                ))}
              </select>
            </div>
            <div className="fr">
              <div className="cb" style={{ paddingTop: 4 }}>
                <input
                  type="checkbox"
                  id="mp"
                  checked={f.paid}
                  onChange={(e) => setF({ ...f, paid: e.target.checked })}
                />
                <label htmlFor="mp">{t.paidNow}</label>
              </div>
              <div className="cb" style={{ paddingTop: 4 }}>
                <input
                  type="checkbox"
                  id="me"
                  checked={f.exempt}
                  onChange={(e) => setF({ ...f, exempt: e.target.checked })}
                />
                <label htmlFor="me">{t.exempt}</label>
              </div>
            </div>
            <FeeBox fee={manFee} isExempt={f.role === "Pastor" || f.exempt} />
            <button
              className="btn btn-primary"
              disabled={!f.memberName}
              onClick={() => trySave({ memberId: "GUEST-" + Date.now(), ...f })}
            >
              {t.confirmReg}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── DETAIL MODAL ──────────────────────────────────────────────────────────────
export default RegModal;
