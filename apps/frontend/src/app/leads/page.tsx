"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { z } from "zod";
import { Toaster } from "sonner";
import {
  CopilotChatConfigurationProvider,
  useAgent,
  useConfigureSuggestions,
  useDefaultRenderTool,
  useFrontendTool,
} from "@copilotkit/react-core/v2";
import type {
  ActiveModule,
  AgentState,
  ChecklistItem,
  Crisis,
  CrisisSeverity,
  CrisisType,
  Resource,
  SafeZone,
  ServiceAlert,
  TimelineEntry,
  WeatherData,
} from "@/lib/leads/types";
import { initialState } from "@/lib/leads/state";
import { mockScenariosByLocale, type MockScenarioId } from "@/lib/leads/mock";
import { useLocale } from "@/lib/i18n/context";
import { Header } from "@/components/leads/Header";
import { ChatPanel } from "@/components/leads/ChatPanel";
import { WorkshopDemand } from "@/components/leads/WorkshopDemand";
import { PipelineBoard } from "@/components/leads/PipelineBoard";
import { LeadMiniCard } from "@/components/leads/inline/LeadMiniCard";
import { EmailDraftCard } from "@/components/leads/inline/EmailDraftCard";
import { MockControls } from "@/components/leads/MockControls";
import { ToolFallbackCard } from "@/components/copilot/ToolFallbackCard";

const MOCK_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_MOCK === "1" ||
  process.env.NODE_ENV === "development";

const MockOverrideContext = createContext<{
  mockOverride: AgentState | null;
  setMockOverride: Dispatch<SetStateAction<AgentState | null>>;
} | null>(null);

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <>{children}</>;
}

const severityShape = z.enum(["low", "moderate", "high", "critical"]);
const crisisTypeShape = z.enum([
  "earthquake",
  "flood",
  "fire",
  "hurricane",
  "tornado",
  "tsunami",
  "chemical",
  "other",
]);
const safeZoneTypeShape = z.enum([
  "shelter",
  "hospital",
  "fire_station",
  "police",
  "assembly_point",
]);
const safeZoneStatusShape = z.enum(["open", "full", "closed"]);
const checklistPriorityShape = z.enum(["immediate", "short-term", "long-term"]);
const resourceCategoryShape = z.enum([
  "water",
  "food",
  "medical",
  "shelter",
  "communication",
  "transport",
  "tools",
]);
const serviceTypeShape = z.enum([
  "water",
  "electricity",
  "gas",
  "communications",
  "internet",
  "transport",
]);
const serviceStatusShape = z.enum([
  "operational",
  "degraded",
  "outage",
  "unknown",
]);
const timelinePhaseShape = z.enum([
  "first_5_min",
  "first_hour",
  "first_day",
  "first_week",
]);
const moduleShape = z.enum([
  "overview",
  "map",
  "checklist",
  "resources",
  "timeline",
  "alerts",
]);

const geoShape = z.object({
  lat: z.number(),
  lng: z.number(),
  name: z.string().optional(),
});

const crisisShape = z.object({
  id: z.string(),
  type: crisisTypeShape,
  severity: severityShape,
  title: z.string(),
  description: z.string().default(""),
  location: geoShape,
  affectedRadius: z.number().default(0),
  timestamp: z.string(),
  updatedAt: z.string().optional(),
});

