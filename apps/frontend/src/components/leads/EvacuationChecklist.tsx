"use client";

import { useMemo } from "react";
import type { ChecklistItem, ChecklistPriority } from "@/lib/leads/types";
import { useLocale } from "@/lib/i18n/context";
import { PriorityChip } from "@/components/ui/priority-chip";
import { StatusChip } from "@/components/ui/status-chip";

export interface EvacuationChecklistProps {
  items: ChecklistItem[];
  onToggle: (itemId: string) => void;
}

const PRIORITY_TO_CHIP: Record<ChecklistPriority, "urgent" | "high" | "med"> = {
  immediate: "urgent",
  "short-term": "high",
  "long-term": "med",
};

export function EvacuationChecklist({ items, onToggle }: EvacuationChecklistProps) {
  const { t } = useLocale();

  const boards = useMemo(() => {
    const map = new Map<string, ChecklistItem[]>();
    for (const i of items) {
      const key = (i.category && i.category.trim()) || i.priority;
      const list = map.get(key);
      if (list) list.push(i);
      else map.set(key, [i]);
    }
    return Array.from(map.entries()).map(([key, list]) => ({ key, items: list }));
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="flex w-full items-center justify-center text-sm text-txt-low">—</div>
    );
  }

  return (
    <div className="grid w-full auto-rows-min gap-6 md:grid-cols-2">
      {boards.map((b) => (
        <Board key={b.key} title={titleize(b.key)} items={b.items} onToggle={onToggle} t={t} />
      ))}
    </div>
  );
}

function Board({
  title,
  items,
  onToggle,
  t,
}: {
  title: string;
  items: ChecklistItem[];
  onToggle: (id: string) => void;
  t: (key: string) => string;
}) {
  const done = items.filter((i) => i.checked).length;
  const total = items.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const status = done === total ? "done" : done === 0 ? "pending" : "in-progress";
  const barColor =
    status === "done" ? "bg-emerald-500" : status === "pending" ? "bg-zinc-700" : "bg-brand";

  return (
    <section className="border border-line bg-bg-2">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-txt-hi">{title}</div>
          <div className="font-mono text-[11px] text-txt-low">
            {done} / {total} {t("checklist.actions") || "actions"}
          </div>
        </div>
        <StatusChip status={status} />
      </header>
      <div className="h-1 bg-bg-3">
        <div className={`h-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <ul className="divide-y divide-line">
        {items.map((item) => {
          const chip = PRIORITY_TO_CHIP[item.priority];
          const isUrgent = chip === "urgent" && !item.checked;
          return (
            <li
              key={item.id}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm ${
                isUrgent ? "bg-amber-500/5" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => onToggle(item.id)}
                className="accent-brand size-4 shrink-0 cursor-pointer"
              />
              <span
                className={`min-w-0 flex-1 ${
                  item.checked ? "text-txt-low line-through" : "text-txt-mid"
                }`}
              >
                {item.text}
              </span>
              {item.checked ? (
                <StatusChip status="done" />
              ) : (
                <PriorityChip priority={chip} />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function titleize(key: string): string {
  return key
    .split(/[-_\s]/)
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p))
    .join(" ");
}
