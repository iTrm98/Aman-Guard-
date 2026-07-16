import { useState, useEffect } from "react";
import { useApp } from "../../context/useApp";

// Small pill reporting whether the AmanGuard browser extension is installed.
// No extension id: we postMessage a PING to the page; the extension's content
// script answers with a PONG. No PONG within 1s → treated as not installed.
export default function ExtensionStatus() {
  const { t } = useApp();
  const [status, setStatus] = useState("unknown");
  const [enabled, setEnabled] = useState(true);

  function toggleExtension() {
    const newState = !enabled;
    setEnabled(newState);
    // Tell the extension to enable/disable via the postMessage bridge.
    window.postMessage({
      source: "AMANGUARD_WEB",
      action: newState ? "ENABLE_EXTENSION" : "DISABLE_EXTENSION",
    }, window.location.origin);
  }

  useEffect(() => {
    // Ask the extension (if any) to announce itself.
    window.postMessage({ source: "AMANGUARD_WEB", action: "PING_EXTENSION" }, "*");

    const handler = (event) => {
      if (event.data?.source === "AMANGUARD_EXTENSION" && event.data?.action === "PONG") {
        setStatus("connected");
      }
    };
    window.addEventListener("message", handler);

    // No response in 1s → assume the extension isn't installed.
    const timeout = setTimeout(() => {
      setStatus((current) => (current === "unknown" ? "not_installed" : current));
    }, 1000);

    return () => {
      window.removeEventListener("message", handler);
      clearTimeout(timeout);
    };
  }, []);

  const styles = {
    connected:     { bg:"rgba(34,197,94,0.1)",  color:"#16a34a", dot:"#22c55e", label: t("extension_connected")     },
    not_installed: { bg:"rgba(239,68,68,0.1)",   color:"#dc2626", dot:"#ef4444", label: t("extension_not_installed") },
    unknown:       { bg:"rgba(156,163,175,0.1)", color:"#6b7280", dot:"#9ca3af", label: t("extension_checking")      },
  };

  const s = styles[status];
  return (
    <>
      <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 14px", borderRadius:99, background:s.bg, marginBottom:8 }}>
        <span style={{ width:8, height:8, borderRadius:"50%", background:s.dot, flexShrink:0 }} />
        <span style={{ fontSize:12, fontWeight:700, color:s.color }}>{s.label}</span>
      </div>

      {status === "connected" && (
        <div style={{ marginTop:10 }}>
          <button
            onClick={toggleExtension}
            className={enabled ? "btn-ghost" : "btn-primary"}
            style={{ width:"100%", fontSize:13, padding:"8px 16px" }}
          >
            {enabled
              ? `⏸ ${t("disable_extension")}`
              : `▶ ${t("enable_extension")}`
            }
          </button>
          <p style={{ fontSize:11, color:"var(--text-muted)", marginTop:6, textAlign:"center" }}>
            {enabled ? t("extension_enabled_desc") : t("extension_disabled_desc")}
          </p>
        </div>
      )}
    </>
  );
}
