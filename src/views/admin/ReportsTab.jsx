import { useState } from "react";
import { useT } from "@/i18n/strings";
import { CATEGORIES, ROLE_BADGE, fmt } from "@/constants";

export default function ReportsTab({ regs, event, wlRegs, exRegs }) {
  const t = useT();
  const [type, setType] = useState("summary");
  const er = regs.filter((r) => r.eventId === event?.id && !r.cancelled && !r.waitlisted);
  const wl = wlRegs;
  const pend = er.filter((r) => !r.paid && !r.exempt);
  const byCh = [...new Set(er.map((r) => r.church))]
    .map((ch) => ({
      ch,
      total: er.filter((r) => r.church === ch).length,
      paid: er.filter((r) => r.church === ch && r.paid).length,
      pendN: er.filter((r) => r.church === ch && !r.paid && !r.exempt).length,
      exempt: er.filter((r) => r.church === ch && r.exempt).length,
      coll: er.filter((r) => r.church === ch && r.paid).reduce((s, r) => s + r.fee, 0),
      pendA: er
        .filter((r) => r.church === ch && !r.paid && !r.exempt)
        .reduce((s, r) => s + r.fee, 0),
    }))
    .sort((a, b) => b.total - a.total);

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
        <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 22 }}>{t.reports}</h2>
        <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>
          {t.print}
        </button>
      </div>
      <div style={{ display: "flex", gap: 5, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          [t.summaryTab, "summary"],
          [t.pendPayTab, "pending"],
          [t.waitlistTab, "waitlist"],
          [t.rosterTab, "roster"],
          [t.badgesTab, "badges"],
        ].map(([l, k]) => (
          <button
            key={k}
            className={`tab ${type === k ? "active" : ""}`}
            onClick={() => setType(k)}
          >
            {l}
          </button>
        ))}
      </div>

      {type === "summary" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t.churchH}</th>
                  <th>{t.total}</th>
                  <th>{t.paid}</th>
                  <th>{t.pending}</th>
                  <th>{t.exempt}</th>
                  <th>{t.collected}</th>
                  <th>{t.toReceive}</th>
                </tr>
              </thead>
              <tbody>
                {byCh.map((c) => (
                  <tr key={c.ch}>
                    <td style={{ fontWeight: 600 }}>{c.ch}</td>
                    <td>{c.total}</td>
                    <td style={{ color: "#2d8a4e", fontWeight: 600 }}>{c.paid}</td>
                    <td style={{ color: "#d4820a", fontWeight: 600 }}>{c.pendN}</td>
                    <td style={{ color: "#6b7280" }}>{c.exempt}</td>
                    <td style={{ color: "#2d8a4e", fontWeight: 600 }}>{fmt(c.coll)}</td>
                    <td style={{ color: "#d4820a", fontWeight: 600 }}>{fmt(c.pendA)}</td>
                  </tr>
                ))}
                <tr style={{ background: "#f8f9fb", fontWeight: 700 }}>
                  <td>{t.total}</td>
                  <td>{er.length}</td>
                  <td>{er.filter((r) => r.paid).length}</td>
                  <td>{pend.length}</td>
                  <td>{er.filter((r) => r.exempt).length}</td>
                  <td>{fmt(er.filter((r) => r.paid).reduce((s, r) => s + r.fee, 0))}</td>
                  <td>{fmt(pend.reduce((s, r) => s + r.fee, 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {type === "pending" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "11px 18px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontWeight: 700 }}>{t.pendPayTab}</span>
            <span className="badge badge-yellow">
              {pend.length} · {fmt(pend.reduce((s, r) => s + r.fee, 0))}
            </span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t.memberName}</th>
                  <th>{t.cat}</th>
                  <th>{t.churchH}</th>
                  <th>{t.feeH}</th>
                  <th>{t.date}</th>
                </tr>
              </thead>
              <tbody>
                {pend.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.memberName}</td>
                    <td>
                      <span className="badge badge-blue">{r.category}</span>
                    </td>
                    <td style={{ fontSize: 12, color: "#6b7280" }}>{r.church}</td>
                    <td style={{ color: "#d4820a", fontWeight: 600 }}>{fmt(r.fee)}</td>
                    <td style={{ fontSize: 12, color: "#6b7280" }}>{r.registeredAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {type === "waitlist" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "11px 18px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontWeight: 700 }}>{t.waitlistTab}</span>
            <span className="wl">{wl.length}</span>
          </div>
          {wl.length === 0 ? (
            <p style={{ padding: 24, color: "#6b7280", textAlign: "center" }}>{t.emptyWaitlist}</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t.position}</th>
                    <th>{t.memberName}</th>
                    <th>{t.cat}</th>
                    <th>{t.churchH}</th>
                    <th>{t.feeH}</th>
                    <th>{t.date}</th>
                  </tr>
                </thead>
                <tbody>
                  {wl.map((r, i) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 700, color: "#92400e" }}>#{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{r.memberName}</td>
                      <td>
                        <span className="badge badge-blue">{r.category}</span>
                      </td>
                      <td style={{ fontSize: 12, color: "#6b7280" }}>{r.church}</td>
                      <td style={{ fontWeight: 600 }}>{fmt(r.fee)}</td>
                      <td style={{ fontSize: 12, color: "#6b7280" }}>{r.registeredAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {type === "roster" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t.regNum}</th>
                  <th>{t.memberName}</th>
                  <th>{t.badgeH}</th>
                  <th>{t.cat}</th>
                  <th>M/F</th>
                  <th>{t.churchH}</th>
                  <th>{t.teamH}</th>
                  <th>{t.statusH}</th>
                  <th>🏷</th>
                  <th>{t.presH}</th>
                </tr>
              </thead>
              <tbody>
                {er.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontFamily: "monospace", fontSize: 11 }}>{r.regNumber}</td>
                    <td style={{ fontWeight: 600 }}>
                      {r.memberName}
                      {r.excedente && (
                        <span className="exc" style={{ marginLeft: 6 }}>
                          ⚡
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: "#6b7280" }}>
                      {r.badgeName || r.memberName}
                    </td>
                    <td>
                      <span className="badge badge-blue">{r.category}</span>
                    </td>
                    <td style={{ fontSize: 12, textAlign: "center" }}>{r.gender || "—"}</td>
                    <td style={{ fontSize: 12, color: "#6b7280" }}>{r.church}</td>
                    <td style={{ fontSize: 12 }}>{r.team}</td>
                    <td>{r.exempt ? t.exempt : r.paid ? `✓ ${t.paid}` : "⏳"}</td>
                    <td style={{ fontSize: 14, textAlign: "center" }}>
                      {r.badgePrinted ? "✓" : "○"}
                    </td>
                    <td style={{ fontSize: 18 }}>☐</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {type === "badges" && (
        <div>
          <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 12 }}>{t.badgePreview}</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
              gap: 10,
            }}
          >
            {er.slice(0, 15).map((r) => (
              <div
                key={r.id}
                style={{
                  border: `2px solid ${r.excedente ? "#ff6b35" : "#1a3a6b"}`,
                  borderRadius: 10,
                  padding: "12px 14px",
                  textAlign: "center",
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    fontSize: 8,
                    color: "#6b7280",
                    marginBottom: 3,
                    letterSpacing: ".05em",
                    fontWeight: 700,
                  }}
                >
                  IGREJA CRISTÃ MARANATA
                </div>
                {r.excedente && (
                  <div style={{ fontSize: 9, color: "#c4390a", fontWeight: 700, marginBottom: 2 }}>
                    ⚡ EXCEDENTE
                  </div>
                )}
                <div
                  style={{
                    fontFamily: "'Lora',Georgia,serif",
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#8B0000",
                    marginBottom: 2,
                  }}
                >
                  {r.badgeName || r.memberName}
                </div>
                {r.badgeName && r.badgeName !== r.memberName && (
                  <div style={{ fontSize: 9, color: "#9ca3af", marginBottom: 4 }}>
                    {r.memberName}
                  </div>
                )}
                <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 5 }}>{r.church}</div>
                <div
                  style={{ display: "flex", justifyContent: "center", gap: 3, flexWrap: "wrap" }}
                >
                  <span className="badge badge-blue" style={{ fontSize: 9 }}>
                    {r.category}
                  </span>
                  {r.role && (
                    <span className={`badge ${ROLE_BADGE[r.role]}`} style={{ fontSize: 9 }}>
                      {r.role}
                    </span>
                  )}
                  <span className="badge badge-gray" style={{ fontSize: 9 }}>
                    {r.team}
                  </span>
                </div>
                <div
                  style={{ fontFamily: "monospace", fontSize: 8, color: "#9ca3af", marginTop: 5 }}
                >
                  {r.regNumber}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
