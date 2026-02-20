"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { safeLocalStorage } from "@/utils/storage";
import { cn } from "@/lib/utils";

export function ThemeToggle() {

  // Apply theme class to document
  useEffect(() => {

  if (!mounted) {
    return (
      <button
        aria-label="Toggle dark mode"
        className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:shadow-sm transition-colors"
      >
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
        <span className="sr-only">Theme</span>
        <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-200">Light</span>
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";
  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");

  // Avoid hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <button
        aria-label="Toggle dark mode"
        className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm bg-muted border border-border hover:shadow-sm transition-colors cursor-pointer"
      >
        <span className="w-4 h-4" />
        <span className="hidden sm:inline text-sm font-medium text-foreground">
          Theme
        </span>
      </button>
    );
  }

  return (
    <button
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle dark mode"
      onClick={toggle}
      className={cn(
        "relative inline-flex h-9 w-[72px] shrink-0 cursor-pointer items-center rounded-full border-2 transition-all duration-500 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      {/* Track background icons */}
      <span className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
        {/* Sun icon (left side) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "transition-all duration-500",
            isDark
              ? "text-muted-foreground/40"
              : "text-amber-500 scale-0 opacity-0",
          )}
        >
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2" />
          <path d="M12 21v2" />
          <path d="M4.22 4.22l1.42 1.42" />
          <path d="M18.36 18.36l1.42 1.42" />
          <path d="M1 12h2" />
          <path d="M21 12h2" />
          <path d="M4.22 19.78l1.42-1.42" />
          <path d="M18.36 5.64l1.42-1.42" />
        </svg>
        {/* Moon icon (right side) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "transition-all duration-500",
            isDark
              ? "text-sky-300 scale-0 opacity-0"
              : "text-muted-foreground/40",
          )}
        >
          <path d="M21 12.79A9 9 0 0111.21 3 7 7 0 0021 12.79z" />
        </svg>
      </span>

      {/* Sliding thumb */}
      <span
        className={cn(
          "pointer-events-none relative z-10 flex h-7 w-7 items-center justify-center rounded-full shadow-lg ring-0 transition-all duration-500 ease-in-out",
          isDark
            ? "translate-x-[38px] bg-foreground/90"
            : "translate-x-[4px] bg-foreground",
        )}
      >
        {/* Sun in thumb (light mode) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "absolute transition-all duration-500",
            isDark
              ? "rotate-90 scale-0 opacity-0 text-background"
              : "rotate-0 scale-100 opacity-100 text-background",
          )}
        >
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2" />
          <path d="M12 21v2" />
          <path d="M4.22 4.22l1.42 1.42" />
          <path d="M18.36 18.36l1.42 1.42" />
          <path d="M1 12h2" />
          <path d="M21 12h2" />
          <path d="M4.22 19.78l1.42-1.42" />
          <path d="M18.36 5.64l1.42-1.42" />
        </svg>
        {/* Moon in thumb (dark mode) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "absolute transition-all duration-500",
            isDark
              ? "rotate-0 scale-100 opacity-100 text-background"
              : "-rotate-90 scale-0 opacity-0 text-background",
          )}
        >
          <path d="M21 12.79A9 9 0 0111.21 3 7 7 0 0021 12.79z" />
        </svg>
      </span>
    </button>
  );
}

export default ThemeToggle;
