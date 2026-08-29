import { useState, useMemo } from "react";
import { CATEGORIES } from "@/constants";
import { churchDisplay } from "@/constants";

const SHORT = { "0-3": "0-3", "Criança": "Criança", "Intermediário": "Inter.", "Adolescente": "Adoles.", "Jovem": "Jovem", "Adulto": "Adulto" };

function isConfirmed(r) { return r.paid || r.exempt || r.fee === 0; }

export default function KitchenTab({ regs, event }) {
  const [filter, setFilter] = useState("all");   // "all" | "confirmed" | "pending"
  const [byChurch, setByChurch] = useState(false);

  const active = useMemo(
    () => (regs || []).filter((r) => r.eventId === event?.id && !r.cancelled && !r.waitlisted),
    [regs, event?.id]
  );

  const filtered = useMemo(() => {
    if (filter === "confirmed") return active.filter(isConfirmed);
    if (filter === "pending")   return active.filter((r) => !isConfirmed(r));
    return active;
  }, [active, filter]);

  const total = active.length;
  const confirmed = active.filter(isConfirmed).length;
  const pending = total - confirmed;

  // Category breakdown over filtered set
  const byCategory = CATEGORIES.map((cat) => {
    const rows = filtered.filter((r) => r.category === cat);
    return { cat, count: rows.length };
  });

  // Church × category matrix (always uses "all active" for context)
  const churches = useMemo(() => {
    const seen = new Map();
    active.forEach((r) => {
      const key = churchDisplay(r.church) || r.church || "—";
      seen.set(key, (seen.get(key) || 0) + 1);
    });
    return [...seen.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  }, [active]);

  const churchCatCount = (church, cat) =>
    filtered.filter((r) => {
      const cd = churchDisplay(r.church) || r.church || "—";
      return cd === church && r.category === cat;
    }).length;

  const churchTotal = (church) =>
    filtered.filter((r) => (churchDisplay(r.church) || r.church || "—") === church).length;

  if (!event) {
    return <p style={{ color: "var(--muted)", padding: 20 }}>Nenhum evento selecionado.</p>;
  }

  const pct = total > 0 ? Math.round((confirmed / total) * 100) : 0;

  return (
    <div>
      <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        Cozinha
      </h2>
      <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 18 }}>
        Totais por categoria para planejamento de refeições e mesas.
      </p>

      {/* Summary strip */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        {[
          { label: "Total Ativos", value: total, color: "var(--primary)" },
          { label: "Confirmados", value: confirmed, color: "#16a34a" },
          { label: "Pendentes", value: pending, color: "#d97706" },
          { label: "% Confirmado", value: `${pct}%`, color: pct >= 80 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ padding: "12px 20px", minWidth: 110, textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>Exibir:</span>
        {[
          { id: "all", label: "Todos Ativos" },
          { id: "confirmed", label: "Confirmados" },
          { id: "pending", label: "Pendentes" },
        ].map(({ id, label }) => (
          <button key={id} className={`btn btn-sm ${filter === id ? "btn-primary" : "btn-ghost"}`} onClick={() => setFilter(id)}>
            {label}
          </button>
        ))}
        <div style={{ marginLeft: "auto" }}>
          <button className={`btn btn-sm ${byChurch ? "btn-primary" : "btn-ghost"}`} onClick={() => setByChurch((v) => !v)}>
            Por Igreja
          </button>
        </div>
      </div>

      {/* Category table */}
      <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: byChurch ? 20 : 0 }}>
        <table className="table">
          <thead style={{ position: "sticky", top: 0, zIndex: 2, background: "var(--card-bg, #fff)" }}>
            <tr>
              <th>Categoria</th>
              <th style={{ textAlign: "right", width: 100 }}>Qtd</th>
              <th style={{ width: "100%" }}>
                {/* visual bar column — no header text needed */}
              </th>
            </tr>
          </thead>
          <tbody>
            {byCategory.map(({ cat, count }) => (
              <tr key={cat}>
                <td style={{ fontWeight: 500 }}>{cat}</td>
                <td style={{ textAlign: "right", fontWeight: 700, fontSize: 15 }}>{count}</td>
                <td style={{ padding: "8px 12px" }}>
                  {filtered.length > 0 && (
                    <div style={{ background: "var(--bg2)", borderRadius: 4, height: 8, overflow: "hidden" }}>
                      <div style={{
                        width: `${Math.round((count / filtered.length) * 100)}%`,
                        height: "100%",
                        background: "var(--primary)",
                        borderRadius: 4,
                        transition: "width .3s",
                      }} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
            <tr style={{ background: "var(--bg2)", fontWeight: 700 }}>
              <td>Total</td>
              <td style={{ textAlign: "right", fontSize: 16 }}>{filtered.length}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Church × category matrix */}
      {byChurch && churches.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "auto" }}>
          <table className="table" style={{ minWidth: 500, whiteSpace: "nowrap" }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 2, background: "var(--card-bg, #fff)" }}>
              <tr>
                <th>Igreja</th>
                {CATEGORIES.map((c) => <th key={c} style={{ textAlign: "right", width: 70 }}>{SHORT[c] || c}</th>)}
                <th style={{ textAlign: "right", width: 70, fontWeight: 700 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {churches.map((ch) => (
                <tr key={ch}>
                  <td style={{ fontWeight: 500, fontSize: 13 }}>{ch}</td>
                  {CATEGORIES.map((c) => {
                    const n = churchCatCount(ch, c);
                    return <td key={c} style={{ textAlign: "right", color: n === 0 ? "var(--muted)" : undefined }}>{n || "—"}</td>;
                  })}
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{churchTotal(ch)}</td>
                </tr>
              ))}
              <tr style={{ background: "var(--bg2)", fontWeight: 700 }}>
                <td>Total</td>
                {CATEGORIES.map((c) => (
                  <td key={c} style={{ textAlign: "right" }}>{filtered.filter((r) => r.category === c).length || "—"}</td>
                ))}
                <td style={{ textAlign: "right" }}>{filtered.length}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
