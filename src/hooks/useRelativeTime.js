import { useEffect, useState } from "react";
import { useApp } from "../context/useApp";
import { formatRelativeTime } from "../lib/relativeTime";

const REFRESH_INTERVAL_MS = 60000;

export function useRelativeTime(isoString) {
  const { lang } = useApp();
  const [label, setLabel] = useState(() => formatRelativeTime(isoString, lang));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLabel(formatRelativeTime(isoString, lang));
    const interval = setInterval(() => {
      setLabel(formatRelativeTime(isoString, lang));
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isoString, lang]);

  return label;
}
