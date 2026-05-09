"use client";

import { useMemo } from "react";
import type { Resource, ResourceCategory } from "@/lib/leads/types";
import { resourceCategoryClass } from "@/lib/leads/derive";
import { useLocale } from "@/lib/i18n/context";

export interface ResourceBarsProps {
  resources: Resource[];
  selectedCategories?: ResourceCategory[];
  onPickCategory?: (cat: ResourceCategory) => void;
  compact?: boolean;
}

interface CategoryAgg {
  category: ResourceCategory;
  have: number;
  need: number;
  pct: number;
}

export function WorkshopDemand({
  resources,
  selectedCategories,
  onPickCategory,
  compact,
}: ResourceBarsProps) {
  const { t } = useLocale();
  const aggregates = useMemo<CategoryAgg[]>(() => {
    const map = new Map<ResourceCategory, { have: number; need: number }>();
    for (const r of resources) {
      const cur = map.get(r.category) ?? { have: 0, need: 0 };
      cur.have += r.have;
      cur.need += r.need;
      map.set(r.category, cur);
    }
    const out: CategoryAgg[] = [];
    for (const [category, { have, need }] of map) {
      const pct = need === 0 ? 100 : Math.min(100, Math.round((have / need) * 100));
      out.push({ category, have, need, pct });
    }
    out.sort((a, b) => a.pct - b.pct);
    return compact ? out.slice(0, 6) : out;
  }, [resources, compact]);

  const interactive = Boolean(onPickCategory);

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
        {t("resources.title")}
      </div>
      {aggregates.length === 0 ? (
        <div className="mt-3 text-sm text-muted-foreground">—</div>
      ) : (
        <ul className="mt-3 grid gap-2">
          {aggregates.map((a) => {
            const isSelected = selectedCategories?.includes(a.category) ?? false;
            const Row = interactive ? "button" : "div";
            return (
              <li key={a.category}>
                <Row
                  type={interactive ? ("button" as const) : undefined}
                  onClick={
                    interactive ? () => onPickCategory?.(a.category) : undefined
                  }
                  className={`flex w-full items-center gap-3 text-left ${
                    interactive
                      ? "rounded-md transition hover:bg-muted/40"
                      : ""
                  } ${isSelected ? "bg-muted/40" : ""}`}
                >
                  <span
                    className={`w-28 shrink-0 truncate rounded-full px-2 py-0.5 text-center text-[10px] font-medium uppercase tracking-wide ring-1 ring-inset ${resourceCategoryClass(a.category)}`}
                  >
                    {t(`category.${a.category}`)}
                  </span>
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`absolute inset-y-0 left-0 ${
                        a.pct >= 100
                          ? "bg-emerald-500"
                          : a.pct >= 60
                            ? "bg-amber-500"
                            : "bg-rose-500"
                      }`}
                      style={{ width: `${a.pct}%` }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
                    {a.have}/{a.need}
                  </span>
                </Row>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
