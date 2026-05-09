"use client";

import { useMemo } from "react";
import type { AgentState } from "@/lib/leads/types";
import {
  alertCount,
  checklistProgress,
  resourceDeficit,
} from "@/lib/leads/derive";

export interface QuickStatsProps {
  state: AgentState;
}

interface Tile {
  label: string;
  value: string;
  meta?: string;
  accent: "lilac" | "mint" | "blue" | "orange";
}

const ACCENT: Record<Tile["accent"], string> = {
  lilac: "#BEC2FF",
  mint: "#85ECCE",
  blue: "#3D92E8",
  orange: "#FFAC4D",
};

export function QuickStats({ state }: QuickStatsProps) {
  const tiles = useMemo<Tile[]>(() => {
    const safeZones = state.safeZones.length;
    const openZones = state.safeZones.filter((z) => z.status === "open").length;

    const checklist = checklistProgress(state.checklist);
    const resources = resourceDeficit(state.resources);
    const alerts = alertCount(state.alerts);

    return [
      {
        label: "safe zones",
        value: safeZones.toString(),
        meta:
          safeZones === 0
            ? "none located"
            : `${openZones} open / ${safeZones} total`,
        accent: "lilac",
      },
      {
        label: "checklist",
        value: `${checklist.pct}%`,
        meta: checklist.total === 0 ? "no items" : `${checklist.done} / ${checklist.total} done`,
        accent: "mint",
      },
      {
        label: "resources",
        value: `${resources.pct}%`,
        meta:
          resources.criticalShort > 0
            ? `${resources.criticalShort} critical short`
            : "supplies covered",
        accent: "blue",
      },
      {
        label: "service alerts",
        value: (alerts.outage + alerts.degraded).toString(),
        meta:
          alerts.outage === 0 && alerts.degraded === 0
            ? "all operational"
            : `${alerts.outage} outage, ${alerts.degraded} degraded`,
        accent: "orange",
      },
    ];
  }, [state]);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <span
              className="size-2 rounded-full"
              style={{ background: ACCENT[t.accent] }}
              aria-hidden
            />
            <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              {t.label}
            </span>
          </div>
          <div className="mt-2 truncate text-2xl font-semibold leading-tight text-foreground">
            {t.value}
          </div>
          {t.meta ? (
            <div className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
              {t.meta}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
