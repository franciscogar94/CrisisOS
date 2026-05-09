"use client";

import { useMemo, useState } from "react";
import type { Resource, ResourceCategory } from "@/lib/leads/types";
import { resourceDeficit } from "@/lib/leads/derive";
import { useLocale } from "@/lib/i18n/context";
import { StatusChip } from "@/components/ui/status-chip";

export interface ResourceTableProps {
  resources: Resource[];
  onUpdateHave: (resourceId: string, have: number) => void;
}

type CategoryFilter = ResourceCategory | "all";

export function ResourceTable({ resources, onUpdateHave }: ResourceTableProps) {
  const { t } = useLocale();
  const [filter, setFilter] = useState<CategoryFilter>("all");

  const summary = useMemo(() => resourceDeficit(resources), [resources]);
  const categories = useMemo(() => {
    const set = new Set<ResourceCategory>();
    for (const r of resources) set.add(r.category);
    return Array.from(set);
  }, [resources]);

  const filtered = useMemo(() => {
    const copy = filter === "all" ? resources.slice() : resources.filter((r) => r.category === filter);
    copy.sort((a, b) => {
      if (a.critical !== b.critical) return a.critical ? -1 : 1;
      const aPct = a.need === 0 ? 100 : (a.have / a.need) * 100;
      const bPct = b.need === 0 ? 100 : (b.have / b.need) * 100;
      return aPct - bPct;
    });
    return copy;
  }, [resources, filter]);

  if (resources.length === 0) {
    return (
      <div className="flex w-full items-center justify-center text-sm text-txt-low">—</div>
    );
  }

  const criticalShort = summary.criticalShort;
  const fullyStocked = resources.filter((r) => r.have >= r.need).length;
  const partial = resources.length - fullyStocked - criticalShort;

  return (
    <div className="flex w-full flex-col">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-bg-2/50 px-5 py-3 font-mono text-xs">
        <span className="tracking-[0.2em] text-txt-low">FILTER</span>
        <FilterChip
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label={`ALL · ${resources.length}`}
          activeTone="brand"
        />
        {categories.map((c) => (
          <FilterChip
            key={c}
            active={filter === c}
            onClick={() => setFilter(c)}
            label={`${c.toUpperCase()} · ${resources.filter((r) => r.category === c).length}`}
          />
        ))}
        <span className="ml-auto text-txt-low">
          {t("resources.coverage") || "COVERAGE"}:{" "}
          <span className="text-txt-hi">{summary.pct}%</span>
        </span>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 divide-x divide-line border-b border-line md:grid-cols-4">
        <Tile label="TOTAL" value={String(resources.length)} tone="text-txt-hi" hint="tracked" />
        <Tile label="STOCKED" value={String(fullyStocked)} tone="text-emerald-400" hint="have ≥ need" />
        <Tile label="PARTIAL" value={String(partial)} tone="text-amber-400" hint="filling" />
        <Tile label="CRITICAL" value={String(criticalShort)} tone="text-red-400" hint="urgent" />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full font-mono text-sm">
          <thead className="sticky top-0 bg-bg-2 text-[10px] uppercase tracking-[0.16em] text-txt-low">
            <tr className="border-b border-line">
              <th className="px-5 py-3 text-left">UNIT</th>
              <th className="px-3 py-3 text-left">TYPE</th>
              <th className="px-3 py-3 text-left">STATUS</th>
              <th className="px-3 py-3 text-right">HAVE / NEED</th>
              <th className="px-3 py-3 text-left">COVERAGE</th>
              <th className="px-5 py-3 text-right">ACT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((r) => (
              <ResourceRow key={r.id} resource={r} onUpdateHave={onUpdateHave} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  activeTone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  activeTone?: "brand";
}) {
  const activeCls =
    activeTone === "brand" ? "bg-brand text-black" : "bg-txt-mid/15 text-txt-hi";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-sm px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] transition ${
        active ? activeCls : "border border-line text-txt-mid hover:text-txt-hi"
      }`}
    >
      {label}
    </button>
  );
}

function Tile({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone: string;
  hint: string;
}) {
  return (
    <div className="px-5 py-4 font-mono">
      <div className="text-[10px] tracking-[0.2em] text-txt-low">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${tone}`}>{value}</div>
      <div className="text-[11px] text-txt-low">{hint}</div>
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
  const pct =
    resource.need === 0 ? 100 : Math.min(100, Math.round((resource.have / resource.need) * 100));
  const status: "available" | "deployed" | "offline" =
    pct >= 100 ? "available" : pct === 0 ? "offline" : "deployed";
  const barColor =
    pct >= 100 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
  const isOffline = status === "offline";

  function deploy() {
    onUpdateHave(resource.id, Math.max(0, resource.have - 1));
  }
  function recall() {
    onUpdateHave(resource.id, resource.have + 1);
  }

  return (
    <tr className="hover:bg-bg-3/40">
      <td className={`px-5 py-3 ${isOffline ? "text-txt-low" : "text-txt-hi"}`}>
        {resource.critical ? <span className="mr-1.5 text-red-400">●</span> : null}
        {resource.name}
      </td>
      <td className="px-3 py-3 text-txt-mid">{resource.category}</td>
      <td className="px-3 py-3">
        <StatusChip status={status} />
      </td>
      <td className="px-3 py-3 text-right tabular-nums text-txt-mid">
        <span className={isOffline ? "text-txt-low" : "text-txt-hi"}>{resource.have}</span>
        <span className="text-txt-low"> / {resource.need}</span>
        <span className="ml-1 text-[11px] text-txt-low">{resource.unit}</span>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="relative h-1.5 w-32 overflow-hidden bg-bg-3">
            <div className={`absolute inset-y-0 left-0 ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[11px] tabular-nums text-txt-mid">{pct}%</span>
        </div>
      </td>
      <td className="px-5 py-3 text-right">
        {isOffline ? (
          <span className="text-[11px] text-txt-low">N/A</span>
        ) : status === "deployed" ? (
          <button
            type="button"
            onClick={recall}
            className="text-[11px] font-semibold tracking-[0.12em] text-amber-400 hover:text-amber-300"
          >
            RECALL
          </button>
        ) : (
          <button
            type="button"
            onClick={deploy}
            className="text-[11px] font-semibold tracking-[0.12em] text-brand hover:text-brand-3"
          >
            DEPLOY ›
          </button>
        )}
      </td>
    </tr>
  );
}
