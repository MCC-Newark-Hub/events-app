import { useState } from 'react';
import { useT } from '../i18n/strings';
import { fmt } from '../constants';

function ApprovalsPanel({approvals,resolveApproval,event,activeCount}){
  const t=useT();
  const [note,setNote]=useState({});
  const pending=approvals.filter(a=>a.eventId===event?.id&&a.status==="pending");
  const resolved=approvals.filter(a=>a.eventId===event?.id&&a.status!=="pending");
  return(
    <div>
      <h2 style={{fontFamily:"'Lora',Georgia,serif",fontSize:22,fontWeight:700,marginBottom:18,color:"var(--text)"}}>{t.approvals}</h2>
      {pending.length===0&&<div style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:10,padding:"20px",textAlign:"center",color:"#166534",marginBottom:14}}>{t.noPending}</div>}
      {pending.map(a=>(
        <div key={a.id} className={`apr-card ${a.type==="exemption"?"danger":""}`}>
          <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:6,marginBottom:10}}>
            <span style={{fontWeight:700,fontSize:14}}>{a.type==="capacity_override"?t.capacityOverride:t.exemptionReq}</span>
            <span style={{fontSize:12,color:"#6b7280"}}>{t.requestedBy} {a.requestedBy}</span>
          </div>
          <div style={{background:"#fff",borderRadius:8,padding:"10px 14px",marginBottom:10,fontSize:13}}>
            <div style={{fontWeight:700}}>{a.memberName}</div>
            <div style={{color:"#6b7280",marginTop:2}}>{a.category} · {a.church}</div>
            {a.type==="capacity_override"&&<div style={{color:"#c4390a",fontWeight:600,marginTop:4}}>Registration #{activeCount+1} — above capacity of {event?.capacity}</div>}
            {a.type==="exemption"&&<div style={{color:"#7c3aed",fontWeight:600,marginTop:4}}>{t.exempt}: {fmt(a.fee)}</div>}
          </div>
          {a.note&&<p style={{fontSize:12,color:"#6b7280",marginBottom:10,fontStyle:"italic",padding:"8px 12px",background:"#f9f9f9",borderRadius:6}}>"{a.note}"</p>}
          <textarea rows={1} value={note[a.id]||""} onChange={e=>setNote(p=>({...p,[a.id]:e.target.value}))} placeholder={t.pastorNote} style={{marginBottom:8,fontSize:12}}/>
          <div className="fr">
            <button className="btn btn-ok" onClick={()=>resolveApproval(a.id,true,note[a.id]||"")}>{t.approve}</button>
            <button className="btn btn-danger" onClick={()=>resolveApproval(a.id,false,note[a.id]||"")}>{t.deny}</button>
          </div>
        </div>
      ))}
      {resolved.length>0&&(
        <div>
          <h4 style={{fontWeight:700,marginBottom:10,color:"#6b7280",fontSize:13,textTransform:"uppercase",letterSpacing:".5px"}}>{t.history}</h4>
          {resolved.map(a=>(
            <div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:"#fff",borderRadius:8,marginBottom:6,border:"1px solid var(--border)",fontSize:13}}>
              <div><span style={{fontWeight:600}}>{a.memberName}</span><span style={{marginLeft:8,color:"#6b7280"}}>{a.type==="capacity_override"?t.excedente:t.exempt}</span></div>
              <span className={a.status==="approved"?"badge badge-green":"badge badge-red"}>{a.status==="approved"?t.approved:t.denied}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default ApprovalsPanel;
