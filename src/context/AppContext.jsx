import { createContext, useContext, useState, useEffect, useCallback } from "react";
import T from "../i18n/translations";

const AppContext = createContext(null);

const MOCK_NOTIFICATIONS = [
  { id: 1, read: false, icon: "🚨", titleKey: "stats_critical",    body: { ar: "تم رصد حالة احتيال حرجة جديدة — FR-9023", en: "New critical fraud case detected — FR-9023" }, time: "٢ دقيقة" },
  { id: 2, read: false, icon: "❄️", titleKey: "account_protected", body: { ar: "تم تجميد الحساب SA••4821 بناءً على طلب العميل", en: "Account SA••4821 frozen at client request" }, time: "١٥ دقيقة" },
  { id: 3, read: true,  icon: "✅", titleKey: "report_title",       body: { ar: "تقرير تحليل المخاطر الأسبوعي متاح الآن", en: "Weekly risk analysis report is now available" }, time: "١ ساعة" },
  { id: 4, read: true,  icon: "⚠️", titleKey: "stats_suspected",    body: { ar: "ارتفعت حالات الاشتباه بنسبة ١٢٪ هذا الأسبوع", en: "Suspected cases up 12% this week" }, time: "٣ ساعات" },
];

export function AppProvider({ children }) {
  const [lang,          setLang]          = useState("ar");
  const [theme,         setTheme]         = useState("light");
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [modal,         setModal]         = useState({ open: false });
  const [panel,         setPanel]         = useState(null); // { type, data }

  // Apply theme to root element
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
  }, [theme, lang]);

  // Translation helper — t("key") returns the string in current lang
  const t = useCallback(
    (key, vars = {}) => {
      const entry = T[key];
      if (!entry) return key;
      let str = entry[lang] ?? entry.ar ?? key;
      // Replace {n} style vars
      Object.entries(vars).forEach(([k, v]) => { str = str.replace(`{${k}}`, v); });
      return str;
    },
    [lang]
  );

  const toggleTheme = () => setTheme((th) => (th === "light" ? "dark" : "light"));
  const toggleLang  = () => setLang((l)  => (l  === "ar"    ? "en"   : "ar"));

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const showModal = useCallback((config) => {
    setModal({ open: true, type: "info", showCancel: false, ...config });
  }, []);
  const closeModal = useCallback(() => setModal((m) => ({ ...m, open: false })), []);

  const openPanel = useCallback((type, data = null) => setPanel({ type, data }), []);
  const closePanel = useCallback(() => setPanel(null), []);

  return (
    <AppContext.Provider value={{
      lang, theme, t, toggleTheme, toggleLang,
      notifications, markAllRead, unreadCount,
      modal, showModal, closeModal,
      panel, openPanel, closePanel,
    }}>
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
