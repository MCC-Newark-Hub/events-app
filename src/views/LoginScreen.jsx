import { useState } from 'react';
import { STRINGS } from '../i18n/strings';
import { SAMPLE_EVENT } from '../constants';
import ICMLogo from '../components/ICMLogo';
import PublicPortal from './PublicPortal';

function LoginScreen({login,lang,setLang}){
  const t=STRINGS[lang];
  const [pin,setPin]=useState("");const [err,setErr]=useState("");const [mode,setMode]=useState("choose");
  const go=()=>{if(!login(pin)){setErr(t.wrongPin);setPin("");}};
  if(mode==="public") return <PublicPortal event={SAMPLE_EVENT} lang={lang} setLang={setLang} onReset={()=>setMode("choose")}/>;
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#8B0000 0%,#b41926 50%,#03223f 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      {mode==="choose"?(
        <div style={{textAlign:"center",maxWidth:380,width:"100%"}}>

          <ICMLogo height={60} style={{marginBottom:16}}/>
          <h1 style={{fontFamily:"'Lora',Georgia,serif",color:"#fff",fontSize:28,fontWeight:700,letterSpacing:".01em",marginBottom:6}}>{t.appName}</h1>
          <p style={{color:"rgba(255,255,255,.7)",fontSize:15,marginBottom:32}}>{t.appSub}</p>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <button className="btn btn-accent" style={{padding:"14px 24px",fontSize:15}} onClick={()=>setMode("public")}>📝 {t.myReg}</button>
            <button className="btn btn-ghost" style={{padding:"14px 24px",fontSize:15,borderColor:"rgba(255,255,255,.3)",color:"#fff"}} onClick={()=>setMode("pin")}>🔐 {t.teamAccess}</button>
          </div>
          <p style={{color:"rgba(255,255,255,.3)",fontSize:12,marginTop:28}}>Seminário Para Principiantes 2026 · Philadelphia, PA</p>
        </div>
      ):(
        <div style={{background:"#fff",borderRadius:20,padding:"32px 28px",width:"100%",maxWidth:380,boxShadow:"0 24px 64px rgba(3,34,63,.4)",borderTop:"4px solid #8B0000"}}>
          <div style={{textAlign:"center",marginBottom:20}}>
            <div style={{fontSize:34,marginBottom:8}}>🔐</div>
            <h2 style={{fontFamily:"'Lora',Georgia,serif",fontSize:22,fontWeight:700,marginBottom:4,color:"var(--text)"}}>{t.teamAccess}</h2>
            <p style={{color:"#6b7280",fontSize:13}}>{t.enterPin}</p>
          </div>
          <input type="password" maxLength={4} value={pin} onChange={e=>{setPin(e.target.value);setErr("");}}
            placeholder="••••" onKeyDown={e=>e.key==="Enter"&&go()}
            style={{fontSize:28,letterSpacing:12,textAlign:"center",fontWeight:700,marginBottom:10,borderRadius:10,border:err?"2px solid #c0392b":"2px solid var(--input-border,#d4cfc9)"}}/>
          {err&&<p style={{color:"#c0392b",fontSize:13,marginBottom:8,textAlign:"center"}}>{err}</p>}
          <button className="btn btn-primary" style={{width:"100%",padding:12,fontSize:15,marginBottom:8}} onClick={go}>{lang==="pt"?"Entrar":"Sign In"}</button>
          <button className="btn btn-ghost" style={{width:"100%",padding:10}} onClick={()=>setMode("choose")}>{t.back}</button>
          <div style={{marginTop:14,padding:10,background:"#f8f9fb",borderRadius:8,fontSize:11,color:"#6b7280"}}>
            <strong>{t.demoPins}:</strong><br/>
            1234 Admin · 2222/3333 {lang==="pt"?"Atendente":"Clerk"} · 4444 Pastor<br/>
            5555/6666 GA · 7001–7010 {lang==="pt"?"Equipes":"Teams"}
          </div>
        </div>
      )}
    </div>
  );
}


export default LoginScreen;
