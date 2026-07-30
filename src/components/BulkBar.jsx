import { Trash2 } from "lucide-react";

export default function BulkBar({ selected, total, onSelectAll, onClearAll, onDeleteSelected, label, children }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
      background: "var(--sidebar-active-bg)", border: "1.5px solid var(--primary)",
      borderRadius: 8, marginBottom: 10, flexWrap: "wrap",
    }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)" }}>
        {selected} selecionado{selected !== 1 ? "s" : ""}
      </span>
      <button className="btn btn-ghost btn-sm" onClick={onSelectAll} disabled={selected === total}>
        Selecionar todos ({total})
      </button>
      <button className="btn btn-ghost btn-sm" onClick={onClearAll}>Limpar seleção</button>
      {children}
      <button className="btn btn-danger btn-sm" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}
        onClick={onDeleteSelected}>
        <Trash2 size={13} /> Excluir {selected} {label}
      </button>
    </div>
  );
}
