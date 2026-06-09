import logo from "@/assets/images/logo/icm-logo.png";
export default function ICMLogo({ height = 36, style = {} }) {
  return (
    <img
      src={logo}
      alt="Igreja Crista Maranata"
      style={{ height, width: "auto", objectFit: "contain", flexShrink: 0, ...style }}
    />
  );
}
