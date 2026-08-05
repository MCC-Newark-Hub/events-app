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
import RegistrationLookup from "@/views/RegistrationLookup";

// Admin-configurable in Usuários & PINs (app_settings.session_ttl_hours). The
// synchronous checks below (session restore on mount) run before that setting
// has loaded from Supabase, so they use the last-known value cached in
// localStorage — refreshed once useAppData's fetch resolves, see the effect
// below. DEFAULT_SESSION_TTL_HOURS only applies on a device's very first load,
// before any value has ever been cached.
const DEFAULT_SESSION_TTL_HOURS = 2;
const getCachedSessionTtlMs = () => {
  const cached = Number(localStorage.getItem("mcc_session_ttl_hours"));
  return (cached > 0 ? cached : DEFAULT_SESSION_TTL_HOURS) * 60 * 60 * 1000;
};
const isSessionValid = () => {
  const ts = localStorage.getItem("mcc_pin_ts");
  return !!ts && Date.now() - Number(ts) < getCachedSessionTtlMs();
};
const clearSession = () => {
  localStorage.removeItem("mcc_pin");
  localStorage.removeItem("mcc_view");
  localStorage.removeItem("mcc_pin_ts");
};

export default function App() {
  const [lang, setLangState] = useState(() => localStorage.getItem("mcc_lang") || "pt");
  const setLang = (l) => {
    localStorage.setItem("mcc_lang", l);
    setLangState(l);
  };
  const [theme, setTheme] = useState("light");
  const urlParams = new URLSearchParams(window.location.search);
  const checkinParam = urlParams.get('checkin');
  const selfCheckinParam = urlParams.get('selfcheckin');
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  // Restore session from localStorage on mount, unless it's past the TTL
  const [view, setView] = useState(() => (isSessionValid() && localStorage.getItem("mcc_view")) || "login");
  const [savedPin] = useState(() => (isSessionValid() && localStorage.getItem("mcc_pin")) || null);
  const [lookupPrefill, setLookupPrefill] = useState("");
  const [toast, setToast] = useState(null);
  const userRef = useRef(null);

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const appData = useAppData({ getUserRef: () => userRef.current, notify });
  const { user, login: authLogin, logout: authLogout } = useAuth(appData.dbUsers || []);
  useEffect(() => { userRef.current = user; });

  // Clean up a stale/expired cached session that didn't get picked up above
  useEffect(() => {
    if (!savedPin && localStorage.getItem("mcc_pin")) clearSession();
  }, []);

  // Keep the locally-cached TTL fresh so the next app load's synchronous
  // session check (isSessionValid, above) reflects the admin-configured value
  // rather than whatever was cached on this device before.
  useEffect(() => {
    if (appData.settings?.sessionTtlHours) {
      localStorage.setItem("mcc_session_ttl_hours", String(appData.settings.sessionTtlHours));
    }
  }, [appData.settings?.sessionTtlHours]);

  // Re-login from saved PIN once DB users have loaded
  useEffect(() => {
    if (savedPin && !user && appData.dbUsers && appData.dbUsers.length > 0) {
      const mapped = authLogin(savedPin);
      if (mapped) {
        const restoredView = localStorage.getItem("mcc_view") || mapped.sysRole;
        setView(restoredView);
      } else {
        // PIN no longer valid, clear session
        clearSession();
        setView("login");
      }
    }
  }, [appData.dbUsers]);

  const login = function (pin) {
    const mapped = authLogin(pin);
    if (mapped) {
      localStorage.setItem("mcc_pin", pin);
      localStorage.setItem("mcc_view", mapped.sysRole);
      localStorage.setItem("mcc_pin_ts", String(Date.now()));
      setView(mapped.sysRole);
      return true;
    }
    return false;
  };
  const logout = () => {
    authLogout();
    clearSession();
    setView("login");
  };

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
            lang={lang}
            setLang={setLang}
          />
        )}
        {selfCheckinParam && !checkinParam && (
          <SelfCheckInScreen
            eventId={selfCheckinParam}
            regs={appData.regs}
            members={appData.members}
            updatePresence={appData.updatePresence}
            lang={lang}
            setLang={setLang}
          />
        )}
        {!checkinParam && !selfCheckinParam && view === "login" && <LoginScreen login={login} lang={lang} setLang={setLang} event={appData.event} activeCount={appData.activeCount} onPublicRegister={() => setView("public")} onLookup={() => setView("lookup")} />}
        {!checkinParam && !selfCheckinParam && view === "lookup" && (
          <RegistrationLookup
            event={appData.event}
            regs={appData.regs}
            members={appData.members}
            setMembers={appData.setMembers}
            churches={appData.churches}
            gas={appData.gas}
            updateReg={appData.updateReg}
            addReg={appData.addReg}
            lang={lang}
            initialName={lookupPrefill}
            onBack={() => { setLookupPrefill(""); setView("login"); }}
          />
        )}
        {!checkinParam && !selfCheckinParam && view === "public" && (
          <PublicPortal
            event={appData.event}
            members={appData.members}
            setMembers={appData.setMembers}
            churches={appData.churches}
            gas={appData.gas}
            loading={appData.loading}
            regs={appData.regs}
            addReg={appData.addReg}
            submitApproval={appData.submitApproval}
            lang={lang}
            setLang={setLang}
            onReset={() => setView("login")}
            onLookup={(name) => { setLookupPrefill(name || ""); setView("lookup"); }}
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
