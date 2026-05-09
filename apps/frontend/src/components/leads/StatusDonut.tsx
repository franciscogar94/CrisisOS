"use client";

import { useMemo } from "react";
import type { ChecklistItem, ChecklistPriority } from "@/lib/leads/types";
import { CHECKLIST_PRIORITIES } from "@/lib/leads/types";
import { useLocale } from "@/lib/i18n/context";

const PRIORITY_KEY: Record<ChecklistPriority, string> = {
  immediate: "priority.immediate",
  "short-term": "priority.short",
  "long-term": "priority.long",
};

export interface StatusDonutProps {
  checklist: ChecklistItem[];
}

const PRIORITY_COLOR: Record<string, string> = {
  immediate: "#FF6B6B",
  "short-term": "#FFAC4D",
  "long-term": "#85ECCE",
};

const TRACK = "#F0F0F4";

export function StatusDonut({ checklist }: StatusDonutProps) {
  const { t } = useLocale();
  const segments = useMemo(() => {
    const counts = new Map<string, { total: number; done: number }>();
    for (const p of CHECKLIST_PRIORITIES) counts.set(p, { total: 0, done: 0 });
    for (const i of checklist) {
      const c = counts.get(i.priority);
      if (!c) continue;
      c.total += 1;
      if (i.checked) c.done += 1;
    }
    return CHECKLIST_PRIORITIES.map((p) => ({
      priority: p,
      total: counts.get(p)?.total ?? 0,
      done: counts.get(p)?.done ?? 0,
    }));
  }, [checklist]);

  const total = checklist.length;
  const done = checklist.filter((i) => i.checked).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const radius = 56;
  const stroke = 14;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const arcs = segments.map((seg) => {
    const fraction = total === 0 ? 0 : seg.total / total;
    const length = fraction * circumference;
    const dasharray = `${length} ${circumference - length}`;
    const dashoffset = -offset;
    offset += length;
    return { ...seg, dasharray, dashoffset };
  });

  return (
    <div className="flex h-full items-center gap-5 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="relative shrink-0">
        <svg
          width={radius * 2 + stroke * 2}
          height={radius * 2 + stroke * 2}
          viewBox={`0 0 ${radius * 2 + stroke * 2} ${radius * 2 + stroke * 2}`}
        >
          <g
            transform={`translate(${radius + stroke}, ${radius + stroke}) rotate(-90)`}
          >
            <circle r={radius} fill="none" stroke={TRACK} strokeWidth={stroke} />
            {total > 0
              ? arcs.map((arc) => (
                  <circle
                    key={arc.priority}
                    r={radius}
                    fill="none"
                    stroke={PRIORITY_COLOR[arc.priority] ?? "#BEC2FF"}
                    strokeWidth={stroke}
                    strokeDasharray={arc.dasharray}
                    strokeDashoffset={arc.dashoffset}
                    strokeLinecap="butt"
                  />
                ))
              : null}
          </g>
          <text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            className="fill-foreground"
            style={{ fontSize: 22, fontWeight: 600 }}
          >
            {pct}%
          </text>
          <text
            x="50%"
            y="62%"
            dominantBaseline="middle"
            textAnchor="middle"
            className="fill-muted-foreground"
            style={{
              fontSize: 9,
              letterSpacing: 0.5,
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
            }}
          >
            {t("donut.done")}
          </text>
        </svg>
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          {t("donut.title")}
        </div>
        <ul className="mt-2 grid gap-1.5">
          {segments.map((seg) => {
            const segPct = seg.total === 0 ? 0 : Math.round((seg.done / seg.total) * 100);
            return (
              <li key={seg.priority} className="flex items-center gap-2 text-sm">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: PRIORITY_COLOR[seg.priority] ?? "#BEC2FF" }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate text-foreground">
                  {t(PRIORITY_KEY[seg.priority as ChecklistPriority])}
                </span>
                <span className="font-mono text-[12px] text-muted-foreground">
                  {seg.done}/{seg.total}
                </span>
                <span className="w-9 text-right font-mono text-[10px] text-muted-foreground">
                  {segPct}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
