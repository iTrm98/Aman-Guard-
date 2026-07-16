import { createContext, useContext, useState, useEffect, useCallback } from "react";
import T from "../i18n/translations";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead as apiMarkNotificationRead,
  logout as apiLogout,
} from "../api/fraudService";
import { TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from "../api/client";

const NOTIFICATIONS_POLL_MS = 60000;

const AppContext = createContext(null);

// Identity before a session is loaded, or if the stored blob is missing/corrupt.
// Real values come from the login response (see completeLogin) and are persisted
// to localStorage so a page reload restores the session without re-login.
const DEFAULT_USER = { name: "مستخدم", nameEn: "User", role: "CUSTOMER" };

function readStoredUser() {
  try {
    return { ...DEFAULT_USER, ...JSON.parse(localStorage.getItem(USER_KEY) ?? "{}") };
  } catch {
    return DEFAULT_USER;
  }
}

export function AppProvider({ children }) {
  const [lang,          setLang]          = useState("ar");
  const [theme,         setTheme]         = useState("light");
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [modal,         setModal]         = useState({ open: false });
  const [panel,         setPanel]         = useState(null); // { type, data }
  const [currentUser,   setCurrentUser]   = useState(readStoredUser);
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem(TOKEN_KEY));

  const refreshNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }, []);

  // Notifications belong to an authenticated session. Polling before login
  // would fire tokenless requests that 401 and bounce the app to /login, so
  // this only runs once a session exists (and re-runs right after login).
  // The signed-out reset lives in logout(), not here, to keep setState out of
  // the effect body.
  useEffect(() => {
    if (!isAuthenticated) return;

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
  }, [isAuthenticated, refreshNotifications]);

  // When a token refresh fails (refresh token missing/expired/invalid), the API
  // client clears localStorage and fires "amanguard:unauthorized". Mirror that
  // into React state so App swaps back to the login screen. A *successful*
  // refresh never dispatches this, so a live session is never interrupted.
  useEffect(() => {
    function onUnauthorized() {
      setIsAuthenticated(false);
      setCurrentUser(DEFAULT_USER);
      setNotifications([]);
      setNotificationsLoading(true);
    }
    window.addEventListener("amanguard:unauthorized", onUnauthorized);
    return () => window.removeEventListener("amanguard:unauthorized", onUnauthorized);
  }, []);

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

  // Persist the login response and flip into the authenticated app. The stored
  // user shape ({ name, nameEn, role }) is what the Sidebar chip and App.jsx
  // freeze flow read, and role drives the default view (see App.jsx).
  const completeLogin = useCallback((loginResponse) => {
    const user = {
      name: loginResponse.name,
      nameEn: loginResponse.nameEn ?? loginResponse.name,
      role: loginResponse.role,
    };
    localStorage.setItem(TOKEN_KEY, loginResponse.token);
    localStorage.setItem(REFRESH_TOKEN_KEY, loginResponse.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    // apiLogout blacklists the token server-side and clears localStorage; it is
    // best-effort, so we drop the local session even if the request fails.
    try {
      await apiLogout();
    } catch {
      /* server logout is best-effort */
    }
    setIsAuthenticated(false);
    setCurrentUser(DEFAULT_USER);
    // Drop cached notifications so the next session starts clean.
    setNotifications([]);
    setNotificationsLoading(true);
  }, []);

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
      currentUser, isAuthenticated, completeLogin, logout,
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
