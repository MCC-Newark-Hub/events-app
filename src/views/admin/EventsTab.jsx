import { useState } from "react";
import { useT } from "@/i18n/strings";
import { CATEGORIES } from "@/constants";
import { sb } from "@/lib/supabase";

export default function EventsTab({ events, setEvents, event, setEvent, lang, notify }) {
  const t = useT();
  const [showNew, setShowNew] = useState(false);
  const [editEvt, setEditEvt] = useState(null);
  const isEditing = !!editEvt;
  const [nEvt, setNEvt] = useState({
    name: "",
    prefix: "",
    date: "",
    time: "09:00",
    location: "",
    capacity: 200,
    paymentDeadlineDays: 7,
    fees: { "0-3": 0, Criança: 0, Intermediário: 0, Adolescente: 25, Jovem: 25, Adulto: 25 },
  });

  const cur = isEditing ? editEvt : nEvt;
  const setCur = isEditing ? setEditEvt : setNEvt;

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
        <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 22 }}>{t.events}</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditEvt(null);
            setNEvt({
              name: "",
              prefix: "",
              date: "",
              time: "09:00",
              location: "",
              capacity: 200,
              paymentDeadlineDays: 7,
              fees: {
                "0-3": 0,
                Criança: 0,
                Intermediário: 0,
                Adolescente: 25,
                Jovem: 25,
                Adulto: 25,
              },
            });
            setShowNew(true);
          }}
        >
          {t.newEvent}
        </button>
      </div>

      {events.map((e) => (
        <div
          className="card"
          key={e.id}
          style={{
            marginBottom: 10,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderLeft: `4px solid ${event?.id === e.id ? "#1a3a6b" : "transparent"}`,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{e.name}</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
              📅 {e.date} · 📍 {e.location} · {t.prefix}: {e.prefix} · {t.capacity}:{" "}
              {e.capacity ?? "-"}
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
              {CATEGORIES.map((c) => (
                <span key={c} className="badge badge-gray" style={{ fontSize: 10 }}>
                  {c}: {e.fees?.[c] === 0 ? t.free : `$${e.fees?.[c]}`}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setEvent(e)}>
              {event?.id === e.id ? "✓ Ativo" : t.select}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setEditEvt({ ...e });
                setShowNew(true);
              }}
            >
              ✏️
            </button>
          </div>
        </div>
      ))}

      {showNew && (
        <div
          className="modal-bg"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowNew(false);
              setEditEvt(null);
            }
          }}
        >
          <div className="modal">
            <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 20, marginBottom: 16 }}>
              {isEditing ? (lang === "en" ? "Edit Event" : "Editar Evento") : t.newEvent}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <div>
                <label>{t.memberName} *</label>
                <input
                  value={cur.name}
                  onChange={(e) => setCur({ ...cur, name: e.target.value })}
                />
              </div>
              <div className="fr">
                <div>
                  <label>{t.prefix} *</label>
                  <input
                    value={cur.prefix}
                    onChange={(e) => setCur({ ...cur, prefix: e.target.value.toUpperCase() })}
                    maxLength={5}
                  />
                </div>
                <div>
                  <label>{t.location} *</label>
                  <input
                    value={cur.location}
                    onChange={(e) => setCur({ ...cur, location: e.target.value })}
                  />
                </div>
              </div>
              <div className="fr">
                <div>
                  <label>{t.date} *</label>
                  <input
                    type="date"
                    value={cur.date}
                    onChange={(e) => setCur({ ...cur, date: e.target.value })}
                  />
                </div>
                <div>
                  <label>Hora/Time</label>
                  <input
                    type="time"
                    value={cur.time}
                    onChange={(e) => setCur({ ...cur, time: e.target.value })}
                  />
                </div>
              </div>
              <div className="fr">
                <div>
                  <label>{t.maxCapacity}</label>
                  <input
                    type="number"
                    min={1}
                    value={cur.capacity}
                    onChange={(e) => setCur({ ...cur, capacity: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label>
                    {lang === "en" ? "Payment Deadline (days)" : "Prazo de Pagamento (dias)"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={cur.paymentDeadlineDays || 7}
                    onChange={(e) =>
                      setCur({ ...cur, paymentDeadlineDays: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div>
                <label>{t.feesPerCat}</label>
                <div
                  style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 }}
                >
                  {CATEGORIES.map((c) => (
                    <div key={c} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, width: 110, color: "#4b5563", flexShrink: 0 }}>
                        {c}
                      </span>
                      <input
                        type="number"
                        min={0}
                        style={{ width: "auto", flex: 1 }}
                        value={cur.fees[c]}
                        onChange={(e) =>
                          setCur({ ...cur, fees: { ...cur.fees, [c]: Number(e.target.value) } })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="fr">
                <button
                  className="btn btn-primary"
                  onClick={function () {
                    if (isEditing) {
                      var upd = {
                        name: editEvt.name,
                        prefix: editEvt.prefix,
                        date: editEvt.date,
                        time: editEvt.time,
                        location: editEvt.location,
                        capacity: editEvt.capacity,
                        payment_deadline_days: editEvt.paymentDeadlineDays,
                        fees: editEvt.fees,
                      };
                      setEvents(function (p) {
                        return p.map(function (e) {
                          return e.id === editEvt.id ? { ...editEvt } : e;
                        });
                      });
                      if (event && event.id === editEvt.id) setEvent({ ...editEvt });
                      sb.from("events")
                        .eq("id", editEvt.id)
                        .update(upd)
                        .then(function (res) {
                          if (res.error) console.error("event update error:", res.error);
                        });
                      notify("Evento atualizado!");
                      setShowNew(false);
                      setEditEvt(null);
                    } else {
                      if (!nEvt.name || !nEvt.prefix || !nEvt.date) return;
                      var newId = "EVT" + String(events.length + 1).padStart(3, "0");
                      var ev = { ...nEvt, id: newId, status: "active" };
                      var dbRow = {
                        id: newId,
                        name: nEvt.name,
                        prefix: nEvt.prefix,
                        date: nEvt.date,
                        time: nEvt.time,
                        location: nEvt.location,
                        capacity: nEvt.capacity,
                        payment_deadline_days: nEvt.paymentDeadlineDays,
                        fees: nEvt.fees,
                        status: "active",
                      };
                      setEvents(function (p) {
                        return [...p, ev];
                      });
                      setEvent(ev);
                      setShowNew(false);
                      sb.from("events")
                        .insert(dbRow)
                        .then(function (res) {
                          if (res.error) console.error("event insert error:", res.error);
                        });
                    }
                  }}
                >
                  {isEditing ? (lang === "en" ? "Save Changes" : "Salvar Alterações") : t.create}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setShowNew(false);
                    setEditEvt(null);
                  }}
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
