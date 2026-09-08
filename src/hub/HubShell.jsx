import { Outlet, useLocation } from "react-router-dom";
import HubTopbar from "./HubTopbar";

const SECTION_LABELS = {
  "/events":   { pt: "Eventos",        en: "Events" },
  "/cms":      { pt: "Diretório",      en: "Directory" },
  "/settings": { pt: "Configurações",  en: "Settings" },
  "/schedule": { pt: "Agenda",         en: "Schedule" },
  "/apprentice":{ pt: "Aprendiz",      en: "Apprentice" },
};

export default function HubShell({ user, logout, lang, setLang, theme, toggleTheme }) {
  const location = useLocation();
  const section = Object.keys(SECTION_LABELS).find((k) => location.pathname.startsWith(k));
  const sectionLabel = section ? (SECTION_LABELS[section][lang] || SECTION_LABELS[section].pt) : null;

  return (
    <div className="app-shell">
      <HubTopbar
        user={user}
        logout={logout}
        lang={lang}
        setLang={setLang}
        theme={theme}
        toggleTheme={toggleTheme}
        sectionLabel={sectionLabel}
      />
      <Outlet />
    </div>
  );
}
