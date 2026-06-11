import { useState } from "react";
import { useT } from "@/i18n/strings";

import { ROLE_BADGE, fmt } from "@/constants";
import { sb } from "@/lib/supabase";
import StatusBadge from "@/components/StatusBadge";
import RegModal from "@/components/RegModal";
import DetailModal from "@/components/DetailModal";

const norm = (s) => (s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export default function RegistrationsTab(props) {
  const {
    regs,
    setRegs,
    members,
    families,
    dbTeams,
    addReg,
    updateReg,
    submitApproval,
    promoteFromWaitlist,
    event,
    user,
    isFull,
    notify,
  } = props;
  const [confirmDelete, setConfirmDelete] = useState(null);
  const t = useT();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showReg, setShowReg] = useState(false);
  const [detail, setDetail] = useState(null);
  const all = regs.filter((r) => r.eventId === event?.id);
  const active = all.filter((r) => !r.cancelled && !r.waitlisted);
  const filtered = all.filter((r) => {
    const ms =
      norm(r.memberName).includes(norm(search)) ||
      norm(r.regNumber).includes(norm(search));
    const mf =
      filter === "all" ||
      (filter === "paid" && r.paid) ||
      (filter === "pending" && !r.paid && !r.exempt && !r.cancelled && !r.waitlisted) ||
      (filter === "exempt" && r.exempt) ||
      (filter === "waitlist" && r.waitlisted) ||
      (filter === "excedente" && r.excedente) ||
      (filter === "cancelled" && r.cancelled);
    return ms && mf;
  });
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
        <button className="btn btn-primary" onClick={() => setShowReg(true)}>
          {t.addNew}
        </button>
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
                <th>{t.regNum}</th>
                <th>{t.memberName}</th>
                <th>{t.cargo}</th>
                <th>{t.cat}</th>
                <th>{t.churchH}</th>
                <th>{t.teamH}</th>
                <th>{t.feeH}</th>
                <th>{t.statusH}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} style={{ opacity: r.cancelled ? 0.5 : 1 }}>
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
                  <td style={{ fontSize: 12, color: "#6b7280" }}>{r.church}</td>
                  <td style={{ fontSize: 12 }}>{r.team}</td>
                  <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                    {r.exempt ? <span style={{ color: "#6b7280" }}>{t.exempt}</span> : fmt(r.fee)}
                  </td>
                  <td>
                    <StatusBadge r={r} event={event} allRegs={active} />
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
          families={families}
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
          canEditPayment={true}
          onClose={() => setDetail(null)}
          onUpdate={(u) => {
            updateReg(detail.id, u);
            setDetail(null);
          }}
        />
      )}
      {confirmDelete && (
        <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div className="modal" style={{ maxWidth: 360, textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, marginBottom: 8 }}>Excluir inscrição?</h3>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>
              Remover <strong>{confirmDelete.memberName}</strong> ({confirmDelete.regNumber})? Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={async () => {
                const id = confirmDelete.id;
                const { error } = await sb.from("registrations").delete().eq("id", id);
                if (error) { notify && notify("Erro ao excluir: " + error.message); }
                else {
                  setRegs && setRegs((p) => p.filter((r) => r.id !== id));
                  notify && notify("Inscrição excluída.");
                }
                setConfirmDelete(null);
              }}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
