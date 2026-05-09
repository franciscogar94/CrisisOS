import type {
  AgentState,
  ChecklistItem,
  Resource,
  SafeZone,
} from "./types";

export function toggleChecklistItem(
  state: AgentState,
  itemId: string,
): { next: AgentState; snapshot: ChecklistItem | null } {
  const idx = state.checklist.findIndex((i) => i.id === itemId);
  if (idx < 0) return { next: state, snapshot: null };
  const snapshot = state.checklist[idx];
  const next = state.checklist.slice();
  next[idx] = { ...snapshot, checked: !snapshot.checked };
  return { next: { ...state, checklist: next }, snapshot };
}

export function applyChecklistPatch(
  state: AgentState,
  itemId: string,
  patch: Partial<ChecklistItem>,
): { next: AgentState; snapshot: ChecklistItem | null } {
  const idx = state.checklist.findIndex((i) => i.id === itemId);
  if (idx < 0) return { next: state, snapshot: null };
  const snapshot = state.checklist[idx];
  const next = state.checklist.slice();
  next[idx] = { ...snapshot, ...patch };
  return { next: { ...state, checklist: next }, snapshot };
}

export function revertChecklistPatch(
  state: AgentState,
  snapshot: ChecklistItem,
): AgentState {
  const idx = state.checklist.findIndex((i) => i.id === snapshot.id);
  if (idx < 0) return { ...state, checklist: [...state.checklist, snapshot] };
  const next = state.checklist.slice();
  next[idx] = snapshot;
  return { ...state, checklist: next };
}

export function applyResourcePatch(
  state: AgentState,
  resourceId: string,
  patch: Partial<Resource>,
): { next: AgentState; snapshot: Resource | null } {
  const idx = state.resources.findIndex((r) => r.id === resourceId);
  if (idx < 0) return { next: state, snapshot: null };
  const snapshot = state.resources[idx];
  const next = state.resources.slice();
  next[idx] = { ...snapshot, ...patch };
  return { next: { ...state, resources: next }, snapshot };
}

export function revertResourcePatch(
  state: AgentState,
  snapshot: Resource,
): AgentState {
  const idx = state.resources.findIndex((r) => r.id === snapshot.id);
  if (idx < 0) return { ...state, resources: [...state.resources, snapshot] };
  const next = state.resources.slice();
  next[idx] = snapshot;
  return { ...state, resources: next };
}

export function applySafeZonePatch(
  state: AgentState,
  zoneId: string,
  patch: Partial<SafeZone>,
): { next: AgentState; snapshot: SafeZone | null } {
  const idx = state.safeZones.findIndex((z) => z.id === zoneId);
  if (idx < 0) return { next: state, snapshot: null };
  const snapshot = state.safeZones[idx];
  const next = state.safeZones.slice();
  next[idx] = { ...snapshot, ...patch };
  return { next: { ...state, safeZones: next }, snapshot };
}

export function revertSafeZonePatch(
  state: AgentState,
  snapshot: SafeZone,
): AgentState {
  const idx = state.safeZones.findIndex((z) => z.id === snapshot.id);
  if (idx < 0) return { ...state, safeZones: [...state.safeZones, snapshot] };
  const next = state.safeZones.slice();
  next[idx] = snapshot;
  return { ...state, safeZones: next };
}
