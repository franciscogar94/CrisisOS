import type {
  ChecklistItem,
  CrisisType,
  Resource,
  SafeZone,
  ServiceStatus,
  Severity,
  ZoneType,
} from "./types";

// UI helpers — color tokens, formatters, computed values for the Crisis
// dashboard widget. Pure functions; no React imports.

export const SEVERITY_COLOR: Record<Severity, string> = {
  low: "#34D399", // emerald-400
  moderate: "#FBBF24", // amber-400
  high: "#F97316", // orange-500
  critical: "#EF4444", // red-500
};

export const SEVERITY_BG: Record<Severity, string> = {
  low: "#D1FAE5",
  moderate: "#FEF3C7",
  high: "#FFEDD5",
  critical: "#FEE2E2",
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  low: "leve",
  moderate: "moderada",
  high: "alta",
  critical: "crítica",
};

export const TYPE_ICON: Record<CrisisType, string> = {
  earthquake: "🏚️",
  flood: "🌊",
  fire: "🔥",
  hurricane: "🌀",
  tornado: "🌪️",
  tsunami: "🌊",
  chemical: "☣️",
  volcanic: "🌋",
  blackout: "⚡",
  other: "🚨",
};

export const TYPE_LABEL: Record<CrisisType, string> = {
  earthquake: "Terremoto",
  flood: "Inundación",
  fire: "Incendio",
  hurricane: "Huracán",
  tornado: "Tornado",
  tsunami: "Tsunami",
  chemical: "Incidente químico",
  volcanic: "Erupción volcánica",
  blackout: "Apagón masivo",
  other: "Crisis",
};

export const ZONE_ICON: Record<ZoneType, string> = {
  hospital: "🏥",
  shelter: "🏠",
  fire_station: "🚒",
  police: "🚓",
  assembly_point: "📍",
};

export const ZONE_LABEL: Record<ZoneType, string> = {
  hospital: "Hospital",
  shelter: "Albergue",
  fire_station: "Bomberos",
  police: "Policía",
  assembly_point: "Punto de encuentro",
};

export const SERVICE_STATUS_COLOR: Record<ServiceStatus, string> = {
  operational: "#10B981",
  degraded: "#F59E0B",
  outage: "#EF4444",
  unknown: "#9CA3AF",
};

export const SERVICE_STATUS_LABEL: Record<ServiceStatus, string> = {
  operational: "operativo",
  degraded: "degradado",
  outage: "caído",
  unknown: "desconocido",
};

export function resourcePercent(r: Resource): number {
  if (r.need <= 0) return 100;
  return Math.min(100, Math.round((r.have / r.need) * 100));
}

export function checklistProgress(items: ChecklistItem[]): {
  done: number;
  total: number;
  pct: number;
} {
  const total = items.length;
  const done = items.filter((i) => i.checked).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, pct };
}

export function countCriticalResources(resources: Resource[]): number {
  return resources.filter((r) => r.critical).length;
}

export function groupZonesByType(zones: SafeZone[]): Map<ZoneType, SafeZone[]> {
  const groups = new Map<ZoneType, SafeZone[]>();
  for (const z of zones) {
    const list = groups.get(z.type) ?? [];
    list.push(z);
    groups.set(z.type, list);
  }
  return groups;
}
