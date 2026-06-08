import { useT } from "@/i18n/strings";
import { fmt } from "@/constants";

export default function FeeBox({ fee, paid, isExempt }) {
  const t = useT();
  const bg = fee === 0 ? "#d1fae5" : "#fef3c7";
  const color = fee === 0 ? "#065f46" : "#92400e";
  const label = isExempt ? t.exempt : fee === 0 ? t.freeCategory : fmt(fee);
  return (
    <div style={{ background: bg, borderRadius: 8, padding: "10px 14px" }}>
      <span style={{ fontSize: 13, fontWeight: 600, color }}>
        {t.fee}: {label}
        {paid ? " · ✓" : ""}
      </span>
    </div>
  );
}
