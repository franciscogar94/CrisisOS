"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import type { ChecklistItem } from "@/lib/leads/types";
import { CHECKLIST_PRIORITIES } from "@/lib/leads/types";
import { checklistProgress } from "@/lib/leads/derive";

export interface EvacuationChecklistProps {
  items: ChecklistItem[];
  onToggle: (itemId: string) => void;
}

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  immediate: { label: "Immediate", color: "bg-rose-500" },
  "short-term": { label: "Short term", color: "bg-amber-500" },
  "long-term": { label: "Long term", color: "bg-emerald-500" },
};

export function EvacuationChecklist({
  items,
  onToggle,
}: EvacuationChecklistProps) {
  const progress = useMemo(() => checklistProgress(items), [items]);

  const grouped = useMemo(() => {
    const map: Record<string, ChecklistItem[]> = {};
    for (const p of CHECKLIST_PRIORITIES) map[p] = [];
    for (const i of items) {
      (map[i.priority] ||= []).push(i);
    }
    return map;
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="flex w-full items-center justify-center text-sm text-muted-foreground">
        No checklist items yet.
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="rounded-xl border border-border bg-background p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              progress
            </div>
            <div className="text-2xl font-semibold text-foreground">
              {progress.done} / {progress.total}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ({progress.pct}%)
              </span>
            </div>
          </div>
          <div className="text-right font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            evacuation checklist
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${progress.pct}%` }}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {CHECKLIST_PRIORITIES.map((priority) => {
          const phaseItems = grouped[priority] ?? [];
          const meta = PRIORITY_LABELS[priority];
          return (
            <section
              key={priority}
              className="rounded-xl border border-border bg-background p-3"
            >
              <header className="flex items-center gap-2 pb-2">
                <span className={`size-2 rounded-full ${meta.color}`} />
                <span className="text-sm font-semibold text-foreground">
                  {meta.label}
                </span>
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                  {phaseItems.filter((i) => i.checked).length}/{phaseItems.length}
                </span>
              </header>
              {phaseItems.length === 0 ? (
                <p className="text-xs text-muted-foreground">No items.</p>
              ) : (
                <ul className="grid gap-1.5">
                  {phaseItems.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => onToggle(item.id)}
                        className="group flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm transition hover:bg-muted/40"
                      >
                        <span
                          className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition ${
                            item.checked
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-muted-foreground/40 group-hover:border-foreground"
                          }`}
                        >
                          {item.checked ? <Check className="size-3" /> : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={
                              item.checked
                                ? "block text-muted-foreground line-through"
                                : "block text-foreground"
                            }
                          >
                            {item.text}
                          </span>
                          {item.category ? (
                            <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                              {item.category}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
