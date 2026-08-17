import { useState } from "react";
import { CHURCH_LIST } from "@/constants";

const norm = (s) => (s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");

const isOutraValue = (v) => v === "Outra / Not Listed" || v === "Outra / Não Listada" || (v || "").startsWith("Outra: ");

export default function ChurchSearch({ value, onChange, placeholder, churches }) {
  var churchList = churches && churches.length > 0 ? churches : CHURCH_LIST;
  var [search, setSearch] = useState(
    value && value !== "Sem Igreja" && !isOutraValue(value) ? value : ""
  );
  var [open, setOpen] = useState(false);
  // Separate mode flag so "Outra" is active even before the note is typed.
  // value stays "" (invalid) until the user actually types the church name.
  var [isOtherMode, setIsOtherMode] = useState(isOutraValue(value));
  var [customText, setCustomText] = useState(
    (value || "").startsWith("Outra: ") ? value.slice(7) : ""
  );
  var isNoChurch = value === "Sem Igreja";

  var filtered = churchList
    .filter(function (c) {
      return norm(c.display || c).includes(norm(search));
    })
    .slice(0, 10);

  var enterOtherMode = function () {
    setIsOtherMode(true);
    setSearch("");
    setOpen(false);
    onChange(""); // stays invalid until note is entered
  };

  var pick = function (c) {
    if (c.allow_custom) {
      enterOtherMode();
    } else {
      var display = c.display || c;
      setSearch(display);
      setOpen(false);
      onChange(display);
    }
  };

  var clearAll = function () {
    setSearch("");
    setCustomText("");
    setIsOtherMode(false);
    onChange("");
  };

  return (
    <div>
      <div style={{ position: "relative" }}>
        <div className="sb">
          <span className="si-icon">⛪</span>
          <input
            value={isNoChurch ? "Sem Igreja" : isOtherMode ? "Outra / Não Listada" : search}
            onChange={function (e) {
              setSearch(e.target.value);
              onChange("");
              setOpen(true);
            }}
            onFocus={function () {
              setOpen(true);
            }}
            placeholder={placeholder || "Buscar igreja..."}
            style={{ borderColor: value ? "var(--primary)" : "", flex: 1 }}
            readOnly={isNoChurch || isOtherMode}
          />
          {(value || isOtherMode) && (
            <button
              onClick={clearAll}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--muted)",
                fontSize: 16,
                padding: "0 8px",
              }}
            >
              ×
            </button>
          )}
        </div>
        {open && search.length > 0 && !isNoChurch && !isOtherMode && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              zIndex: 100,
              boxShadow: "0 4px 16px rgba(0,0,0,.12)",
              maxHeight: 260,
              overflowY: "auto",
            }}
          >
            {filtered.map(function (c) {
              var display = c.display || c;
              var isSpecial = c.allow_custom;
              return (
                <div
                  key={display}
                  onClick={function () { pick(c); }}
                  style={{
                    padding: "10px 14px",
                    cursor: "pointer",
                    fontSize: 13,
                    borderBottom: "1px solid var(--border)",
                    color: isSpecial ? "var(--muted)" : "var(--text)",
                    fontStyle: isSpecial ? "italic" : "normal",
                  }}
                  onMouseEnter={function (e) { e.currentTarget.style.background = "var(--bg2)"; }}
                  onMouseLeave={function (e) { e.currentTarget.style.background = ""; }}
                >
                  {display}
                  {c.code && !isSpecial && (
                    <span style={{ marginLeft: 6, fontSize: 10, color: "var(--muted)", fontWeight: 600 }}>
                      {c.code}
                    </span>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ padding: "10px 14px", color: "var(--muted)", fontSize: 13 }}>
                Nenhuma igreja encontrada
              </div>
            )}
          </div>
        )}
      </div>
      {isOtherMode && (
        <div style={{ marginTop: 8 }}>
          <input
            autoFocus
            value={customText}
            onChange={function (e) {
              setCustomText(e.target.value);
              onChange(e.target.value.trim() ? "Outra: " + e.target.value.trim() : "");
            }}
            placeholder="Nome da igreja (obrigatório)..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              borderColor: customText.trim() ? "var(--primary)" : "var(--danger)",
            }}
          />
          <div style={{ fontSize: 11, marginTop: 3, color: customText.trim() ? "var(--muted)" : "var(--danger)" }}>
            {customText.trim()
              ? "Este nome aparecerá no crachá."
              : "⚠ Informe o nome da igreja para continuar."}
          </div>
        </div>
      )}
      {!value && !isOtherMode && (
        <div style={{ marginTop: 6 }}>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={enterOtherMode}
          >
            Outra / Não Listada
          </button>
        </div>
      )}
    </div>
  );
}
