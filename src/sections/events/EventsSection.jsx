import { useState } from "react";
import { ROLES_SYS } from "@/constants";
import AdminView from "@/views/AdminView";
import ClerkView from "@/views/ClerkView";
import PastorView from "@/views/PastorView";
import GALeaderView from "@/views/GALeaderView";
import TeamLeaderView from "@/views/TeamLeaderView";
import TreasurerView from "@/views/TreasurerView";

// EventsSection wraps all staff role views. Internal tab navigation (setSec)
// inside each view remains useState-based — no React Router used here.
export default function EventsSection(props) {
  const { user } = props;
  const role = user?.primaryRole || user?.sysRole;

  if (role === ROLES_SYS.ADMIN)       return <AdminView {...props} />;
  if (role === ROLES_SYS.CLERK)       return <ClerkView {...props} />;
  if (role === ROLES_SYS.PASTOR)      return <PastorView {...props} />;
  if (role === ROLES_SYS.GA_LEADER)   return <GALeaderView {...props} />;
  if (role === ROLES_SYS.TEAM_LEADER) return <TeamLeaderView {...props} />;
  if (role === ROLES_SYS.TREASURER)   return <TreasurerView {...props} />;

  return (
    <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
      Nenhuma visualização disponível para este perfil.
    </div>
  );
}
