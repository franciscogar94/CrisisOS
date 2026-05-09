"use client";

import { useMemo } from "react";
import type { TimelineEntry, TimelinePhase } from "@/lib/leads/types";
import { useLocale } from "@/lib/i18n/context";

const PHASE_LABEL: Record<TimelinePhase, string> = {
  first_5_min: "T+05",
  first_hour: "T+1h",
  first_day: "T+1d",
  first_week: "T+1w",
};

const PHASE_TONE: Record<TimelinePhase, string> = {
  first_5_min: "bg-red-500",
  first_hour: "bg-amber-500",
  first_day: "bg-brand",
  first_week: "bg-sky-500",
};

const PHASE_ORDER: Record<TimelinePhase, number> = {
  first_5_min: 0,
  first_hour: 1,
  first_day: 2,
  first_week: 3,
};

export interface TimelineProps {
  entries: TimelineEntry[];
  onToggle: (entryId: string) => void;
}

export function Timeline({ entries, onToggle }: TimelineProps) {
  const { t } = useLocale();
  const sorted = useMemo(() => {
    const copy = entries.slice();
    copy.sort((a, b) => {
      const pa = PHASE_ORDER[a.phase];
      const pb = PHASE_ORDER[b.phase];
      if (pa !== pb) return pa - pb;
      return a.order - b.order;
    });
    return copy;
  }, [entries]);

  if (sorted.length === 0) {
    return (
      <div className="flex w-full items-center justify-center text-sm text-txt-low">—</div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="absolute bottom-2 left-[112px] top-2 w-px bg-line" aria-hidden />
      <ul className="space-y-5">
        {sorted.map((e, idx) => {
          const isCritical = idx === sorted.length - 1 && e.phase === "first_5_min";
          const dotTone = isCritical ? "bg-red-500" : PHASE_TONE[e.phase];
          const phaseLabelTone = isCritical
            ? "text-red-700 dark:text-red-400"
            : "text-txt-low";
          const cardBorder = isCritical
            ? "border-red-500/40 bg-red-50 dark:bg-red-500/5"
            : "border-line hover:border-brand/60";
          return (
            <li key={e.id} className="flex items-start gap-5">
              <div
                className={`w-20 shrink-0 pt-1 font-mono text-xs uppercase tracking-[0.08em] ${phaseLabelTone}`}
              >
                {PHASE_LABEL[e.phase]}
              </div>
              <div
                className={`relative z-10 mt-1.5 size-3 shrink-0 ${dotTone} ${
                  isCritical ? "pulse-crit rotate-45" : ""
                }`}
              />
              <button
                type="button"
                onClick={() => onToggle(e.id)}
                className={`flex-1 border p-3 text-left transition ${cardBorder}`}
              >
                <div
                  className={`text-sm ${
                    e.completed ? "text-txt-low line-through" : "text-txt-hi"
                  } ${isCritical ? "font-semibold" : ""}`}
                >
                  {e.action}
                </div>
                <div className="mt-1 font-mono text-[11px] text-txt-low">
                  {t(`phase.${e.phase}`)} · #{e.order}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
