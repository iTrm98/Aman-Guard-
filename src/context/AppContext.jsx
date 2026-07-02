import { createContext, useContext, useState, useEffect, useCallback } from "react";
import T from "../i18n/translations";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead as apiMarkNotificationRead,
} from "../api/fraudService";

const NOTIFICATIONS_POLL_MS = 60000;

const AppContext = createContext(null);

// Placeholder until real JWT/session auth is added — every place that shows
// the logged-in user's identity should read from this instead of a literal.
const CURRENT_USER = {
  name: "نواف العتيبي",
  nameEn: "Nawaf Al-Otaibi",
  role: "customer",
  accountId: "SA0000000000000000004821",
};

export function AppProvider({ children }) {
  const [lang,          setLang]          = useState("ar");
  const [theme,         setTheme]         = useState("light");
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [modal,         setModal]         = useState({ open: false });
  const [panel,         setPanel]         = useState(null); // { type, data }
  const [currentUser]   = useState(CURRENT_USER);

  const refreshNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }, []);

  // Fetch notifications on mount, then poll for new ones. Failures are
  // caught (not rethrown) so a down backend degrades to an empty list
  // instead of breaking every screen that reads from AppContext.
  useEffect(() => {
    let cancelled = false;
    getNotifications()
      .then((data) => {
        if (!cancelled) setNotifications(data);
      })
      .catch((err) => {
        console.error("Failed to load notifications:", err);
      })
      .finally(() => {
        if (!cancelled) setNotificationsLoading(false);
      });

    const interval = setInterval(refreshNotifications, NOTIFICATIONS_POLL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [refreshNotifications]);

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
    // Fire-and-forget: local state updates optimistically regardless of
    // whether the request succeeds.
    markAllNotificationsRead().catch((err) => {
      console.error("Failed to persist mark-all-read:", err);
    });
  }

  function markNotificationRead(id) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    apiMarkNotificationRead(id).catch((err) => {
      console.error("Failed to persist notification read:", err);
    });
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
      notifications, notificationsLoading, markAllRead, markNotificationRead, refreshNotifications, unreadCount,
      modal, showModal, closeModal,
      panel, openPanel, closePanel,
      currentUser,
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
