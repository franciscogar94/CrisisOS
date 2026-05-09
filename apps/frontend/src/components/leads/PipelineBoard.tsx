"use client";

import dynamic from "next/dynamic";
import type {
  ActiveModule,
  AgentState,
  CrisisSeverity,
  ServiceStatus,
} from "@/lib/leads/types";
import { EvacuationChecklist } from "@/components/leads/EvacuationChecklist";
import { ResourceTable } from "@/components/leads/ResourceTable";
import { Timeline } from "@/components/leads/Timeline";
import { AlertBanner } from "@/components/ui/alert-banner";
import { SeverityChip } from "@/components/ui/severity-chip";
import type { Severity } from "@/components/ui/severity-chip";
import { useLocale } from "@/lib/i18n/context";

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

const TABS: ReadonlyArray<{ id: ActiveModule; labelKey: string }> = [
  { id: "overview", labelKey: "tabs.overview" },
  { id: "map", labelKey: "tabs.map" },
  { id: "checklist", labelKey: "tabs.checklist" },
  { id: "resources", labelKey: "tabs.resources" },
  { id: "timeline", labelKey: "tabs.timeline" },
  { id: "alerts", labelKey: "tabs.alerts" },
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
  const { t } = useLocale();
  const counts = tabCounts(state);
  return (
    <div className="flex min-h-0 flex-1 flex-col border border-line bg-bg-2">
      <nav
        role="tablist"
        className="flex h-12 shrink-0 items-center gap-1 overflow-x-auto whitespace-nowrap border-b border-line bg-bg-2/80 px-3 sm:px-5"
      >
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          const count = counts[tab.id];
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onModuleChange(tab.id)}
              className={`shrink-0 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.12em] transition border-b-2 ${
                isActive
                  ? "border-brand text-txt-hi"
                  : "border-transparent text-txt-low hover:text-txt-mid"
              }`}
            >
              {t(tab.labelKey)}
              {count ? <span className={`ml-1.5 ${count.tone}`}>{count.label}</span> : null}
            </button>
          );
        })}
      </nav>
      <div className={`flex min-h-0 flex-1 ${active === "map" ? "" : "overflow-auto p-3 sm:p-5"}`}>
        {active === "overview" ? (
          <OverviewModule state={state} />
        ) : active === "map" ? (
          <CrisisMap
            crisis={state.crisis}
            safeZones={state.safeZones}
            highlightedZoneIds={state.highlightedZoneIds}
            selectedZoneId={state.selectedZoneId}
            onSelectZone={onSelectZone}
            affectedCount={null}
            evacuatedCount={null}
            shelteredCount={state.safeZones.filter((z) => z.status === "open").length}
            etaStable={null}
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
          <Timeline entries={state.timeline} onToggle={onToggleTimelineEntry} />
        ) : active === "alerts" ? (
          <AlertsModule state={state} />
        ) : null}
      </div>
    </div>
  );
}

function MapPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center text-sm text-txt-low">
      …
    </div>
  );
}

function tabCounts(state: AgentState): Record<ActiveModule, { label: string; tone: string } | null> {
  const checklistDone = state.checklist.filter((i) => i.checked).length;
  const checklistTotal = state.checklist.length;
  const resourceTotal = state.resources.length;
  const alertCritical = state.alerts.filter((a) => a.status === "outage").length;
  const alertTotal = state.alerts.length;
  return {
    overview: null,
    map: null,
    checklist: checklistTotal
      ? {
          label: `${checklistDone}/${checklistTotal}`,
          tone: "text-emerald-700 dark:text-emerald-400",
        }
      : null,
    resources: resourceTotal ? { label: String(resourceTotal), tone: "text-txt-low" } : null,
    timeline: null,
    alerts: alertTotal
      ? {
          label: String(alertTotal),
          tone: alertCritical
            ? "text-red-700 dark:text-red-400"
            : "text-txt-low",
        }
      : null,
  };
}

