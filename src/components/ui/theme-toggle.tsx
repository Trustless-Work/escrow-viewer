"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("theme");
      if (stored) {
        setIsDark(stored === "dark");
      } else {
        setIsDark(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch {
      // ignore
    }
  }, [isDark, mounted]);

  const toggle = () => setIsDark((v) => !v);

  return (
    <button
      aria-pressed={isDark}
      aria-label="Toggle dark mode"
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:shadow-sm transition-colors"
    >
      {isDark ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-300">
          <path d="M21 12.79A9 9 0 0111.21 3 7 7 0 0021 12.79z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700">
          <circle cx="12" cy="12" r="5"></circle>
          <path d="M12 1v2"></path>
          <path d="M12 21v2"></path>
          <path d="M4.22 4.22l1.42 1.42"></path>
          <path d="M18.36 18.36l1.42 1.42"></path>
          <path d="M1 12h2"></path>
          <path d="M21 12h2"></path>
          <path d="M4.22 19.78l1.42-1.42"></path>
          <path d="M18.36 5.64l1.42-1.42"></path>
        </svg>
      )}
      <span className="sr-only">Theme</span>
      <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-200">{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}

export default ThemeToggle;
