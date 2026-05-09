"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "crisisos:theme";

function readInitial(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* storage blocked, ignore */
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(readInitial());
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    apply(next);
  }

  const label = theme === "dark" ? "DARK" : "LIGHT";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle color theme"
      className="inline-flex items-center gap-1.5 rounded-sm border border-line px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-txt-mid transition hover:border-brand hover:text-txt-hi"
    >
      <span aria-hidden className="size-1.5 rounded-full bg-brand" />
      {label}
    </button>
  );
}
