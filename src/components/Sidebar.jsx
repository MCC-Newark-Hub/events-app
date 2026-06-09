export default function Sidebar({ navItems, activeId, onSelect }) {
  return (
    <>
      {/* Desktop sidebar */}
      <div className="sidebar sidebar-desktop">
        {navItems.map((n) => (
          <div
            key={n.id}
            className={`si ${activeId === n.id ? "active" : ""}`}
            onClick={() => onSelect(n.id)}
          >
            {n.icon}
            <span style={{ fontSize: 13 }}>{n.label}</span>
          </div>
        ))}
      </div>
      {/* Mobile bottom nav */}
      <div className="bottom-nav">
        {navItems.map((n) => (
          <button
            key={n.id}
            className={`bn-item ${activeId === n.id ? "active" : ""}`}
            onClick={() => onSelect(n.id)}
          >
            <span className="bn-icon">{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}
