"use client";

import { useLocale } from "@/lib/i18n/context";
import { LOCALES } from "@/lib/i18n/dictionary";

export function LocaleToggle() {
  const { locale, setLocale, t } = useLocale();
  return (
    <div
      role="group"
      aria-label={t("locale.toggle.aria")}
      className="inline-flex overflow-hidden rounded-md border border-border text-xs font-semibold"
    >
      {LOCALES.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            aria-pressed={active}
            onClick={() => setLocale(l)}
            className={
              active
                ? "bg-foreground px-2.5 py-1 text-background"
                : "bg-card px-2.5 py-1 text-foreground hover:bg-muted"
            }
          >
            {l.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
