import { useState, useRef } from "react";
import "./index.css";
import { LangContext } from "@/i18n/strings";
import { ROLES_SYS } from "@/constants";
import { useAppData } from "@/hooks/useAppData";
import { useAuth } from "@/hooks/useAuth";
import LoginScreen from "@/views/LoginScreen";
import PublicPortal from "@/views/PublicPortal";
import ClerkMode from "@/views/ClerkMode";
import AdminMode from "@/views/AdminMode";
import PastorView from "@/views/PastorView";
import GALeaderView from "@/views/GALeaderView";
import TeamLeaderView from "@/views/TeamLeaderView";

export default function App() {
  const lang = "pt";
  const setLang = () => {};
  const [theme, setTheme] = useState("light");
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  const [view, setView] = useState("login");
  const [toast, setToast] = useState(null);
  const userRef = useRef(null);

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Pass a stable getter so hooks always read the latest user value
  const appData = useAppData({ getUserRef: () => userRef.current, notify });

  const { user, login: authLogin, logout: authLogout } = useAuth(appData.dbUsers || []);
  userRef.current = user;

  const login = function (pin) {
    const mapped = authLogin(pin);
    if (mapped) {
      setView(mapped.sysRole);
      return true;
    }
    return false;
  };
  const logout = () => {
    authLogout();
    setView("login");
  };

  const shared = {
    ...appData,
    theme,
    toggleTheme,
    user,
    logout,
    notify,
    lang,
    setLang,
  };

  return (
    <LangContext.Provider value={lang}>
      <div
        data-theme={theme}
        style={{ minHeight: "100vh", fontFamily: "'Montserrat','Segoe UI',sans-serif" }}
      >
        {toast && <div className="toast">{toast}</div>}
        {view === "login" && <LoginScreen login={login} lang={lang} setLang={setLang} />}
        {view === "public" && (
          <PublicPortal
            event={appData.event}
            lang={lang}
            setLang={setLang}
            onReset={() => setView("login")}
          />
        )}
        {view === ROLES_SYS.CLERK && <ClerkMode {...shared} />}
        {view === ROLES_SYS.ADMIN && <AdminMode {...shared} />}
        {view === ROLES_SYS.PASTOR && <PastorView {...shared} />}
        {view === ROLES_SYS.GA_LEADER && <GALeaderView {...shared} />}
        {view === ROLES_SYS.TEAM_LEADER && <TeamLeaderView {...shared} />}
      </div>
    </LangContext.Provider>
  );
}