function OverviewModule({ state }: { state: AgentState }) {
  const { t } = useLocale();
  if (!state.crisis) {
    return (
      <div className="flex w-full items-center justify-center py-16 text-center">
        <div>
          <p className="text-base font-medium text-txt-hi">{t("empty.title")}</p>
          <p className="mt-1 text-sm text-txt-mid">{t("empty.body")}</p>
        </div>
      </div>
    );
  }
  const { crisis, safeZones, alerts, checklist, resources } = state;
  const openZones = safeZones.filter((z) => z.status === "open");
  const outageAlerts = alerts.filter((a) => a.status === "outage");
  const checklistDone = checklist.filter((i) => i.checked).length;
  const criticalRes = resources.filter((r) => r.critical && r.have < r.need).length;
  return (
    <div className="grid w-full auto-rows-min gap-4 lg:grid-cols-3">
      <div className="border border-line bg-bg p-4 lg:col-span-2">
        <div className="flex items-start justify-between gap-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-txt-low">
            // SITUATION
          </div>
          <SeverityChip severity={mapSeverity(crisis.severity)} />
        </div>
        <h3 className="mt-2 text-lg font-semibold text-txt-hi">{crisis.title}</h3>
        <p className="mt-2 text-sm text-txt-mid">{crisis.description}</p>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs">
          <dt className="text-txt-low">{t("overview.field.type")}</dt>
          <dd className="text-txt-hi">{t(`type.${crisis.type}`)}</dd>
          <dt className="text-txt-low">{t("overview.field.severity")}</dt>
          <dd className="text-txt-hi">{t(`severity.${crisis.severity}`)}</dd>
          <dt className="text-txt-low">{t("overview.field.radius")}</dt>
          <dd className="text-txt-hi">{t("common.km", { n: crisis.affectedRadius })}</dd>
          <dt className="text-txt-low">{t("overview.field.reported")}</dt>
          <dd className="text-txt-hi">{new Date(crisis.timestamp).toLocaleString()}</dd>
        </dl>
      </div>
      <div className="grid grid-cols-2 gap-2 self-start">
        <KPI
          label="ZONES OPEN"
          value={String(openZones.length)}
          tone="text-emerald-700 dark:text-emerald-400"
        />
        <KPI
          label="CHECKLIST"
          value={`${checklistDone}/${checklist.length}`}
          tone="text-brand"
        />
        <KPI
          label="OUTAGES"
          value={String(outageAlerts.length)}
          tone="text-red-700 dark:text-red-400"
        />
        <KPI
          label="CRITICAL RES"
          value={String(criticalRes)}
          tone="text-amber-700 dark:text-amber-400"
        />
      </div>

      <div className="border border-line bg-bg p-4 lg:col-span-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-txt-low">
          // ACTIVE ALERTS
        </div>
        {alerts.length === 0 ? (
          <p className="mt-2 text-sm text-txt-low">{t("common.no_data")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {alerts.slice(0, 4).map((a) => (
              <AlertBanner
                key={a.id}
                severity={alertSeverity(a.status)}
                title={t(`service.${a.service}`)}
                body={a.message}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="border border-line bg-bg p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-txt-low">
          // SAFE ZONES
        </div>
        {openZones.length === 0 ? (
          <p className="mt-2 text-sm text-txt-low">{t("common.no_data")}</p>
        ) : (
          <ul className="mt-2 grid gap-1">
            {openZones.slice(0, 6).map((z) => (
              <li
                key={z.id}
                className="flex items-center justify-between border-b border-line py-1.5 text-xs last:border-0"
              >
                <span className="flex items-center gap-2">
                  <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
                  <span className="text-txt-hi">{z.name}</span>
                </span>
                {z.distance != null ? (
                  <span className="font-mono text-txt-low">{z.distance.toFixed(1)}km</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function KPI({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="border border-line bg-bg p-3 font-mono">
      <div className="text-[10px] tracking-[0.2em] text-txt-low">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${tone}`}>{value}</div>
    </div>
  );
}

function AlertsModule({ state }: { state: AgentState }) {
  const { t } = useLocale();
  if (state.alerts.length === 0) {
    return (
      <div className="flex w-full items-center justify-center text-sm text-txt-low">—</div>
    );
  }
  return (
    <ul className="grid w-full auto-rows-min gap-2">
      {state.alerts.map((a) => (
        <AlertBanner
          key={a.id}
          severity={alertSeverity(a.status)}
          label={t(`service_status.${a.status}`).toUpperCase()}
          title={t(`service.${a.service}`)}
          body={a.message}
        />
      ))}
    </ul>
  );
}

function alertSeverity(status: ServiceStatus): Severity {
  if (status === "outage") return "critical";
  if (status === "degraded") return "high";
  if (status === "operational") return "safe";
  return "info";
}

function mapSeverity(s: CrisisSeverity): Severity {
  if (s === "critical") return "critical";
  if (s === "high") return "high";
  if (s === "moderate") return "info";
  return "safe";
}
