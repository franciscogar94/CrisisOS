"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { translate, type Locale } from "./dictionary";

const LATAM_REGIONS = new Set([
  "AR", "BO", "BR", "CL", "CO", "CR", "CU", "DO", "EC", "SV",
  "GT", "HN", "MX", "NI", "PA", "PY", "PE", "PR", "UY", "VE",
]);

const STORAGE_KEY = "crisisos.locale";

function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language?.toLowerCase() ?? "";
  if (lang.startsWith("es") || lang.startsWith("pt")) return "es";
  const region = lang.split("-")[1]?.toUpperCase();
  if (region && LATAM_REGIONS.has(region)) return "es";
  return "en";
}

type LocaleContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = (typeof localStorage !== "undefined"
      ? (localStorage.getItem(STORAGE_KEY) as Locale | null)
      : null);
    if (stored === "en" || stored === "es") {
      setLocaleState(stored);
      return;
    }
    setLocaleState(detectLocale());
  }, []);

  const setLocale = useCallback((l: Locale) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, l);
    }
    setLocaleState(l);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      translate(locale, key, params),
    [locale],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    return {
      locale: "en",
      setLocale: () => undefined,
      t: (key, params) => translate("en", key, params),
    };
  }
  return ctx;
}
