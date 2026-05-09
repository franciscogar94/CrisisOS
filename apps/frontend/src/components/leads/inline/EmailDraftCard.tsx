"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { ChecklistItem } from "@/lib/leads/types";

export interface EvacChecklistCardProps {
  items: ChecklistItem[];
  onConfirm: (checkedIds: string[]) => void;
  onCancel?: () => void;
  title?: string;
}

export function EmailDraftCard({
  items,
  onConfirm,
  onCancel,
  title,
}: EvacChecklistCardProps) {
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(items.filter((i) => i.checked).map((i) => i.id)),
  );
  const [state, setState] = useState<"editing" | "confirmed" | "cancelled">(
    "editing",
  );

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (state === "confirmed") {
    return (
      <div className="my-2 rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-3 text-sm">
        <span className="font-mono text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          confirmed
        </span>
        <p className="mt-1 text-foreground">
          {checked.size} item{checked.size === 1 ? "" : "s"} confirmed.
        </p>
      </div>
    );
  }

  if (state === "cancelled") {
    return (
      <div className="my-2 rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
        Checklist dismissed.
      </div>
    );
  }

  return (
    <div className="my-2 rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
        {title ?? "evacuation checklist"}
      </div>
      <ul className="mt-2 grid gap-1.5">
        {items.map((item) => {
          const isChecked = checked.has(item.id);
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => toggle(item.id)}
                className="flex w-full items-start gap-2 rounded-md px-2 py-1 text-left text-sm transition hover:bg-muted/40"
              >
                <span
                  className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition ${
                    isChecked
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-muted-foreground/40"
                  }`}
                >
                  {isChecked ? <Check className="size-3" /> : null}
                </span>
                <span
                  className={
                    isChecked
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  }
                >
                  {item.text}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex items-center justify-end gap-2">
        {onCancel ? (
          <button
            type="button"
            onClick={() => {
              setState("cancelled");
              onCancel();
            }}
            className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Dismiss
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setState("confirmed");
            onConfirm(Array.from(checked));
          }}
          className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:bg-foreground/90"
        >
          Confirm ({checked.size})
        </button>
      </div>
    </div>
  );
}
