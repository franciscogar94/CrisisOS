"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import { mockScenariosByLocale, type MockScenarioId } from "@/lib/leads/mock";
import { useLocale } from "@/lib/i18n/context";
import { LocaleToggle } from "@/components/LocaleToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LeadMiniCard } from "@/components/leads/inline/LeadMiniCard";
import { EmailDraftCard } from "@/components/leads/inline/EmailDraftCard";
import { ResourceTable } from "@/components/leads/ResourceTable";
import { WorkshopDemand } from "@/components/leads/WorkshopDemand";
import { EvacuationChecklist } from "@/components/leads/EvacuationChecklist";
import { Timeline } from "@/components/leads/Timeline";
import { QuickStats } from "@/components/leads/QuickStats";
import { StatusDonut } from "@/components/leads/StatusDonut";
import type { ChecklistItem, Resource, TimelineEntry } from "@/lib/leads/types";

const CrisisMap = dynamic(
  () => import("@/components/leads/CrisisMap").then((m) => m.CrisisMap),
  { ssr: false, loading: () => <MapSkeleton /> },
);

const SCENARIOS: MockScenarioId[] = ["earthquake", "flood", "wildfire"];

export default function ShowcasePage() {
  const { locale } = useLocale();
  const [scenarioId, setScenarioId] = useState<MockScenarioId>("earthquake");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const scenario = useMemo(
    () => mockScenariosByLocale[locale][scenarioId],
    [locale, scenarioId],
  );

  const [checklist, setChecklist] = useState<ChecklistItem[]>(scenario.checklist);
  const [resources, setResources] = useState<Resource[]>(scenario.resources);
  const [timeline, setTimeline] = useState<TimelineEntry[]>(scenario.timeline);

  useEffect(() => {
    setChecklist(scenario.checklist);
    setResources(scenario.resources);
    setTimeline(scenario.timeline);
  }, [scenario]);

  function toggleChecklist(id: string) {
    setChecklist((prev) =>
      prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
    );
  }
  function updateResource(id: string, have: number) {
    setResources((prev) => prev.map((r) => (r.id === id ? { ...r, have } : r)));
  }
  function toggleTimeline(id: string) {
    setTimeline((prev) =>
      prev.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e)),
    );
  }

  if (!mounted) return null;

  return (
    <div className="min-h-[100dvh] bg-bg text-txt-hi">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-bg-2/95 px-5 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link
            href="/leads"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-txt-low transition hover:text-txt-hi"
          >
            <ArrowLeft className="size-4" />
            <span>/leads</span>
          </Link>
          <span className="font-mono text-xs tracking-[0.24em] text-txt-mid">
            // SHOWCASE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LocaleToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            CrisisOS Component Showcase
          </h1>
          <p className="mt-2 text-sm text-txt-mid">
            Generative UI surfaces in isolation. Switch scenario + locale to inspect
            how components react to different crisis shapes.
          </p>
          <div className="mt-4 inline-flex border border-line">
            {SCENARIOS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setScenarioId(id)}
                className={[
                  "px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] transition",
                  scenarioId === id
                    ? "bg-brand text-black"
                    : "text-txt-mid hover:text-txt-hi",
                ].join(" ")}
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        <Section
          title="LeadMiniCard"
          caption="Inline card rendered in chat when agent calls renderCrisisMiniCard."
        >
          <div className="max-w-md">
            <LeadMiniCard
              title={scenario.crisis?.title ?? ""}
              type={scenario.crisis?.type ?? "other"}
              severity={scenario.crisis?.severity ?? "moderate"}
              locationName={scenario.crisis?.location.name}
              affectedRadius={scenario.crisis?.affectedRadius}
              onOpenCanvas={() => {}}
            />
          </div>
        </Section>

        <Section
          title="EmailDraftCard (renderEvacChecklist)"
          caption="Human-in-the-loop confirmation card. Toggle items, then confirm or cancel."
        >
          <div className="max-w-lg">
            <EmailDraftCard
              items={checklist.slice(0, 5)}
              onConfirm={(ids) => console.info("confirmed", ids)}
              onCancel={() => console.info("cancelled")}
            />
          </div>
        </Section>

        <Section title="QuickStats" caption="Top-strip KPIs: zones, checklist, resources, alerts.">
          <QuickStats state={{ ...scenario }} />
        </Section>

        <Section title="StatusDonut" caption="Radial progress for checklist completion.">
          <div className="max-w-xs">
            <StatusDonut checklist={checklist} />
          </div>
        </Section>

        <Section title="CrisisMap" caption="Leaflet map with crisis epicenter + safe zones.">
          <div className="h-[420px] overflow-hidden border border-line">
            <CrisisMap
              crisis={scenario.crisis}
              safeZones={scenario.safeZones}
              highlightedZoneIds={scenario.highlightedZoneIds}
              selectedZoneId={scenario.selectedZoneId}
            />
          </div>
        </Section>

        <Section title="EvacuationChecklist" caption="Grouped by priority. Click to toggle.">
          <EvacuationChecklist items={checklist} onToggle={toggleChecklist} />
        </Section>

        <Section title="ResourceTable" caption="Have / need / gap with inline editing.">
          <ResourceTable resources={resources} onUpdateHave={updateResource} />
        </Section>

        <Section title="WorkshopDemand" caption="Coverage bars per resource.">
          <WorkshopDemand resources={resources} />
        </Section>

        <Section title="Timeline" caption="Phased actions: 5min / 1hr / 1day / 1week.">
          <Timeline entries={timeline} onToggle={toggleTimeline} />
        </Section>

        <footer className="mt-12 border-t border-line py-6 font-mono text-[11px] text-txt-low">
          // crisisos · component showcase · scenario={scenarioId} · locale={locale}
        </footer>
      </main>
    </div>
  );
}

function Section({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10 border-t border-line pt-6">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="font-mono text-sm uppercase tracking-[0.2em] text-txt-hi">
          {title}
        </h2>
        <span className="text-xs text-txt-low">{caption}</span>
      </div>
      {children}
    </section>
  );
}

function MapSkeleton() {
  return (
    <div className="flex h-[420px] items-center justify-center border border-line bg-bg-2 font-mono text-xs text-txt-low">
      loading map…
    </div>
  );
}
