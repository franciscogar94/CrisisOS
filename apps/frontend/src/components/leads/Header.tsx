"use client";

import { AlertTriangle, MapPin } from "lucide-react";
import type { Crisis, CrisisSeverity } from "@/lib/leads/types";
import { crisisTypeIcon, severityClass } from "@/lib/leads/derive";
import { useLocale } from "@/lib/i18n/context";
import { LocaleToggle } from "@/components/LocaleToggle";

interface HeaderProps {
  title: string;
  subtitle: string;
  crisis: Crisis | null;
}

export function Header({ title, subtitle, crisis }: HeaderProps) {
  const { t } = useLocale();
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 pb-5">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {crisis ? (
            <span aria-hidden className="text-3xl">
              {crisisTypeIcon(crisis.type)}
            </span>
          ) : null}
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
        {crisis ? (
          <>
            <SeverityBadge severity={crisis.severity} />
            <span className="inline-flex items-center gap-1.5 normal-case">
              <MapPin className="size-3" />
              {crisis.location.name ?? `${crisis.location.lat.toFixed(2)}, ${crisis.location.lng.toFixed(2)}`}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <AlertTriangle className="size-3" />
              {t("crisis.radius", { km: crisis.affectedRadius })}
            </span>
          </>
        ) : null}
        <LocaleToggle />
      </div>
    </header>
  );
}

function SeverityBadge({ severity }: { severity: CrisisSeverity }) {
  const { t } = useLocale();
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ring-1 ring-inset ${severityClass(severity)}`}
    >
      {t(`severity.${severity}`)}
    </span>
  );
}
