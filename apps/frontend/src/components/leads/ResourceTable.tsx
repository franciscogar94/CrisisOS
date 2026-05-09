"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Minus, Plus } from "lucide-react";
import type { Resource } from "@/lib/leads/types";
import { resourceCategoryClass, resourceDeficit } from "@/lib/leads/derive";

export interface ResourceTableProps {
  resources: Resource[];
  onUpdateHave: (resourceId: string, have: number) => void;
}

export function ResourceTable({ resources, onUpdateHave }: ResourceTableProps) {
  const summary = useMemo(() => resourceDeficit(resources), [resources]);

  const sorted = useMemo(() => {
    const copy = resources.slice();
    copy.sort((a, b) => {
      if (a.critical !== b.critical) return a.critical ? -1 : 1;
      const aPct = a.need === 0 ? 100 : (a.have / a.need) * 100;
      const bPct = b.need === 0 ? 100 : (b.have / b.need) * 100;
      return aPct - bPct;
    });
    return copy;
  }, [resources]);

  if (resources.length === 0) {
    return (
      <div className="flex w-full items-center justify-center text-sm text-muted-foreground">
        No resources tracked.
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-border bg-background p-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            coverage
          </div>
          <div className="text-2xl font-semibold text-foreground">
            {summary.pct}%
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {summary.totalHave}/{summary.totalNeed} units
            </span>
          </div>
        </div>
        {summary.criticalShort > 0 ? (
          <div className="flex items-center gap-2 rounded-md bg-rose-500/10 px-3 py-1.5 text-sm text-rose-700 dark:text-rose-300">
            <AlertTriangle className="size-4" />
            {summary.criticalShort} critical resource
            {summary.criticalShort === 1 ? "" : "s"} short
          </div>
        ) : null}
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left">
              <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                Item
              </th>
              <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                Category
              </th>
              <th className="px-3 py-2 text-center font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                Have
              </th>
              <th className="px-3 py-2 text-center font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                Need
              </th>
              <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                Coverage
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <ResourceRow key={r.id} resource={r} onUpdateHave={onUpdateHave} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResourceRow({
  resource,
  onUpdateHave,
}: {
  resource: Resource;
  onUpdateHave: (id: string, have: number) => void;
}) {
  const [local, setLocal] = useState(resource.have);
  const pct =
    resource.need === 0
      ? 100
      : Math.min(100, Math.round((local / resource.need) * 100));
  const barColor = pct >= 100 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-rose-500";

  function commit(next: number) {
    const clamped = Math.max(0, Math.round(next));
    setLocal(clamped);
    onUpdateHave(resource.id, clamped);
  }

  return (
    <tr className="border-b border-border/50 last:border-0 hover:bg-muted/20">
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          {resource.critical ? (
            <span
              className="inline-flex size-1.5 rounded-full bg-rose-500"
              aria-label="critical"
            />
          ) : null}
          <span className="font-medium text-foreground">{resource.name}</span>
        </div>
      </td>
      <td className="px-3 py-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ring-1 ring-inset ${resourceCategoryClass(resource.category)}`}
        >
          {resource.category}
        </span>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => commit(local - 1)}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="decrease"
          >
            <Minus className="size-3" />
          </button>
          <span className="w-12 text-center font-mono tabular-nums">
            {local}
          </span>
          <button
            type="button"
            onClick={() => commit(local + 1)}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="increase"
          >
            <Plus className="size-3" />
          </button>
        </div>
      </td>
      <td className="px-3 py-2 text-center font-mono tabular-nums text-muted-foreground">
        {resource.need} {resource.unit}
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="relative h-2 w-32 overflow-hidden rounded-full bg-muted">
            <div
              className={`absolute inset-y-0 left-0 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {pct}%
          </span>
        </div>
      </td>
    </tr>
  );
}
