import { useEffect, useState } from "react";

export function useDarkMode(): [boolean, () => void] {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const toggle = () => setDark((prev) => !prev);
  return [dark, toggle];
}
