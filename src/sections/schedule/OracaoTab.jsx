import { useState, useEffect } from "react";
import { X, CheckCircle } from "lucide-react";
import { sb } from "@/lib/supabase";
import { useAppDataContext } from "@/context/AppDataContext";

const SLOT_COUNT = 96; // 24h × 4 slots/hour
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function slotTime(i) {
  const h = Math.floor(i / 4);
  const m = (i % 4) * 15;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function OracaoTab({ lang }) {
  const pt = lang !== "en";
  const { members = [] } = useAppDataContext() || {};

  const today = new Date().toISOString().slice(0, 10);
  const [prayerDate, setPrayerDate] = useState(today);
  const [slots, setSlots] = useState([]); // array of DB rows
  const [loading, setLoading] = useState(true);
  const [activeSlot, setActiveSlot] = useState(null); // slot index being assigned
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [manualName, setManualName] = useState("");

  useEffect(() => {
    loadSlots();
  }, [prayerDate]);

  const loadSlots = async () => {
    setLoading(true);
    const { data } = await sb.from("schedule_oracao").select("*").eq("prayer_date", prayerDate);
    setSlots(data || []);
    setLoading(false);
  };

  const slotRow = (i) => slots.find((s) => s.slot_index === i);

  const memberResults = query.length > 1
    ? members.filter((m) => norm(m.name).includes(norm(query))).slice(0, 5)
    : [];

  const assignSlot = async (memberId, memberName) => {
    if (activeSlot === null || !memberName) return;
    setSaving(true);
    const existing = slotRow(activeSlot);
    if (existing) {
      await sb.from("schedule_oracao").delete().eq("id", existing.id);
    }
    const row = {
      prayer_date: prayerDate,
      slot_index: activeSlot,
      slot_time: slotTime(activeSlot),
      member_id: memberId || null,
      member_name: memberName,
    };
    const { data, error } = await sb.from("schedule_oracao").insert(row).select().single();
    if (!error && data) {
      setSlots((prev) => [...prev.filter((s) => s.slot_index !== activeSlot), data]);
    }
    setSaving(false);
    setActiveSlot(null);
    setQuery("");
    setManualName("");
  };

  const clearSlot = async (i) => {
    const row = slotRow(i);
    if (!row) return;
    setSlots((prev) => prev.filter((s) => s.slot_index !== i));
    await sb.from("schedule_oracao").delete().eq("id", row.id);
  };

  const filled = slots.length;
  const pct = Math.round((filled / SLOT_COUNT) * 100);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>
          {pt ? "Agenda de Oração 24h" : "24h Prayer Agenda"}
        </h3>
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 16 }}>
          {pt
            ? "Corrente de oração ininterrupta — 96 slots de 15 minutos."
            : "Uninterrupted prayer chain — 96 fifteen-minute slots."}
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 3 }}>
              {pt ? "Data da corrente" : "Prayer chain date"}
            </label>
            <input
              type="date"
              value={prayerDate}
              onChange={(e) => setPrayerDate(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid var(--border)", fontSize: 14, background: "var(--card)", color: "var(--text)" }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
              <span>{pt ? `${filled} de ${SLOT_COUNT} slots preenchidos` : `${filled} of ${SLOT_COUNT} slots filled`}</span>
              <span style={{ fontWeight: 700, color: pct === 100 ? "#2d8a4e" : "var(--muted)" }}>{pct}%</span>
            </div>
            <div style={{ height: 8, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "#2d8a4e" : "#8B0000", borderRadius: 99, transition: "width .3s" }} />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)", fontSize: 14 }}>{pt ? "Carregando…" : "Loading…"}</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 6 }}>
          {Array.from({ length: SLOT_COUNT }, (_, i) => {
            const row = slotRow(i);
            const isFilled = !!row;
            const isActive = activeSlot === i;
            return (
              <div
                key={i}
                onClick={() => { setActiveSlot(isActive ? null : i); setQuery(""); setManualName(""); }}
                style={{
                  border: `2px solid ${isActive ? "#8B0000" : isFilled ? "#2d8a4e" : "var(--border)"}`,
                  borderRadius: 10,
                  padding: "10px 12px",
                  cursor: "pointer",
                  background: isActive ? "#8B000008" : isFilled ? "#2d8a4e08" : "var(--card)",
                  transition: "border-color .15s, background .15s",
                  position: "relative",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? "#8B0000" : isFilled ? "#2d8a4e" : "var(--muted)", marginBottom: 2 }}>
                  {slotTime(i)}
                </div>
                {isFilled ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <CheckCircle size={12} color="#2d8a4e" />
                    <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {row.member_name.split(" ")[0]}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); clearSlot(i); }}
                      style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: 0, lineHeight: 1 }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>
                    {pt ? "Disponível" : "Available"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeSlot !== null && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
          onClick={(e) => e.target === e.currentTarget && setActiveSlot(null)}
        >
          <div style={{ background: "var(--card)", borderRadius: 16, padding: 28, width: "100%", maxWidth: 380, boxShadow: "var(--shadow-md)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, fontWeight: 700 }}>
                {slotTime(activeSlot)} — {slotTime(activeSlot + 1 < SLOT_COUNT ? activeSlot + 1 : activeSlot)}
              </h3>
              <button onClick={() => setActiveSlot(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} color="var(--muted)" />
              </button>
            </div>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 16 }}>
              {pt ? "Busque um membro ou digite o nome." : "Search a member or type a name."}
            </p>

            <div style={{ position: "relative", marginBottom: 12 }}>
              <input
                autoFocus
                value={query}
                onChange={(e) => { setQuery(e.target.value); setManualName(e.target.value); }}
                placeholder={pt ? "Nome do membro…" : "Member name…"}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid var(--border)", fontSize: 14, boxSizing: "border-box", background: "var(--card)", color: "var(--text)" }}
              />
              {memberResults.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--card)", border: "1.5px solid var(--border)", borderRadius: 8, zIndex: 10, boxShadow: "var(--shadow-md)" }}>
                  {memberResults.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => assignSlot(m.id, m.name)}
                      style={{ padding: "10px 12px", cursor: "pointer", fontSize: 14, borderBottom: "1px solid var(--border)" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg2)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = ""}
                    >
                      <div style={{ fontWeight: 600 }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>{m.church}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setActiveSlot(null)} style={{ flex: 1 }}>
                {pt ? "Cancelar" : "Cancel"}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => assignSlot(null, manualName || query)}
                disabled={saving || !(manualName || query)}
                style={{ flex: 1 }}
              >
                {saving ? (pt ? "Salvando…" : "Saving…") : (pt ? "Confirmar" : "Confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
