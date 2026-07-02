// Formats an ISO-8601 timestamp as a localized relative-time string
// ("5 minutes ago" / "منذ 5 دقائق"), mirroring the phrasing previously
// computed server-side in DashboardServiceImpl.

export function formatRelativeTime(isoString, lang = "ar") {
  if (!isoString) return "";

  const then = new Date(isoString).getTime();
  if (Number.isNaN(then)) return "";

  const diffMs = Math.max(0, Date.now() - then);
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) {
    return lang === "en" ? "Just now" : "الآن";
  }
  if (minutes < 60) {
    return lang === "en" ? `${minutes} min ago` : `منذ ${minutes} دقيقة`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return lang === "en" ? `${hours} hr ago` : `منذ ${hours} ساعة`;
  }

  const days = Math.floor(hours / 24);
  return lang === "en" ? `${days} day${days === 1 ? "" : "s"} ago` : `منذ ${days} يوم`;
}
