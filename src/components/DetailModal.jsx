import { useState } from 'react';
import { useT } from '../i18n/strings';
import { ROLE_GROUPS, TEAMS } from '../constants';

function DetailModal({reg,event,onClose,onUpdate,canEditPayment,lang}){
  const t=useT();
  const [f,setF]=useState({...reg});
  return(
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h3 style={{fontFamily:"'Lora',Georgia,serif",fontSize:20}}>{t.registrations}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{background:"#f8f9fb",borderRadius:10,padding:"12px 16px",marginBottom:14}}>
          <div style={{fontFamily:"monospace",fontSize:13,fontWeight:700,color:"var(--icm-crimson,#b41926)"}}>{reg.regNumber}</div>
          {reg.excedente&&<span className="exc" style={{display:"inline-block",marginTop:4}}>⚡ {t.excedente}</span>}
          <div style={{fontSize:18,fontWeight:700,marginTop:4}}>{reg.memberName}</div>
          {reg.badgeName&&reg.badgeName!==reg.memberName&&<div style={{fontSize:12,color:"#6b7280"}}>{t.badgeName}: {reg.badgeName}</div>}
          <div style={{fontSize:13,color:"#6b7280",marginTop:2}}>{reg.church} · {reg.category}</div>
          <div style={{fontSize:11,color:"#9ca3af",marginTop:4}}>{t.registeredAt} {reg.registeredAt} {t.registeredBy} {reg.registeredBy}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:13}}>
          <div className="fr">
            <div><label>{t.team}</label><select value={f.team} onChange={e=>setF({...f,team:e.target.value})}>{TEAMS.map(t2=><option key={t2}>{t2}</option>)}</select></div>
            <div><label>{t.role}</label><select value={f.role||""} onChange={e=>setF({...f,role:e.target.value})}>{[<option key="" value="">{t.noRole}</option>,
  ...ROLE_GROUPS.map(g=>(
    <optgroup key={g.group} label={g.group}>
      {g.roles.map(r=><option key={r} value={r}>{r}</option>)}
    </optgroup>
  ))
]}</select></div>
          </div>
          <div><label>{t.badgeName}</label><input value={f.badgeName||""} onChange={e=>setF({...f,badgeName:e.target.value})}/></div>
          <div className="fr3">
            {canEditPayment&&<div className="cb"><input type="checkbox" id="dp" checked={!!f.paid} onChange={e=>setF({...f,paid:e.target.checked})}/><label htmlFor="dp">✓ {t.paid}</label></div>}
            {canEditPayment&&<div className="cb"><input type="checkbox" id="de" checked={!!f.exempt} onChange={e=>setF({...f,exempt:e.target.checked})}/><label htmlFor="de">{t.exempt}</label></div>}
            <div className="cb"><input type="checkbox" id="dc" checked={!!f.cancelled} onChange={e=>setF({...f,cancelled:e.target.checked})}/><label htmlFor="dc" style={{color:"#c0392b"}}>{t.cancelled}</label></div>
          </div>
          <div><label>{t.notes}</label><textarea rows={2} value={f.note||""} onChange={e=>setF({...f,note:e.target.value})}/></div>
          {/* Badge printed */}
          {canEditPayment&&(
            <div className="cb" style={{padding:"10px 14px",background:"var(--bg2)",borderRadius:8}}>
              <input type="checkbox" id="dbp" checked={!!f.badgePrinted} onChange={e=>setF({...f,badgePrinted:e.target.checked})}/>
              <label htmlFor="dbp" style={{fontWeight:600}}>🏷 {lang==="en"?"Badge printed":"Crachá impresso"}</label>
            </div>
          )}

          {/* Timeline */}
          {reg.timeline&&reg.timeline.length>0&&(
            <div>
              <label>{lang==="en"?"Registration Timeline":"Histórico da Inscrição"}</label>
              <div style={{marginTop:6,position:"relative",paddingLeft:20}}>
                <div style={{position:"absolute",left:7,top:0,bottom:0,width:2,background:"var(--border)"}}/>
                {reg.timeline.map((ev,i)=>(
                  <div key={i} style={{position:"relative",marginBottom:10,paddingLeft:14}}>
                    <div style={{position:"absolute",left:-7,top:4,width:10,height:10,borderRadius:"50%",background:ev.status==="Confirmado"?"#2d8a4e":ev.status==="Cancelado"?"#c0392b":ev.status==="Em Espera"?"#d4820a":"#b41926",border:"2px solid var(--card)"}}/>
                    <div style={{fontSize:12,fontWeight:700,color:"var(--text)"}}>{ev.status}</div>
                    <div style={{fontSize:11,color:"var(--muted)"}}>{ev.date} · {ev.by}</div>
                    {ev.note&&<div style={{fontSize:11,color:"var(--muted)",fontStyle:"italic"}}>"{ev.note}"</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{display:"flex",gap:10}}>
            <button className="btn btn-primary" style={{flex:1}} onClick={()=>onUpdate(f)}>{t.save}</button>
            <button className="btn btn-ghost" onClick={onClose}>{t.cancel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CLERK MODE ────────────────────────────────────────────────────────────────
export default DetailModal;
