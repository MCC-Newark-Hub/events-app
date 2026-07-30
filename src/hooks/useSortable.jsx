import { useState } from "react";

export function useSortable(data, defaultKey) {
  const [sk, setSk] = useState(defaultKey);
  const [sd, setSd] = useState("asc");
  const toggle = (k) => { if (sk === k) setSd((d) => d === "asc" ? "desc" : "asc"); else { setSk(k); setSd("asc"); } };
  const sorted = [...(data || [])].sort((a, b) => {
    const av = a[sk] ?? ""; const bv = b[sk] ?? "";
    const c = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" });
    return sd === "asc" ? c : -c;
  });
  const Th = ({ k, children, style }) => (
    <th onClick={() => toggle(k)} style={{ cursor: "pointer", userSelect: "none", ...style }}>
      {children}{sk === k ? (sd === "asc" ? " ↑" : " ↓") : ""}
    </th>
  );
  return { sorted, Th };
}
