import type { AgentState, CrisisFilter } from "./types";

export const emptyFilter: CrisisFilter = {
  resourceCategories: [],
  checklistPriorities: [],
  safeZoneTypes: [],
  search: "",
};

export const initialState: AgentState = {
  crisis: null,
  safeZones: [],
  checklist: [],
  resources: [],
  alerts: [],
  timeline: [],
  weather: null,
  filter: emptyFilter,
  highlightedZoneIds: [],
  selectedZoneId: null,
  header: {
    title: "CrisisOS",
    subtitle: "Describe an emergency to generate your operations center",
  },
  activeModule: "overview",
};

export function isFilterEmpty(f: CrisisFilter): boolean {
  return (
    f.resourceCategories.length === 0 &&
    f.checklistPriorities.length === 0 &&
    f.safeZoneTypes.length === 0 &&
    f.search.trim().length === 0
  );
}

export function filterCount(f: CrisisFilter): number {
  let n = 0;
  if (f.resourceCategories.length) n += 1;
  if (f.checklistPriorities.length) n += 1;
  if (f.safeZoneTypes.length) n += 1;
  if (f.search.trim().length) n += 1;
  return n;
}
