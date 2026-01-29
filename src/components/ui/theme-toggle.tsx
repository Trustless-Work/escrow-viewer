"use client";

import { useEffect, useState } from "react";
import { safeLocalStorage } from "@/utils/storage";

export function ThemeToggle() {

    }
  }, []);

  // Apply theme class to document
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;

  }, [isDark, mounted]);

  const toggle = () => setIsDark((v) => !v);

  // Avoid hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <button
        aria-label="Toggle dark mode"
        className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm bg-muted border border-border hover:shadow-sm transition-colors cursor-pointer"
      >
        <span className="w-4 h-4" />
        <span className="hidden sm:inline text-sm font-medium text-foreground">Theme</span>
      </button>
    );
  }

  return (
    <button
      aria-pressed={isDark}
      aria-label="Toggle dark mode"
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm bg-muted border border-border hover:shadow-sm transition-colors cursor-pointer"
    >
      {isDark ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-300">
          <path d="M21 12.79A9 9 0 0111.21 3 7 7 0 0021 12.79z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
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
      <span className="hidden sm:inline text-sm font-medium text-foreground">{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}

export default ThemeToggle;
