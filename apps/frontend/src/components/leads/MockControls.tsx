"use client";

import { mockScenarioLabels, type MockScenarioId } from "@/lib/leads/mock";

const SCENARIO_IDS: MockScenarioId[] = ["earthquake", "flood", "wildfire"];

type Props =
  | { active: false; onLoad: (id: MockScenarioId) => void; onClear?: never }
  | { active: true; onLoad?: never; onClear: () => void };

export function MockControls(props: Props) {
  if (props.active) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs text-amber-900">
        <span className="font-medium">Demo data loaded</span>
        <button
          type="button"
          onClick={props.onClear}
          className="ml-2 rounded border border-amber-400 bg-white px-2 py-0.5 font-medium text-amber-900 hover:bg-amber-100"
        >
          Clear demo
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        Dev-only demo data
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {SCENARIO_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => props.onLoad(id)}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            {mockScenarioLabels[id]}
          </button>
        ))}
      </div>
    </div>
  );
}
