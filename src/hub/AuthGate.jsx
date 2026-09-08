import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isSessionValid } from "@/lib/session";

export default function AuthGate({ user }) {
  const location = useLocation();
  if (!user || !isSessionValid()) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <Outlet />;
}
