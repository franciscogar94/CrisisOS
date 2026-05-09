import type {
  AgentState,
  ChecklistItem,
  Resource,
  SafeZone,
} from "./types";

export function toggleChecklistItem(state: AgentState, itemId: string): AgentState {
  const idx = state.checklist.findIndex((i) => i.id === itemId);
  if (idx < 0) return state;
  const next = state.checklist.slice();
  next[idx] = { ...state.checklist[idx], checked: !state.checklist[idx].checked };
  return { ...state, checklist: next };
}

export function applyChecklistPatch(
  state: AgentState,
  itemId: string,
  patch: Partial<ChecklistItem>,
): AgentState {
  const idx = state.checklist.findIndex((i) => i.id === itemId);
  if (idx < 0) return state;
  const next = state.checklist.slice();
  next[idx] = { ...state.checklist[idx], ...patch };
  return { ...state, checklist: next };
}

export function applyResourcePatch(
  state: AgentState,
  resourceId: string,
  patch: Partial<Resource>,
): AgentState {
  const idx = state.resources.findIndex((r) => r.id === resourceId);
  if (idx < 0) return state;
  const next = state.resources.slice();
  next[idx] = { ...state.resources[idx], ...patch };
  return { ...state, resources: next };
}

export function applySafeZonePatch(
  state: AgentState,
  zoneId: string,
  patch: Partial<SafeZone>,
): AgentState {
  const idx = state.safeZones.findIndex((z) => z.id === zoneId);
  if (idx < 0) return state;
  const next = state.safeZones.slice();
  next[idx] = { ...state.safeZones[idx], ...patch };
  return { ...state, safeZones: next };
}
