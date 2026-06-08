import { useT } from '../i18n/strings';

export default function CapBar({event,activeCount,wlCount,exCount}){
  const t=useT();
  if(!event?.capacity) return null;
  const base=Math.min(activeCount,event.capacity);
  const pct=Math.min(100,Math.round(base/event.capacity*100));
  const color=pct>=100?"#c0392b":pct>=85?"#d4820a":"#2d8a4e";
  return(
    <div className="card" style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,flexWrap:"wrap",gap:6}}>
        <span style={{fontWeight:700,fontSize:14}}>{t.capLabel}</span>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          {exCount>0&&<span className="exc">⚡{exCount} {t.exceeding}</span>}
          {wlCount>0&&<span className="wl">⏳{wlCount} {t.waiting}</span>}
          <span style={{fontSize:14,fontWeight:700,color}}>{base}/{event.capacity}</span>
        </div>
      </div>
      <div className="cap-bar"><div className="cap-fill" style={{width:`${pct}%`,background:color}}/></div>
      <div style={{fontSize:11,color:"#6b7280",marginTop:4}}>{pct}% {t.occupied}{pct>=100?` — ${t.full}`:""}</div>
    </div>
  );
}
