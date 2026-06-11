import { useState, useRef, useEffect } from "react";
import "./index.css";
import { LangContext } from "@/i18n/strings";
import { ROLES_SYS } from "@/constants";
import { useAppData } from "@/hooks/useAppData";
import { useAuth } from "@/hooks/useAuth";
import LoginScreen from "@/views/LoginScreen";
import PublicPortal from "@/views/PublicPortal";
import CheckInScreen from "@/views/CheckInScreen";
import SelfCheckInScreen from "@/views/SelfCheckInScreen";
import ClerkView from "@/views/ClerkView";
import AdminView from "@/views/AdminView";
import PastorView from "@/views/PastorView";
import GALeaderView from "@/views/GALeaderView";
import TeamLeaderView from "@/views/TeamLeaderView";

export default function App() {
  const lang = "pt";
  const setLang = () => {};
  const [theme, setTheme] = useState("light");
  const urlParams = new URLSearchParams(window.location.search);
  const checkinParam = urlParams.get('checkin');
  const selfCheckinParam = urlParams.get('selfcheckin');
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  const [view, setView] = useState("login");
  const [toast, setToast] = useState(null);
  const userRef = useRef(null);

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const appData = useAppData({ getUserRef: () => userRef.current, notify });
  const { user, login: authLogin, logout: authLogout } = useAuth(appData.dbUsers || []);
  useEffect(() => { userRef.current = user; });

  const login = function (pin) {
    const mapped = authLogin(pin);
    if (mapped) { setView(mapped.sysRole); return true; }
    return false;
  };
  const logout = () => { authLogout(); setView("login"); };

  const shared = { ...appData, theme, toggleTheme, user, logout, notify, lang, setLang };

  return (
    <LangContext.Provider value={lang}>
      <div data-theme={theme} style={{ minHeight: "100vh", fontFamily: "'Montserrat','Segoe UI',sans-serif" }}>
        {toast && <div className="toast">{toast}</div>}
        {checkinParam && (
          <CheckInScreen
            regNumber={checkinParam}
            regs={appData.regs}
            updatePresence={appData.updatePresence}
          />
        )}
        {selfCheckinParam && !checkinParam && (
          <SelfCheckInScreen
            eventId={selfCheckinParam}
            regs={appData.regs}
            members={appData.members}
            updatePresence={appData.updatePresence}
          />
        )}
        {!checkinParam && !selfCheckinParam && view === "login" && <LoginScreen login={login} lang={lang} setLang={setLang} />}
        {!checkinParam && !selfCheckinParam && view === "public" && (
          <PublicPortal
            event={appData.event}
            members={appData.members}
            regs={appData.regs}
            addReg={appData.addReg}
            lang={lang}
            setLang={setLang}
            onReset={() => setView("login")}
          />
        )}
        {!checkinParam && !selfCheckinParam && view === ROLES_SYS.CLERK && <ClerkView {...shared} />}
        {!checkinParam && !selfCheckinParam && view === ROLES_SYS.ADMIN && <AdminView {...shared} />}
        {!checkinParam && !selfCheckinParam && view === ROLES_SYS.PASTOR && <PastorView {...shared} />}
        {!checkinParam && !selfCheckinParam && view === ROLES_SYS.GA_LEADER && <GALeaderView {...shared} />}
        {!checkinParam && !selfCheckinParam && view === ROLES_SYS.TEAM_LEADER && <TeamLeaderView {...shared} />}
      </div>
    </LangContext.Provider>
  );
}
