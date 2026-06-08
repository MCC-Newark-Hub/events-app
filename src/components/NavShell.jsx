export default function NavShell({navItems,activeId,onSelect,children}){
  return(
    <div className="body-with-sidebar">
      <div className="sidebar sidebar-desktop">
        {navItems.map(n=>(
          <div key={n.id} className={`si ${activeId===n.id?"active":""}`} onClick={()=>onSelect(n.id)}>
            <span>{n.icon}</span><span style={{fontSize:13}}>{n.label}</span>
          </div>
        ))}
      </div>
      <div className="main-scroll">
        <div className="page-pad">{children}</div>
      </div>
      <div className="bottom-nav">
        {navItems.map(n=>(
          <button key={n.id} className={`bn-item ${activeId===n.id?"active":""}`} onClick={()=>onSelect(n.id)}>
            <span className="bn-icon">{n.icon}</span><span>{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
