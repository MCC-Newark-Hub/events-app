import ICMLogo from './ICMLogo';

export default function Topbar({title,sub,user,logout,pendingCount,lang,setLang,theme,toggleTheme}){
  return(
    <div className="topbar">
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <ICMLogo height={32}/>
        <div style={{borderLeft:"1px solid rgba(255,255,255,.2)",paddingLeft:12}}>
          <div style={{fontWeight:700,fontSize:14}}>{title}</div>
          <div style={{fontSize:11,opacity:.65}}>{sub}</div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        {pendingCount>0&&<span style={{background:"#c0392b",color:"#fff",borderRadius:99,padding:"2px 8px",fontSize:12,fontWeight:700,flexShrink:0}}>⏳{pendingCount}</span>}
        <div className="avatar">{user?.initials}</div>
        <span className="user-name" style={{fontSize:13}}>{user?.name}</span>
        <button className="btn btn-ghost" style={{padding:"5px 10px",fontSize:12,borderColor:"rgba(255,255,255,.3)",color:"#fff"}} onClick={logout}>{lang==="pt"?"Sair":"Out"}</button>
      </div>
    </div>
  );
}
