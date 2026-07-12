import { useApp } from "../../context/useApp";
import { CUSTOMER_PAGES } from "../../data/customerPages";

// Topbar search results for the customer portal: matches CUSTOMER_PAGES by
// keyword/label/description and navigates to the picked page. Rendered by
// Topbar only while the query is non-empty; selecting a result navigates and
// clears the query (which closes the dropdown).
export default function SearchDropdown({ query, onNavigate, isMobile }) {
  const { t, lang } = useApp();

  const q = query.trim().toLowerCase();
  const results = CUSTOMER_PAGES.filter((p) =>
    p.keywords.some((k) => k.toLowerCase().includes(q) || q.includes(k.toLowerCase())) ||
    p.labelAr.includes(query.trim()) ||
    p.labelEn.toLowerCase().includes(q) ||
    p.descAr.includes(query.trim()) ||
    p.descEn.toLowerCase().includes(q)
  );

  // Desktop anchors under the search input; mobile pins to the viewport edges
  // below the 64px topbar for comfortable tapping.
  const positionStyle = isMobile
    ? { position:"fixed", top:72, insetInline:16, width:"calc(100vw - 32px)" }
    : { position:"absolute", top:"calc(100% + 8px)", insetInlineEnd:0, width:300 };

  return (
    <div
      className="animate-fade-in"
      style={{
        ...positionStyle,
        zIndex:45,
        maxHeight:"60vh", overflowY:"auto",
        background:"var(--bg-surface)", border:"1px solid var(--border)",
        borderRadius:12, boxShadow:"var(--shadow-modal)", padding:6,
      }}
    >
      {results.map((p) => (
        <button
          key={p.id}
          onClick={() => onNavigate?.(p.id)}
          style={{
            display:"flex", alignItems:"center", gap:12, width:"100%",
            minHeight: isMobile ? 56 : 44,
            padding:"8px 12px", borderRadius:8, border:"none",
            background:"transparent", cursor:"pointer", textAlign:"start",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <span style={{ fontSize:20, flexShrink:0 }}>{p.icon}</span>
          <span style={{ minWidth:0 }}>
            <span style={{ display:"block", fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>
              {lang === "en" ? p.labelEn : p.labelAr}
            </span>
            <span style={{ display:"block", fontSize:11, color:"var(--text-muted)", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {lang === "en" ? p.descEn : p.descAr}
            </span>
          </span>
        </button>
      ))}
      {results.length === 0 && (
        <p style={{ padding:"14px 12px", fontSize:12, color:"var(--text-muted)", textAlign:"center" }}>
          {t("no_search_results")}
        </p>
      )}
    </div>
  );
}
