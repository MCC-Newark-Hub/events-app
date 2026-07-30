export default function ConfirmDelete({ label, count, onConfirm, onCancel }) {
  return (
    <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal" style={{ maxWidth: 360, textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
        <h3 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, marginBottom: 8 }}>Confirmar exclusão</h3>
        <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>
          {count > 1
            ? <>Excluir <strong>{count} itens</strong>? Esta ação não pode ser desfeita.</>
            : <>Remover <strong>{label}</strong>? Esta ação não pode ser desfeita.</>}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel}>Cancelar</button>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={onConfirm}>Excluir</button>
        </div>
      </div>
    </div>
  );
}
