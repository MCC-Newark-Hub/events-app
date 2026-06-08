import { useState } from "react";
import { CHURCH_LIST } from "@/constants";

export default function ChurchSearch({ value, onChange, placeholder, churches }) {
  var churchList = churches && churches.length > 0 ? churches : CHURCH_LIST;
  var [search, setSearch] = useState(
    value && !["Sem Igreja", "Outra / Not Listed"].includes(value) ? value : ""
  );
  var [open, setOpen] = useState(false);
  var [customText, setCustomText] = useState("");
  var isOther = value === "Outra / Not Listed";
  var isNoChurch = value === "Sem Igreja";

  var filtered = churchList
    .filter(function (c) {
      return (c.display || c).toLowerCase().includes(search.toLowerCase());
    })
    .slice(0, 10);

  var pick = function (c) {
    var display = c.display || c;
    setSearch(display);
    setOpen(false);
    if (c.allow_custom) {
      onChange(display);
    } else {
      onChange(display);
    }
  };

  return (
    <div>
      <div style={{ position: "relative" }}>
        <div className="sb">
          <span className="si-icon">⛪</span>
          <input
            value={isNoChurch ? "Sem Igreja" : isOther ? "Outra / Not Listed" : search}
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
            readOnly={isNoChurch || isOther}
          />
          {value && (
            <button
              onClick={function () {
                setSearch("");
                setCustomText("");
                onChange("");
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--muted)",
                fontSize: 16,
                padding: "0 8px",
              }}
            >
              x
            </button>
          )}
        </div>
        {open && search.length > 0 && !isNoChurch && !isOther && (
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
                  onClick={function () {
                    pick(c);
                  }}
                  style={{
                    padding: "10px 14px",
                    cursor: "pointer",
                    fontSize: 13,
                    borderBottom: "1px solid var(--border)",
                    color: isSpecial ? "var(--muted)" : "var(--text)",
                    fontStyle: isSpecial ? "italic" : "normal",
                  }}
                  onMouseEnter={function (e) {
                    e.currentTarget.style.background = "var(--bg2)";
                  }}
                  onMouseLeave={function (e) {
                    e.currentTarget.style.background = "";
                  }}
                >
                  {display}
                  {c.code && !isSpecial && (
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 10,
                        color: "var(--muted)",
                        fontWeight: 600,
                      }}
                    >
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
      {isOther && (
        <div style={{ marginTop: 8 }}>
          <input
            value={customText}
            onChange={function (e) {
              setCustomText(e.target.value);
              onChange("Outra: " + e.target.value);
            }}
            placeholder="Nome da igreja..."
            style={{ width: "100%", boxSizing: "border-box" }}
          />
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
            Este nome aparecerá no crachá.
          </div>
        </div>
      )}
      {!value && (
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={function () {
              setSearch("Sem Igreja");
              setOpen(false);
              onChange("Sem Igreja");
            }}
          >
            Sem Igreja
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={function () {
              setSearch("Outra / Not Listed");
              setOpen(false);
              onChange("Outra / Not Listed");
            }}
          >
            Outra / Not Listed
          </button>
        </div>
      )}
    </div>
  );
}
