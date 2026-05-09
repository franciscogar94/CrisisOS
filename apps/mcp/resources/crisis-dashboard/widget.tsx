import { McpUseProvider, useWidget, type WidgetMetadata } from "mcp-use/react";
import React from "react";
import {
  crisisDashboardPropsSchema,
  type CrisisDashboardProps,
} from "../../src/lib/crisis/types";
import {
  SEVERITY_BG,
  SEVERITY_COLOR,
  SEVERITY_LABEL,
  SERVICE_STATUS_COLOR,
  SERVICE_STATUS_LABEL,
  TYPE_ICON,
  TYPE_LABEL,
  ZONE_ICON,
  ZONE_LABEL,
  checklistProgress,
  countCriticalResources,
  groupZonesByType,
  resourcePercent,
} from "../../src/lib/crisis/derive";
import { SAMPLE_CRISIS } from "../../src/lib/crisis/sample";

export const propSchema = crisisDashboardPropsSchema;

export type CrisisDashboardWidgetProps = CrisisDashboardProps;

export const widgetMetadata: WidgetMetadata = {
  description:
    "Render the Crisis Manager dashboard: header with severity badge, quick stats (radius, zones, critical resources, checklist progress), safe zones grouped by type, evacuation checklist, resource have/need bars, service alerts and a response timeline.",
  props: propSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: false,
    invoking: "Generando plan de respuesta…",
    invoked: "Plan listo",
  },
};

const PHASE_LABEL: Record<string, string> = {
  first_5_min: "Primeros 5 min",
  first_hour: "Primera hora",
  first_day: "Primer día",
  first_week: "Primera semana",
};

const PRIORITY_LABEL: Record<string, string> = {
  immediate: "Inmediato",
  "short-term": "Corto plazo",
  "long-term": "Largo plazo",
};

const PRIORITY_COLOR: Record<string, string> = {
  immediate: "#EF4444",
  "short-term": "#F59E0B",
  "long-term": "#3B82F6",
};

const CrisisDashboardWidget: React.FC = () => {
  const { props, isPending } = useWidget<CrisisDashboardWidgetProps>();

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <div className="p-6 text-sm text-neutral-500">
          Generando plan de respuesta…
        </div>
      </McpUseProvider>
    );
  }

  const data: CrisisDashboardProps = props?.crisis ? props : SAMPLE_CRISIS;

  return (
    <McpUseProvider autoSize>
      <div className="w-full p-4 text-neutral-900">
        <div className="grid gap-3">
          <Header data={data} />
          <QuickStats data={data} />
          <div className="grid gap-3 md:grid-cols-2">
            <SafeZones data={data} />
            <Checklist data={data} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Resources data={data} />
            <Alerts data={data} />
          </div>
          <Timeline data={data} />
        </div>
      </div>
    </McpUseProvider>
  );
};

export default CrisisDashboardWidget;

// ---------- Header ----------