const safeZoneShape = z.object({
  id: z.string(),
  name: z.string(),
  type: safeZoneTypeShape,
  location: geoShape,
  capacity: z.number().optional(),
  status: safeZoneStatusShape.default("open"),
  distance: z.number().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

const checklistItemShape = z.object({
  id: z.string(),
  text: z.string(),
  checked: z.boolean().default(false),
  priority: checklistPriorityShape,
  category: z.string().default(""),
});

const resourceShape = z.object({
  id: z.string(),
  name: z.string(),
  category: resourceCategoryShape,
  have: z.number().default(0),
  need: z.number().default(0),
  unit: z.string().default("units"),
  critical: z.boolean().default(false),
});

const alertShape = z.object({
  id: z.string(),
  service: serviceTypeShape,
  status: serviceStatusShape,
  message: z.string(),
  updatedAt: z.string(),
});

const timelineShape = z.object({
  id: z.string(),
  phase: timelinePhaseShape,
  action: z.string(),
  completed: z.boolean().default(false),
  order: z.number().default(0),
});

const weatherShape = z.object({
  temperature: z.number(),
  windSpeed: z.number(),
  humidity: z.number(),
  description: z.string(),
  alerts: z.array(z.string()).default([]),
});

function mergeAgentState(raw: unknown): AgentState {
  const partial =
    raw && typeof raw === "object" ? (raw as Partial<AgentState>) : {};
  return {
    ...initialState,
    ...partial,
    crisis: partial.crisis ?? null,
    safeZones: partial.safeZones ?? [],
    checklist: partial.checklist ?? [],
    resources: partial.resources ?? [],
    alerts: partial.alerts ?? [],
    timeline: partial.timeline ?? [],
    weather: partial.weather ?? null,
    filter: { ...initialState.filter, ...(partial.filter ?? {}) },
    header: { ...initialState.header, ...(partial.header ?? {}) },
    highlightedZoneIds: partial.highlightedZoneIds ?? [],
    selectedZoneId: partial.selectedZoneId ?? null,
    activeModule: partial.activeModule ?? "overview",
  };
}

function useLiveAgentState() {
  const { agent } = useAgent();
  const ctx = useContext(MockOverrideContext);
  const mockOverride = ctx?.mockOverride ?? null;
  const setMockOverride = ctx?.setMockOverride;
  const baseState = mergeAgentState(agent?.state);
  const state = mockOverride ?? baseState;
  const setState = (updater: (prev: AgentState) => AgentState) => {
    if (mockOverride !== null && setMockOverride) {
      setMockOverride((prev) => updater(prev ?? mockOverride));
      return;
    }
    agent?.setState(updater(mergeAgentState(agent?.state)));
  };
  return { agent, state, setState };
}

function CanvasInner() {
  const [mockOverride, setMockOverride] = useState<AgentState | null>(null);
  const mockCtx = useMemo(
    () => ({ mockOverride, setMockOverride }),
    [mockOverride],
  );
  return (
    <MockOverrideContext.Provider value={mockCtx}>
      <CanvasBody />
    </MockOverrideContext.Provider>
  );
}

function CanvasBody() {
  const { agent, state, setState } = useLiveAgentState();
  const mockCtx = useContext(MockOverrideContext);
  const mockOverride = mockCtx?.mockOverride ?? null;
  const setMockOverride = mockCtx?.setMockOverride;
  const { t, locale } = useLocale();

  // Auto-clear mock when the agent emits a real (non-mock) crisis.
  useEffect(() => {
    if (!mockOverride || !setMockOverride) return;
    const real = mergeAgentState(agent?.state);
    if (real.crisis && !real.crisis.id.startsWith("mock:")) {
      setMockOverride(null);
    }
  }, [agent?.state, mockOverride, setMockOverride]);

  // When the locale toggles while mock is active, swap to the matching
  // language fixture so demo content follows the UI chrome.
  useEffect(() => {
    if (!mockOverride || !setMockOverride) return;
    const id = mockOverride.crisis?.id;
    if (!id) return;
    const scenarioId: MockScenarioId | null = id.includes("eq")
      ? "earthquake"
      : id.includes("fl")
        ? "flood"
        : id.includes("wf")
          ? "wildfire"
          : null;
    if (!scenarioId) return;
    const next = mockScenariosByLocale[locale][scenarioId];
    if (next !== mockOverride) setMockOverride(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  useConfigureSuggestions({
    suggestions: [
      { title: t("suggestion.eq.title"), message: t("suggestion.eq.message") },
      { title: t("suggestion.flood.title"), message: t("suggestion.flood.message") },
      { title: t("suggestion.wildfire.title"), message: t("suggestion.wildfire.message") },
      { title: t("suggestion.checklist.title"), message: t("suggestion.checklist.message") },
    ],
  });

  // ── Header ─────────────────────────────────────────────
  useFrontendTool({
    name: "setHeader",
    description: "Set the workspace header (title and subtitle).",
    parameters: z.object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
    }),
    handler: async ({ title, subtitle }) => {
      setState((prev) => ({
        ...prev,
        header: {
          title: title ?? prev.header.title,
          subtitle: subtitle ?? prev.header.subtitle,
        },
      }));
      return "header updated";
    },
  });

  // ── Crisis ─────────────────────────────────────────────
  useFrontendTool({
    name: "setCrisis",
    description:
      "Set the active crisis (type, severity, location, description, affected radius).",
    parameters: z.object({ crisis: crisisShape }),
    handler: async ({ crisis }) => {
      setState((prev) => ({ ...prev, crisis: crisis as Crisis }));
      return "crisis set";
    },
  });

  // ── Safe zones ─────────────────────────────────────────
  useFrontendTool({
    name: "setSafeZones",
    description: "Replace the safe zone list (shelters, hospitals, fire stations).",
    parameters: z.object({ zones: z.array(safeZoneShape) }),
    handler: async ({ zones }) => {
      setState((prev) => ({ ...prev, safeZones: zones as SafeZone[] }));
      return `${zones.length} zones set`;
    },
  });

  useFrontendTool({
    name: "highlightZones",
    description: "Visually highlight specific safe zones by id.",
    parameters: z.object({ zoneIds: z.array(z.string()).default([]) }),
    handler: async ({ zoneIds }) => {
      setState((prev) => ({ ...prev, highlightedZoneIds: zoneIds }));
      return "highlights updated";
    },
  });

  useFrontendTool({
    name: "selectZone",
    description: "Open or close the detail view for a specific safe zone.",
    parameters: z.object({ zoneId: z.string().nullable() }),
    handler: async ({ zoneId }) => {
      setState((prev) => ({ ...prev, selectedZoneId: zoneId }));
      return "selection updated";
    },
  });

  // ── Checklist ──────────────────────────────────────────
  useFrontendTool({
    name: "setChecklist",
    description:
      "Replace the evacuation/preparedness checklist (items grouped by priority).",
    parameters: z.object({ items: z.array(checklistItemShape) }),
    handler: async ({ items }) => {
      setState((prev) => ({ ...prev, checklist: items }));
      return `${items.length} checklist items set`;
    },
  });

  useFrontendTool({
    name: "toggleChecklistItem",
    description: "Toggle a checklist item between checked and unchecked.",
    parameters: z.object({ itemId: z.string() }),
    handler: async ({ itemId }) => {
      setState((prev) => {
        const idx = prev.checklist.findIndex((i) => i.id === itemId);
        if (idx < 0) return prev;
        const next = prev.checklist.slice();
        next[idx] = { ...next[idx], checked: !next[idx].checked };
        return { ...prev, checklist: next };
      });
      return "toggled";
    },
  });

  // ── Resources ──────────────────────────────────────────
  useFrontendTool({
    name: "setResources",
    description: "Replace the resource inventory (have/need per item).",
    parameters: z.object({ resources: z.array(resourceShape) }),
    handler: async ({ resources }) => {
      setState((prev) => ({ ...prev, resources: resources as Resource[] }));
      return `${resources.length} resources set`;
    },
  });

  useFrontendTool({
    name: "updateResource",
    description: "Update the 'have' count of a resource.",
    parameters: z.object({
      resourceId: z.string(),
      have: z.number(),
    }),
    handler: async ({ resourceId, have }) => {
      setState((prev) => {
        const idx = prev.resources.findIndex((r) => r.id === resourceId);
        if (idx < 0) return prev;
        const next = prev.resources.slice();
        next[idx] = { ...next[idx], have };
        return { ...prev, resources: next };
      });
      return "resource updated";
    },
  });

  // ── Alerts ─────────────────────────────────────────────
  useFrontendTool({
    name: "setAlerts",
    description: "Replace the service-status alerts (water, power, gas, etc.).",
    parameters: z.object({ alerts: z.array(alertShape) }),
    handler: async ({ alerts }) => {
      setState((prev) => ({ ...prev, alerts: alerts as ServiceAlert[] }));
      return `${alerts.length} alerts set`;
    },
  });

  // ── Timeline ───────────────────────────────────────────
  useFrontendTool({
    name: "setTimeline",
    description: "Replace the action timeline (5-min, 1-hour, 1-day, 1-week phases).",
    parameters: z.object({ entries: z.array(timelineShape) }),
    handler: async ({ entries }) => {
      setState((prev) => ({ ...prev, timeline: entries as TimelineEntry[] }));
      return `${entries.length} timeline entries set`;
    },
  });

  useFrontendTool({
    name: "toggleTimelineEntry",
    description: "Toggle whether a timeline action is completed.",
    parameters: z.object({ entryId: z.string() }),
    handler: async ({ entryId }) => {
      setState((prev) => {
        const idx = prev.timeline.findIndex((e) => e.id === entryId);
        if (idx < 0) return prev;
        const next = prev.timeline.slice();
        next[idx] = { ...next[idx], completed: !next[idx].completed };
        return { ...prev, timeline: next };
      });
      return "toggled";
    },
  });

  // ── Weather ────────────────────────────────────────────
  useFrontendTool({
    name: "setWeather",
    description: "Set current weather conditions for the crisis location.",
    parameters: z.object({ weather: weatherShape }),
    handler: async ({ weather }) => {
      setState((prev) => ({ ...prev, weather: weather as WeatherData }));
      return "weather set";
    },
  });

  // ── Module navigation ──────────────────────────────────
  useFrontendTool({
    name: "setActiveModule",
    description:
      "Switch the visible canvas module (overview/map/checklist/resources/timeline/alerts).",
    parameters: z.object({ module: moduleShape }),
    handler: async ({ module }) => {
      setState((prev) => ({ ...prev, activeModule: module as ActiveModule }));
      return "module switched";
    },
  });

  // ── Inline render tools ────────────────────────────────
  useFrontendTool({
    name: "renderCrisisMiniCard",
    description: "Render an inline summary card of the active crisis in the chat.",
    parameters: z.object({
      title: z.string(),
      type: crisisTypeShape,
      severity: severityShape,
      locationName: z.string().optional(),
      affectedRadius: z.number().optional(),
    }),
    render: ({ args }) => (
      <LeadMiniCard
        title={args.title ?? "Crisis"}
        type={(args.type ?? "other") as CrisisType}
        severity={(args.severity ?? "moderate") as CrisisSeverity}
        locationName={args.locationName}
        affectedRadius={args.affectedRadius}
        onOpenCanvas={() =>
          setState((prev) => ({ ...prev, activeModule: "overview" }))
        }
      />
    ),
  });

  useFrontendTool({
    name: "renderResourceStatus",
    description: "Render an inline resource coverage bar chart in the chat.",
    parameters: z.object({}),
    render: () => <LiveResourceBars />,
  });

  useFrontendTool({
    name: "renderEvacChecklist",
    description:
      "Render an inline evacuation checklist for human-in-the-loop confirmation.",
    parameters: z.object({
      items: z.array(checklistItemShape),
      title: z.string().optional(),
    }),
    render: ({ args }) => (
      <EmailDraftCard
        items={(args.items ?? []) as ChecklistItem[]}
        title={args.title}
        onConfirm={(checkedIds) => {
          setState((prev) => {
            const set = new Set(checkedIds);
            const next = prev.checklist.slice();
            for (const item of args.items ?? []) {
              const existing = next.findIndex((i) => i.id === item.id);
              const merged = { ...item, checked: set.has(item.id) };
              if (existing >= 0) next[existing] = merged;
              else next.push(merged);
            }
            return { ...prev, checklist: next };
          });
        }}
      />
    ),
  });

  useDefaultRenderTool({
    render: ({ name, status, parameters, result }) => (
      <ToolFallbackCard
        name={name}
        status={status}
        parameters={parameters}
        result={result}
      />
    ),
  });

  function setActiveModule(module: ActiveModule) {
    setState((prev) => ({ ...prev, activeModule: module }));
  }
  function selectZone(zoneId: string | null) {
    setState((prev) => ({ ...prev, selectedZoneId: zoneId }));
  }
  function toggleChecklistItem(itemId: string) {
    setState((prev) => {
      const idx = prev.checklist.findIndex((i) => i.id === itemId);
      if (idx < 0) return prev;
      const next = prev.checklist.slice();
      next[idx] = { ...next[idx], checked: !next[idx].checked };
      return { ...prev, checklist: next };
    });
  }
  function updateResourceLocal(resourceId: string, have: number) {
    setState((prev) => {
      const idx = prev.resources.findIndex((r) => r.id === resourceId);
      if (idx < 0) return prev;
      const next = prev.resources.slice();
      next[idx] = { ...next[idx], have };
      return { ...prev, resources: next };
    });
  }
  function toggleTimelineEntry(entryId: string) {
    setState((prev) => {
      const idx = prev.timeline.findIndex((e) => e.id === entryId);
      if (idx < 0) return prev;
      const next = prev.timeline.slice();
      next[idx] = { ...next[idx], completed: !next[idx].completed };
      return { ...prev, timeline: next };
    });
  }

  const mockActive = mockOverride !== null;
  const loadMock = (id: MockScenarioId) => {
    setMockOverride?.(mockScenariosByLocale[locale][id]);
  };
  const clearMock = () => {
    setMockOverride?.(null);
  };

  return (
    <>
      <main className="flex h-screen flex-col bg-bg">
        <Header
          title={state.header.title}
          subtitle={
            state.crisis === null && state.header.subtitle === initialState.header.subtitle
              ? t("header.subtitle")
              : state.header.subtitle
          }
          crisis={state.crisis}
          weatherTemp={state.weather?.temperature ?? null}
          weatherDesc={state.weather?.description ?? null}
        />

        {MOCK_ENABLED && mockActive ? (
          <div className="flex justify-end border-b border-line bg-bg-2 px-5 py-1.5">
            <MockControls active onClear={clearMock} />
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1">
          <ChatPanel />
          <section className="flex min-h-0 flex-1 flex-col">
            {state.crisis === null ? (
              <EmptyCanvas onLoadMock={MOCK_ENABLED ? loadMock : undefined} />
            ) : (
              <PipelineBoard
                state={state}
                onModuleChange={setActiveModule}
                onSelectZone={selectZone}
                onToggleChecklistItem={toggleChecklistItem}
                onUpdateResource={updateResourceLocal}
                onToggleTimelineEntry={toggleTimelineEntry}
              />
            )}
          </section>
        </div>
      </main>

      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            error: "!bg-red-950 !text-red-200 !border !border-red-500/40",
          },
        }}
      />
    </>
  );
}

function EmptyCanvas({ onLoadMock }: { onLoadMock?: (id: MockScenarioId) => void }) {
  const { t } = useLocale();
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-bg">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative max-w-md text-center">
        <div className="mx-auto mb-6 flex size-16 rotate-45 items-center justify-center border-2 border-line-strong">
          <div className="size-6 bg-line-strong" />
        </div>
        <div className="font-mono text-[11px] tracking-[0.3em] text-txt-low">
          // AWAITING INPUT
        </div>
        <h2 className="mt-2 mb-3 text-2xl font-bold text-txt-hi">{t("empty.title")}</h2>
        <p className="text-sm leading-relaxed text-txt-mid">{t("empty.body")}</p>
        <div className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] text-txt-low">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
          <span>focus chat</span>
        </div>
        {onLoadMock ? (
          <div className="mt-8">
            <MockControls active={false} onLoad={onLoadMock} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-sm border border-line border-b-2 px-1.5 py-0.5 text-txt-mid">
      {children}
    </span>
  );
}

function LiveResourceBars() {
  const { state } = useLiveAgentState();
  return (
    <div className="my-2">
      <WorkshopDemand resources={state.resources} compact />
    </div>
  );
}

function HomePage() {
  const [threadId] = useState<string | undefined>(undefined);
  return (
    <CopilotChatConfigurationProvider agentId="default" threadId={threadId}>
      <CanvasInner />
    </CopilotChatConfigurationProvider>
  );
}

export default function Page() {
  return (
    <ClientOnly>
      <HomePage />
    </ClientOnly>
  );
}
