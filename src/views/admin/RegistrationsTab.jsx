import { useState } from "react";
import { useT } from "@/i18n/strings";

import { ROLE_BADGE, fmt, deadlineStatus, addDays } from "@/constants";
import { sb } from "@/lib/supabase";
import StatusBadge from "@/components/StatusBadge";
import RegModal from "@/components/RegModal";
import DetailModal from "@/components/DetailModal";
import BadgePrint from "@/components/BadgePrint";
import Modal from "@/components/Modal";
import { resendConfirmation } from "@/lib/resendConfirmation";
import { useSortable } from "@/hooks/useSortable";

const norm = (s) => (s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const statusSortOf = (r) => r.cancelled ? "cancelado" : r.waitlisted ? "lista de espera" : r.excedente ? "excedente" : r.exempt ? "isento" : r.paid ? "pago" : "pendente";

export default function RegistrationsTab(props) {
  const {
    regs,
    setRegs,
    members,
    setMembers,
    families,
    gas,
    dbTeams,
    addReg,
    updateReg,
    reactivateReg,
    submitApproval,
    promoteFromWaitlist,
    event,
    user,
    isFull,
    notify,
    lang,
  } = props;
  const liveChurchOf = (r) => (members || []).find((m) => m.id === r.memberId)?.church || r.church || "—";
  const [confirmDelete, setConfirmDelete] = useState(null); // single reg
  const [confirmBulkCancel, setConfirmBulkCancel] = useState(false);
  const [bulkSel, setBulkSel] = useState([]);
  const [badgeReg, setBadgeReg] = useState(null);
  const [resendingId, setResendingId] = useState(null);

  const handleResend = async (reg) => {
    setResendingId(reg.id);
    const result = await resendConfirmation(reg.id);
    setResendingId(null);
    if (result.ok) notify(t.resendSuccess);
    else if (result.reason === "no_email") notify(t.resendNoEmail);
    else notify(t.resendError);
  };
  const toggleBulk = (id) => setBulkSel((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const t = useT();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showReg, setShowReg] = useState(false);
  const [detail, setDetail] = useState(null);
  const all = regs.filter((r) => r.eventId === event?.id);
  const active = all.filter((r) => !r.cancelled && !r.waitlisted);
  const isOverdue = (r) => !r.cancelled && !r.waitlisted && deadlineStatus(r, event, all)?.overdue;
  const preFiltered = all.filter((r) => {
    const q = norm(search);
    const ms =
      norm(r.memberName).includes(q) ||
      norm(r.regNumber).includes(q) ||
      norm(r.role).includes(q) ||
      norm(r.category).includes(q) ||
      norm(liveChurchOf(r)).includes(q) ||
      norm(r.team).includes(q) ||
      norm(statusSortOf(r)).includes(q);
    const mf =
      filter === "all" ||
      (filter === "paid" && r.paid) ||
      (filter === "pending" && !r.paid && !r.exempt && !r.cancelled && !r.waitlisted) ||
      (filter === "exempt" && r.exempt) ||
      (filter === "waitlist" && r.waitlisted) ||
      (filter === "excedente" && r.excedente) ||
      (filter === "cancelled" && r.cancelled) ||
      (filter === "overdue" && isOverdue(r));
    return ms && mf;
  }).map((r) => ({ ...r, statusSort: statusSortOf(r) }));
  const { sorted: filtered, Th } = useSortable(preFiltered, "memberName");
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 22 }}>{t.registrations}</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {bulkSel.length > 0 && (
            <>
              <button className="btn btn-warn btn-sm" onClick={() => setConfirmBulkCancel(true)}>
                🚫 Cancelar {bulkSel.length} selecionado(s)
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete({ bulk: true, ids: bulkSel })}>
                🗑 Excluir {bulkSel.length} selecionado(s)
              </button>
            </>
          )}
          <button className="btn btn-primary" onClick={() => setShowReg(true)}>{t.addNew}</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <div className="sb" style={{ flex: 1, minWidth: 160 }}>
          <span className="si-icon">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`${t.searchMember}...`}
          />
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {[
            [t.allTab, "all"],
            [t.paidTab, "paid"],
            [t.pendingTab, "pending"],
            [t.exemptTab, "exempt"],
            [t.waitlistTab, "waitlist"],
            [t.excenteTab, "excedente"],
            [t.overdueTab, "overdue"],
            [t.cancelledTab, "cancelled"],
          ].map(([l, k]) => (
            <button
              key={k}
              className={`tab ${filter === k ? "active" : ""}`}
              onClick={() => setFilter(k)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox"
                    checked={filtered.length > 0 && filtered.every((r) => bulkSel.includes(r.id))}
                    onChange={(e) => setBulkSel(e.target.checked ? filtered.map((r) => r.id) : [])} />
                </th>
                <th>{t.regNum}</th>
                <Th k="memberName">{t.memberName}</Th>
                <Th k="role">{t.cargo}</Th>
                <Th k="category">{t.cat}</Th>
                <Th k="church">{t.churchH}</Th>
                <Th k="team">{t.teamH}</Th>
                <Th k="fee">{t.feeH}</Th>
                <Th k="registeredAtTs">{t.regDate}</Th>
                <Th k="statusSort">{t.statusH}</Th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} style={{ opacity: r.cancelled ? 0.5 : 1, background: bulkSel.includes(r.id) ? "var(--sidebar-active-bg)" : "" }}>
                  <td><input type="checkbox" checked={bulkSel.includes(r.id)} onChange={() => toggleBulk(r.id)} /></td>
                  <td
                    style={{
                      fontFamily: "monospace",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#1a3a6b",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.regNumber}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.memberName}</div>
                    {r.badgeName && r.badgeName !== r.memberName && (
                      <div style={{ fontSize: 11, color: "#6b7280" }}>🏷 {r.badgeName}</div>
                    )}
                  </td>
                  <td>
                    {r.role ? (
                      <span className={`badge ${ROLE_BADGE[r.role]}`}>{r.role}</span>
                    ) : (
                      <span style={{ color: "#9ca3af", fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-blue">{r.category}</span>
                  </td>
                  <td style={{ fontSize: 12, color: "#6b7280" }}>{liveChurchOf(r)}</td>
                  <td style={{ fontSize: 12 }}>{r.team}</td>
                  <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                    {r.exempt ? <span style={{ color: "#6b7280" }}>{t.exempt}</span> : fmt(r.fee)}
                  </td>
                  <td style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>
                    {r.registeredAtTs
                      ? new Date(r.registeredAtTs).toLocaleString("pt-BR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
                      : r.registeredAt || "—"}
                  </td>
                  <td>
                    <StatusBadge r={r} event={event} allRegs={all} />
                  </td>
                  <td>
                    {r.waitlisted && (
                      <button
                        className="btn btn-ok btn-sm"
                        style={{ marginRight: 4 }}
                        onClick={() => promoteFromWaitlist(r.id)}
                      >
                        {t.confirm}
                      </button>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => setDetail(r)}>
                      {t.edit}
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ marginLeft: 4 }} onClick={() => setBadgeReg(r)}>
                      🖨️
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ marginLeft: 4 }}
                      disabled={resendingId === r.id}
                      onClick={() => handleResend(r)}
                      title={t.resendConfirmation}
                    >
                      {resendingId === r.id ? "…" : "📧"}
                    </button>
                    <button className="btn btn-danger btn-sm" style={{ marginLeft: 4 }} onClick={() => setConfirmDelete(r)}>
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showReg && (
        <RegModal
          event={event}
          members={members}
          setMembers={setMembers}
          families={families}
          gas={gas}
          dbTeams={dbTeams}
          isFull={isFull}
          existingRegs={active}
          prefill={null}
          onClose={() => setShowReg(false)}
          onSave={(d) => {
            addReg(d);
            setShowReg(false);
          }}
          onRequestOverride={(d) =>
            submitApproval({ ...d, requestedBy: user?.name, requestedById: user?.id })
          }
        />
      )}
      {detail && (
        <DetailModal
          reg={detail}
          event={event}
          dbTeams={dbTeams}
          regs={regs}
          members={members}
          gas={gas}
          canEditPayment={true}
          canDirectGrant={true}
          allEventRegs={all}
          onReactivate={(customDate) => reactivateReg(detail.id, { customDate })}
          onExtend={(customDate) => {
            const extensionDays = event?.paymentExtensionDays ?? event?.payment_extension_days ?? 5;
            const newDeadline = customDate || addDays(new Date().toISOString().slice(0, 10), extensionDays);
            updateReg(detail.id, { deadlineExtendedTo: newDeadline }, { status: "Prazo Estendido", note: "Prazo estendido até " + newDeadline });
          }}
          onClose={() => setDetail(null)}
          onUpdate={(u) => {
            // A plain checkbox-uncheck on "Cancelado" would otherwise bypass the
            // capacity check, duplicate-active-reg guard, and fresh-deadline
            // assignment reactivateReg does — route that specific transition there.
            if (detail.cancelled && u.cancelled === false) {
              const rest = { ...u };
              delete rest.cancelled;
              reactivateReg(detail.id, {});
              if (Object.keys(rest).length) updateReg(detail.id, rest);
            } else {
              updateReg(detail.id, u);
            }
            setDetail(null);
          }}
        />
      )}
      {badgeReg && (
        <Modal onClose={() => setBadgeReg(null)}>
          <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, marginBottom: 4 }}>
            Crachá — {badgeReg.memberName}
          </h3>
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>{badgeReg.regNumber}</p>
          <BadgePrint regs={[badgeReg]} event={event} lang={lang} />
          <button className="btn btn-ghost" style={{ width: "100%", marginTop: 8 }} onClick={() => setBadgeReg(null)}>
            {t.close}
          </button>
        </Modal>
      )}
      {confirmDelete && (
        <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div className="modal" style={{ maxWidth: 380, textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, marginBottom: 8 }}>Excluir inscrição?</h3>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>
              {confirmDelete.bulk
                ? <>Excluir <strong>{confirmDelete.ids.length}</strong> inscrições? Esta ação não pode ser desfeita.</>
                : <>Remover <strong>{confirmDelete.memberName}</strong> ({confirmDelete.regNumber})? Esta ação não pode ser desfeita.</>}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={async () => {
                const ids = confirmDelete.bulk ? confirmDelete.ids : [confirmDelete.id];
                // Separate real UUIDs from optimistic tmp-ids
                const realIds = ids.filter((id) => id && !String(id).startsWith("tmp-"));
                const tmpIds  = ids.filter((id) => id && String(id).startsWith("tmp-"));
                let hadError = false;
                if (realIds.length > 0) {
                  const { error } = await sb.from("registrations").delete().in("id", realIds);
                  if (error) { notify && notify("Erro ao excluir: " + error.message); hadError = true; }
                }
                if (!hadError || tmpIds.length > 0) {
                  setRegs && setRegs((p) => p.filter((r) => !ids.includes(r.id)));
                  notify && notify(`${ids.length} inscrição(ões) excluída(s).`);
                }
                setBulkSel([]);
                setConfirmDelete(null);
              }}>Excluir</button>
            </div>
          </div>
        </div>
      )}
      {confirmBulkCancel && (
        <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && setConfirmBulkCancel(false)}>
          <div className="modal" style={{ maxWidth: 380, textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🚫</div>
            <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, marginBottom: 8 }}>Cancelar inscrições em atraso?</h3>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>
              Cancelar <strong>{bulkSel.length}</strong> inscrições com pagamento em atraso? Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmBulkCancel(false)}>Manter</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => {
                bulkSel.forEach((id) => {
                  updateReg(id, { cancelled: true, cancelReason: "nonpayment_manual" }, { status: "Cancelado", note: "Cancelado em lote — pagamento em atraso" }, { silent: true });
                });
                notify && notify(`${bulkSel.length} inscrição(ões) cancelada(s) por atraso no pagamento.`);
                setBulkSel([]);
                setConfirmBulkCancel(false);
              }}>Sim, cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
