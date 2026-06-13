import { useState } from "react";
import { useT } from "@/i18n/strings";

import { ROLE_BADGE, fmt } from "@/constants";
import { sb } from "@/lib/supabase";
import StatusBadge from "@/components/StatusBadge";
import RegModal from "@/components/RegModal";
import DetailModal from "@/components/DetailModal";

const norm = (s) => (s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function useSortable(data, defaultKey) {
  const [sk, setSk] = useState(defaultKey);
  const [sd, setSd] = useState("asc");
  const toggle = (k) => { if (sk === k) setSd((d) => d === "asc" ? "desc" : "asc"); else { setSk(k); setSd("asc"); } };
  const sorted = [...(data || [])].sort((a, b) => {
    const av = a[sk] ?? ""; const bv = b[sk] ?? "";
    const c = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" });
    return sd === "asc" ? c : -c;
  });
  const Th = ({ k, children, style }) => (
    <th onClick={() => toggle(k)} style={{ cursor: "pointer", userSelect: "none", ...style }}>
      {children}{sk === k ? (sd === "asc" ? " \u2191" : " \u2193") : ""}
    </th>
  );
  return { sorted, Th };
}

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
  const [confirmDelete, setConfirmDelete] = useState(null); // single reg
  const [bulkSel, setBulkSel] = useState([]);
  const toggleBulk = (id) => setBulkSel((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const t = useT();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showReg, setShowReg] = useState(false);
  const [detail, setDetail] = useState(null);
  const all = regs.filter((r) => r.eventId === event?.id);
  const active = all.filter((r) => !r.cancelled && !r.waitlisted);
  const preFiltered = all.filter((r) => {
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
            <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete({ bulk: true, ids: bulkSel })}>
              🗑 Excluir {bulkSel.length} selecionado(s)
            </button>
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
                <th>{t.cargo}</th>
                <Th k="category">{t.cat}</Th>
                <th>{t.churchH}</th>
                <Th k="team">{t.teamH}</Th>
                <Th k="fee">{t.feeH}</Th>
                <Th k="registeredAt">{t.statusH}</Th>
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
          regs={regs}
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
    </div>
  );
}
