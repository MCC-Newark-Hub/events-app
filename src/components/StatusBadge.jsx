import { useT } from '../i18n/strings';
import { deadlineStatus } from '../constants';

export default function StatusBadge({r,event,allRegs=[]}){
  const t=useT();
  if(r.cancelled)  return <span className="badge badge-red">{t.cancelled}</span>;
  if(r.waitlisted) return <span className="wl">{r.waitlistReason||t.waitlisted}</span>;
  if(r.excedente)  return <span className="exc">⚡{t.excedente}</span>;
  if(r.exempt)     return <span className="badge badge-gray">{t.exempt}</span>;
  if(r.paid)       return <span className="badge badge-green">✓ {t.paid}</span>;
  if(event){
    const ds=deadlineStatus(r,event,allRegs);
    if(ds?.overdue) return <span className="badge badge-red">⏰ {ds.label}</span>;
    if(ds?.urgent)  return <span style={{display:"inline-flex",alignItems:"center",gap:4}}><span className="badge badge-yellow">{t.pending}</span><span style={{fontSize:10,color:"#d4820a",fontWeight:700}}>⚠ {ds.label}</span></span>;
  }
  return <span className="badge badge-yellow">{t.pending}</span>;
}
