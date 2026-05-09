import * as React from "react";
import { cn } from "@/lib/utils";
import type { Severity } from "./severity-chip";

const STRIP: Record<Severity, string> = {
  critical: "bg-red-500 text-white",
  high: "bg-amber-500 text-black",
  info: "bg-sky-500 text-black",
  safe: "bg-emerald-500 text-black",
};

const FRAME: Record<Severity, string> = {
  critical:
    "border-red-500/50 bg-red-50 dark:border-red-500/40 dark:bg-red-950/30",
  high:
    "border-amber-500/50 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-950/20",
  info:
    "border-sky-500/50 bg-sky-50 dark:border-sky-500/40 dark:bg-sky-950/20",
  safe:
    "border-emerald-500/50 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-950/20",
};

const ACCENT: Record<Severity, string> = {
  critical:
    "text-red-700 hover:text-red-800 dark:text-red-300 dark:hover:text-red-200",
  high:
    "text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200",
  info:
    "text-sky-700 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200",
  safe:
    "text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200",
};

const LABEL: Record<Severity, string> = {
  critical: "CRITICAL",
  high: "HIGH",
  info: "INFO",
  safe: "SAFE",
};

export function AlertBanner({
  severity,
  title,
  body,
  label,
  actions,
  className,
}: {
  severity: Severity;
  title?: React.ReactNode;
  body?: React.ReactNode;
  label?: string;
  actions?: { label: string; onClick?: () => void; tone?: "primary" | "muted" }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-stretch border rounded-sm",
        FRAME[severity],
        severity === "critical" && "pulse-crit",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center px-3 font-mono text-[10px] font-bold tracking-[0.16em]",
          STRIP[severity],
        )}
      >
        {label ?? LABEL[severity]}
      </div>
      <div className="flex-1 px-4 py-3 text-sm flex items-center justify-between gap-3">
        <div className="text-txt-hi">
          {title && <span className="font-semibold mr-1">{title}</span>}
          {body && <span className="text-txt-mid">{body}</span>}
        </div>
        {actions && actions.length > 0 && (
          <div className="flex gap-3 shrink-0">
            {actions.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={a.onClick}
                className={cn(
                  "font-mono text-[11px] tracking-[0.12em] uppercase",
                  a.tone === "muted"
                    ? "text-txt-low hover:text-txt-mid"
                    : ACCENT[severity],
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
