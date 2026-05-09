"use client";

import type { MockScenarioId } from "@/lib/leads/mock";
import { useLocale } from "@/lib/i18n/context";

const SCENARIO_IDS: MockScenarioId[] = ["earthquake", "flood", "wildfire"];

type Props =
  | { active: false; onLoad: (id: MockScenarioId) => void; onClear?: never }
  | { active: true; onLoad?: never; onClear: () => void };

export function MockControls(props: Props) {
  const { t } = useLocale();
  if (props.active) {
    return (
      <div className="flex items-center gap-2 rounded-sm border border-amber-500/40 bg-amber-50 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
        <span className="font-semibold">{t("mock.loaded")}</span>
        <button
          type="button"
          onClick={props.onClear}
          className="ml-2 rounded-sm border border-amber-500/40 bg-amber-100 px-2 py-0.5 font-semibold text-amber-900 hover:bg-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/20"
        >
          {t("mock.clear")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-txt-low">
        {t("mock.label")}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {SCENARIO_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => props.onLoad(id)}
            className="rounded-sm border border-line bg-bg-2 px-3 py-1.5 text-sm font-medium text-txt-mid transition hover:border-brand hover:text-txt-hi"
          >
            {t(`mock.scenario.${id}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
