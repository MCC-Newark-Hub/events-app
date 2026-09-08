const DEFAULT_SESSION_TTL_HOURS = 2;

export const getCachedSessionTtlMs = () => {
  const cached = Number(localStorage.getItem("mcc_session_ttl_hours"));
  return (cached > 0 ? cached : DEFAULT_SESSION_TTL_HOURS) * 60 * 60 * 1000;
};

export const isSessionValid = () => {
  const ts = localStorage.getItem("mcc_pin_ts");
  return !!ts && Date.now() - Number(ts) < getCachedSessionTtlMs();
};

export const clearSession = () => {
  localStorage.removeItem("mcc_pin");
  localStorage.removeItem("mcc_view");
  localStorage.removeItem("mcc_pin_ts");
};