function Header({ data }: { data: CrisisDashboardProps }) {
  const { crisis, weather } = data;
  const sev = crisis.severity;
  return (
    <div
      className="rounded-2xl border border-[#DBDBE5] bg-white p-5 shadow-sm"
      style={{ borderLeftWidth: 6, borderLeftColor: SEVERITY_COLOR[sev] }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="flex size-12 items-center justify-center rounded-xl"
          style={{ background: SEVERITY_BG[sev], fontSize: 28 }}
        >
          {TYPE_ICON[crisis.type]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold leading-tight text-neutral-900">
              {TYPE_LABEL[crisis.type]} · {crisis.location.name}
            </h1>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{ background: SEVERITY_BG[sev], color: SEVERITY_COLOR[sev] }}
            >
              Severidad {SEVERITY_LABEL[sev]}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-neutral-600">
            {crisis.title}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-neutral-500">
            <span>📐 Radio {crisis.affectedRadius} km</span>
            <span>
              📍 {crisis.location.lat.toFixed(3)}, {crisis.location.lng.toFixed(3)}
            </span>
            {weather ? (
              <span>
                🌡️ {weather.temperature.toFixed(1)}°C · 💨 {weather.windSpeed.toFixed(1)}
                {" "}km/h · {weather.description}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- QuickStats ----------

function QuickStats({ data }: { data: CrisisDashboardProps }) {
  const { safeZones, checklist, resources } = data;
  const progress = checklistProgress(checklist);
  const criticalRes = countCriticalResources(resources);

  const tiles = [
    {
      label: "zonas seguras",
      value: String(safeZones.length),
      meta: `${safeZones.filter((z) => z.status === "open").length} disponibles`,
      accent: "#3D92E8",
    },
    {
      label: "recursos críticos",
      value: String(criticalRes),
      meta: `${resources.length} categorías totales`,
      accent: "#EF4444",
    },
    {
      label: "checklist",
      value: `${progress.pct}%`,
      meta: `${progress.done}/${progress.total} completado`,
      accent: "#85ECCE",
    },
    {
      label: "radio afectado",
      value: `${data.crisis.affectedRadius} km`,
      meta: `${data.alerts.length} alertas activas`,
      accent: "#FFAC4D",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="rounded-xl border border-[#DBDBE5] bg-white p-4 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <span
              className="size-2 rounded-full"
              style={{ background: t.accent }}
              aria-hidden
            />
            <span
              className="text-[10px] uppercase tracking-wide text-neutral-500"
              style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}
            >
              {t.label}
            </span>
          </div>
          <div className="mt-2 truncate text-2xl font-semibold leading-tight">
            {t.value}
          </div>
          <div
            className="mt-1 truncate text-[11px] text-neutral-500"
            style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}
          >
            {t.meta}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- SafeZones ----------

function SafeZones({ data }: { data: CrisisDashboardProps }) {
  const groups = groupZonesByType(data.safeZones);
  const order: (keyof typeof ZONE_LABEL)[] = [
    "hospital",
    "shelter",
    "fire_station",
    "police",
    "assembly_point",
  ];

  return (
    <section className="rounded-xl border border-[#DBDBE5] bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-baseline justify-between">
        <span
          className="text-[10px] uppercase tracking-wide text-neutral-500"
          style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}
        >
          zonas seguras
        </span>
        <span
          className="text-[10px] uppercase tracking-wide text-neutral-500"
          style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}
        >
          {data.safeZones.length} ubicaciones
        </span>
      </header>
      <ul className="grid gap-2">
        {order
          .filter((k) => groups.has(k))
          .flatMap((k) => groups.get(k) ?? [])
          .map((z) => (
            <li
              key={z.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-[#EFEFF5] bg-[#FBFBFD] px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span style={{ fontSize: 16 }}>{ZONE_ICON[z.type]}</span>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-neutral-900">
                    {z.name}
                  </div>
                  <div
                    className="truncate text-[10px] text-neutral-500"
                    style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}
                  >
                    {ZONE_LABEL[z.type]}
                    {z.distance != null ? ` · ${z.distance} km` : ""}
                    {z.capacity ? ` · cap ${z.capacity}` : ""}
                  </div>
                </div>
              </div>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{
                  background:
                    z.status === "open"
                      ? "#D1FAE5"
                      : z.status === "full"
                        ? "#FEF3C7"
                        : "#FEE2E2",
                  color:
                    z.status === "open"
                      ? "#10B981"
                      : z.status === "full"
                        ? "#F59E0B"
                        : "#EF4444",
                }}
              >
                {z.status === "open" ? "abierta" : z.status === "full" ? "llena" : "cerrada"}
              </span>
            </li>
          ))}
      </ul>
    </section>
  );
}

// ---------- Checklist ----------

function Checklist({ data }: { data: CrisisDashboardProps }) {
  const grouped = new Map<string, typeof data.checklist>();
  for (const item of data.checklist) {
    const list = grouped.get(item.priority) ?? [];
    list.push(item);
    grouped.set(item.priority, list);
  }
  const order = ["immediate", "short-term", "long-term"];
  const progress = checklistProgress(data.checklist);

  return (
    <section className="rounded-xl border border-[#DBDBE5] bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-baseline justify-between">
        <span
          className="text-[10px] uppercase tracking-wide text-neutral-500"
          style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}
        >
          checklist de respuesta
        </span>
        <span
          className="text-[10px] uppercase tracking-wide text-neutral-500"
          style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}
        >
          {progress.done}/{progress.total} ({progress.pct}%)
        </span>
      </header>
      <div className="grid gap-3">
        {order
          .filter((p) => grouped.has(p))
          .map((p) => (
            <div key={p}>
              <div className="mb-1 flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ background: PRIORITY_COLOR[p] }}
                  aria-hidden
                />
                <span
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{
                    fontFamily: "ui-monospace, SFMono-Regular, monospace",
                    color: PRIORITY_COLOR[p],
                  }}
                >
                  {PRIORITY_LABEL[p]}
                </span>
              </div>
              <ul className="grid gap-1">
                {(grouped.get(p) ?? []).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-2 rounded-md px-1 py-0.5 text-[12px] text-neutral-800"
                  >
                    <span
                      className="mt-0.5 inline-flex size-3.5 items-center justify-center rounded border border-[#DBDBE5] bg-white"
                      aria-hidden
                    >
                      {item.checked ? "✓" : ""}
                    </span>
                    <span
                      className={item.checked ? "line-through text-neutral-400" : ""}
                    >
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    </section>
  );
}

// ---------- Resources ----------

function Resources({ data }: { data: CrisisDashboardProps }) {
  return (
    <section className="rounded-xl border border-[#DBDBE5] bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-baseline justify-between">
        <span
          className="text-[10px] uppercase tracking-wide text-neutral-500"
          style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}
        >
          recursos · have / need
        </span>
        <span
          className="text-[10px] uppercase tracking-wide text-neutral-500"
          style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}
        >
          {data.resources.length} categorías
        </span>
      </header>
      <ul className="grid gap-2">
        {data.resources.map((r) => {
          const pct = resourcePercent(r);
          const color = r.critical ? "#EF4444" : pct >= 70 ? "#10B981" : "#F59E0B";
          return (
            <li key={r.id} className="grid gap-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[12px] text-neutral-900">
                  {r.name}
                  {r.critical ? (
                    <span
                      className="ml-2 rounded-full bg-[#FEE2E2] px-1.5 py-0.5 text-[9px] font-semibold uppercase text-[#EF4444]"
                    >
                      crítico
                    </span>
                  ) : null}
                </span>
                <span
                  className="shrink-0 text-[11px] tabular-nums text-neutral-500"
                  style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}
                >
                  {r.have} / {r.need} {r.unit}
                </span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-[#F0F0F4]">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ---------- Alerts ----------

function Alerts({ data }: { data: CrisisDashboardProps }) {
  return (
    <section className="rounded-xl border border-[#DBDBE5] bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-baseline justify-between">
        <span
          className="text-[10px] uppercase tracking-wide text-neutral-500"
          style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}
        >
          alertas de servicios
        </span>
      </header>
      <ul className="grid gap-1.5">
        {data.alerts.map((a) => (
          <li
            key={a.id}
            className="flex items-start gap-2 rounded-md border border-[#EFEFF5] bg-[#FBFBFD] px-3 py-2"
          >
            <span
              className="mt-0.5 size-2 shrink-0 rounded-full"
              style={{ background: SERVICE_STATUS_COLOR[a.status] }}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[12px] font-medium uppercase tracking-wide text-neutral-700">
                  {a.service}
                </span>
                <span
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: SERVICE_STATUS_COLOR[a.status] }}
                >
                  {SERVICE_STATUS_LABEL[a.status]}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-neutral-600">
                {a.message}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------- Timeline ----------

function Timeline({ data }: { data: CrisisDashboardProps }) {
  const grouped = new Map<string, typeof data.timeline>();
  for (const e of data.timeline) {
    const list = grouped.get(e.phase) ?? [];
    list.push(e);
    grouped.set(e.phase, list);
  }
  const order = ["first_5_min", "first_hour", "first_day", "first_week"];

  return (
    <section className="rounded-xl border border-[#DBDBE5] bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-baseline justify-between">
        <span
          className="text-[10px] uppercase tracking-wide text-neutral-500"
          style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}
        >
          timeline de respuesta
        </span>
        <span
          className="text-[10px] uppercase tracking-wide text-neutral-500"
          style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}
        >
          {data.timeline.length} acciones
        </span>
      </header>
      <ol className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {order
          .filter((p) => grouped.has(p))
          .map((p, i) => (
            <li key={p} className="rounded-lg border border-[#EFEFF5] bg-[#FBFBFD] p-3">
              <div
                className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500"
                style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}
              >
                {`${i + 1}. ${PHASE_LABEL[p]}`}
              </div>
              <ul className="grid gap-1">
                {(grouped.get(p) ?? []).map((e) => (
                  <li key={e.id} className="text-[11px] leading-snug text-neutral-800">
                    • {e.action}
                  </li>
                ))}
              </ul>
            </li>
          ))}
      </ol>
    </section>
  );
}
