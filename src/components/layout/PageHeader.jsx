import { useApp } from "../../context/useApp";

// Shared header for every customer portal page. Icon/title mobile sizes come
// from the .page-header-* media-query classes in index.css; description font
// and bottom margin scale via the isMobile prop.
export default function PageHeader({ icon, titleKey, descKey, isMobile }) {
  const { t } = useApp();
  return (
    <div style={{ marginBottom: isMobile ? 16 : 24 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
        <span className="page-header-icon" style={{ fontSize:28 }}>{icon}</span>
        <h2 className="page-header-title" style={{ fontWeight:900, fontSize:22, color:"var(--text-primary)" }}>{t(titleKey)}</h2>
      </div>
      <p style={{ color:"var(--text-muted)", fontSize: isMobile ? 13 : 14 }}>{t(descKey)}</p>
    </div>
  );
}
