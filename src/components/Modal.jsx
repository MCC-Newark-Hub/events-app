export default function Modal({ children, onClose, maxWidth = 580 }) {
  return (
    <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" style={{ maxWidth }}>
        {children}
      </div>
    </div>
  );
}
