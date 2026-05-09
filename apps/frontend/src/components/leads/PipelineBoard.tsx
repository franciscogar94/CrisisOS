"use client";

import dynamic from "next/dynamic";
import { Map as MapIcon, ListChecks, Package, Clock, AlertOctagon, LayoutDashboard } from "lucide-react";
import type { ActiveModule, AgentState } from "@/lib/leads/types";
import { LeadCard } from "@/components/leads/LeadCard";
import { EvacuationChecklist } from "@/components/leads/EvacuationChecklist";
import { ResourceTable } from "@/components/leads/ResourceTable";

const CrisisMap = dynamic(
  () => import("@/components/leads/CrisisMap").then((m) => m.CrisisMap),
  { ssr: false, loading: () => <MapPlaceholder /> },
);

export interface ModuleTabsProps {
  state: AgentState;
  onModuleChange: (module: ActiveModule) => void;
  onSelectZone: (zoneId: string | null) => void;
  onToggleChecklistItem: (itemId: string) => void;
  onUpdateResource: (resourceId: string, have: number) => void;
  onToggleTimelineEntry: (entryId: string) => void;
}

const TABS: ReadonlyArray<{
  id: ActiveModule;
  label: string;
  icon: typeof MapIcon;
}> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "map", label: "Map", icon: MapIcon },
  { id: "checklist", label: "Checklist", icon: ListChecks },
  { id: "resources", label: "Resources", icon: Package },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "alerts", label: "Alerts", icon: AlertOctagon },
];

export function PipelineBoard({
  state,
  onModuleChange,
  onSelectZone,
  onToggleChecklistItem,
  onUpdateResource,
  onToggleTimelineEntry,
}: ModuleTabsProps) {
  const active = state.activeModule;
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-card shadow-sm">
      <nav
        role="tablist"
        className="flex flex-wrap items-center gap-1 border-b border-border px-2 py-2"
      >
        {TABS.map((t) => {
          const isActive = active === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onModuleChange(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                isActive
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5" />
              {t.label}
            </button>
          );
        })}
      </nav>
      <div className="flex min-h-0 flex-1 overflow-auto p-4">
        {active === "overview" ? (
          <OverviewModule state={state} />
        ) : active === "map" ? (
          <CrisisMap
            crisis={state.crisis}
            safeZones={state.safeZones}
            highlightedZoneIds={state.highlightedZoneIds}
            selectedZoneId={state.selectedZoneId}
            onSelectZone={onSelectZone}
          />
        ) : active === "checklist" ? (
          <EvacuationChecklist
            items={state.checklist}
            onToggle={onToggleChecklistItem}
          />
        ) : active === "resources" ? (
          <ResourceTable
            resources={state.resources}
            onUpdateHave={onUpdateResource}
          />
        ) : active === "timeline" ? (
          <TimelineModule
            entries={state.timeline}
            onToggle={onToggleTimelineEntry}
          />
        ) : active === "alerts" ? (
          <AlertsModule state={state} />
        ) : null}
      </div>
    </div>
  );
}

function MapPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
      Loading map…
    </div>
  );
}

function OverviewModule({ state }: { state: AgentState }) {
  if (!state.crisis) {
    return (
      <div className="flex w-full items-center justify-center py-16 text-center">
        <div>
          <p className="text-base font-medium text-foreground">No active crisis.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Describe an emergency in the chat to generate your operations center.
          </p>
        </div>
      </div>
    );
  }
  const { crisis, safeZones, alerts } = state;
  const openZones = safeZones.filter((z) => z.status === "open");
  const outageAlerts = alerts.filter((a) => a.status === "outage");
  return (
    <div className="grid w-full gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-background p-4">
        <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          situation
        </div>
        <h3 className="mt-2 text-lg font-semibold text-foreground">
          {crisis.title}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">{crisis.description}</p>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <dt className="text-muted-foreground">Type</dt>
          <dd className="capitalize text-foreground">{crisis.type}</dd>
          <dt className="text-muted-foreground">Severity</dt>
          <dd className="capitalize text-foreground">{crisis.severity}</dd>
          <dt className="text-muted-foreground">Affected radius</dt>
          <dd className="text-foreground">{crisis.affectedRadius} km</dd>
          <dt className="text-muted-foreground">Reported</dt>
          <dd className="text-foreground">
            {new Date(crisis.timestamp).toLocaleString()}
          </dd>
        </dl>
      </div>
      <div className="grid gap-3">
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            nearest open safe zones
          </div>
          {openZones.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">None located yet.</p>
          ) : (
            <ul className="mt-2 grid gap-2">
              {openZones.slice(0, 4).map((z) => (
                <li key={z.id}>
                  <LeadCard zone={z} compact />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            active outages
          </div>
          {outageAlerts.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No outages reported.</p>
          ) : (
            <ul className="mt-2 grid gap-1.5 text-sm">
              {outageAlerts.map((a) => (
                <li key={a.id} className="flex items-start gap-2">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-rose-500" />
                  <span className="capitalize text-foreground">{a.service}:</span>
                  <span className="text-muted-foreground">{a.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function TimelineModule({
  entries,
  onToggle,
}: {
  entries: AgentState["timeline"];
  onToggle: (id: string) => void;
}) {
  if (entries.length === 0) {
    return (
      <div className="flex w-full items-center justify-center text-sm text-muted-foreground">
        No timeline yet.
      </div>
    );
  }
  const phases: Array<{ id: AgentState["timeline"][number]["phase"]; label: string }> = [
    { id: "first_5_min", label: "First 5 minutes" },
    { id: "first_hour", label: "First hour" },
    { id: "first_day", label: "First day" },
    { id: "first_week", label: "First week" },
  ];
  return (
    <div className="grid w-full gap-4 md:grid-cols-2 xl:grid-cols-4">
      {phases.map((p) => {
        const phaseEntries = entries.filter((e) => e.phase === p.id);
        return (
          <div
            key={p.id}
            className="rounded-xl border border-border bg-background p-3"
          >
            <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              {p.label}
            </div>
            <ul className="mt-2 grid gap-1.5">
              {phaseEntries.length === 0 ? (
                <li className="text-xs text-muted-foreground">—</li>
              ) : (
                phaseEntries
                  .sort((a, b) => a.order - b.order)
                  .map((e) => (
                    <li key={e.id} className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={e.completed}
                        onChange={() => onToggle(e.id)}
                        className="mt-0.5"
                      />
                      <span
                        className={
                          e.completed
                            ? "text-muted-foreground line-through"
                            : "text-foreground"
                        }
                      >
                        {e.action}
                      </span>
                    </li>
                  ))
              )}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function AlertsModule({ state }: { state: AgentState }) {
  if (state.alerts.length === 0) {
    return (
      <div className="flex w-full items-center justify-center text-sm text-muted-foreground">
        No alerts yet.
      </div>
    );
  }
  return (
    <ul className="grid w-full gap-2">
      {state.alerts.map((a) => (
        <li
          key={a.id}
          className="flex items-start gap-3 rounded-xl border border-border bg-background p-3"
        >
          <span
            className={`mt-1 size-2 shrink-0 rounded-full ${
              a.status === "outage"
                ? "bg-rose-500"
                : a.status === "degraded"
                  ? "bg-amber-500"
                  : a.status === "operational"
                    ? "bg-emerald-500"
                    : "bg-slate-400"
            }`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium capitalize text-foreground">
                {a.service}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                {a.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{a.message}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
