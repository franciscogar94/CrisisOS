import type {
  ChecklistItem,
  Crisis,
  CrisisFilter,
  CrisisSeverity,
  CrisisType,
  Resource,
  ResourceCategory,
  SafeZone,
  SafeZoneStatus,
  SafeZoneType,
  ServiceAlert,
  ServiceStatus,
  TimelineEntry,
  TimelinePhase,
} from "./types";
import { CHECKLIST_PRIORITIES } from "./types";

export function applySafeZoneFilter(zones: SafeZone[], f: CrisisFilter): SafeZone[] {
  const search = f.search.trim().toLowerCase();
  return zones.filter((z) => {
    if (f.safeZoneTypes.length && !f.safeZoneTypes.includes(z.type)) return false;
    if (search.length) {
      const blob = `${z.name} ${z.type} ${z.notes ?? ""}`.toLowerCase();
      if (!blob.includes(search)) return false;
    }
    return true;
  });
}

export function applyResourceFilter(resources: Resource[], f: CrisisFilter): Resource[] {
  const search = f.search.trim().toLowerCase();
  return resources.filter((r) => {
    if (f.resourceCategories.length && !f.resourceCategories.includes(r.category)) return false;
    if (search.length) {
      const blob = `${r.name} ${r.category}`.toLowerCase();
      if (!blob.includes(search)) return false;
    }
    return true;
  });
}

export function applyChecklistFilter(items: ChecklistItem[], f: CrisisFilter): ChecklistItem[] {
  const search = f.search.trim().toLowerCase();
  return items.filter((i) => {
    if (f.checklistPriorities.length && !f.checklistPriorities.includes(i.priority)) return false;
    if (search.length) {
      const blob = `${i.text} ${i.category}`.toLowerCase();
      if (!blob.includes(search)) return false;
    }
    return true;
  });
}

export function groupChecklistByPriority(
  items: ChecklistItem[],
): Record<string, ChecklistItem[]> {
  const groups: Record<string, ChecklistItem[]> = {};
  for (const p of CHECKLIST_PRIORITIES) groups[p] = [];
  for (const i of items) {
    (groups[i.priority] ||= []).push(i);
  }
  return groups;
}

export function checklistProgress(items: ChecklistItem[]): {
  total: number;
  done: number;
  pct: number;
} {
  const total = items.length;
  const done = items.filter((i) => i.checked).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, pct };
}

export function resourceDeficit(resources: Resource[]): {
  totalNeed: number;
  totalHave: number;
  pct: number;
  criticalShort: number;
} {
  let totalNeed = 0;
  let totalHave = 0;
  let criticalShort = 0;
  for (const r of resources) {
    totalNeed += r.need;
    totalHave += Math.min(r.have, r.need);
    if (r.critical && r.have < r.need) criticalShort += 1;
  }
  const pct = totalNeed === 0 ? 100 : Math.round((totalHave / totalNeed) * 100);
  return { totalNeed, totalHave, pct, criticalShort };
}

export function alertCount(alerts: ServiceAlert[]): {
  outage: number;
  degraded: number;
  operational: number;
} {
  let outage = 0;
  let degraded = 0;
  let operational = 0;
  for (const a of alerts) {
    if (a.status === "outage") outage += 1;
    else if (a.status === "degraded") degraded += 1;
    else if (a.status === "operational") operational += 1;
  }
  return { outage, degraded, operational };
}

export function timelineProgress(entries: TimelineEntry[]): {
  total: number;
  done: number;
  pct: number;
} {
  const total = entries.length;
  const done = entries.filter((e) => e.completed).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, pct };
}

export function groupTimelineByPhase(
  entries: TimelineEntry[],
): Record<TimelinePhase, TimelineEntry[]> {
  const groups: Record<string, TimelineEntry[]> = {
    first_5_min: [],
    first_hour: [],
    first_day: [],
    first_week: [],
  };
  for (const e of entries) {
    (groups[e.phase] ||= []).push(e);
  }
  for (const k of Object.keys(groups)) {
    groups[k].sort((a, b) => a.order - b.order);
  }
  return groups as Record<TimelinePhase, TimelineEntry[]>;
}

const SEVERITY_COLORS: Record<CrisisSeverity, string> = {
  low: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/40",
  moderate: "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/40",
  high: "bg-orange-500/15 text-orange-700 dark:text-orange-300 ring-orange-500/40",
  critical: "bg-rose-600/20 text-rose-700 dark:text-rose-300 ring-rose-600/50",
};

export function severityClass(severity: CrisisSeverity): string {
  return SEVERITY_COLORS[severity] ?? "bg-muted text-muted-foreground ring-border";
}

const CRISIS_TYPE_ICONS: Record<CrisisType, string> = {
  earthquake: "🌍",
  flood: "🌊",
  fire: "🔥",
  hurricane: "🌀",
  tornado: "🌪️",
  tsunami: "🌊",
  chemical: "☣️",
  other: "⚠️",
};

export function crisisTypeIcon(type: CrisisType): string {
  return CRISIS_TYPE_ICONS[type] ?? "⚠️";
}

const SAFE_ZONE_COLORS: Record<SafeZoneType, string> = {
  shelter: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30",
  hospital: "bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-rose-500/30",
  fire_station: "bg-orange-500/15 text-orange-700 dark:text-orange-300 ring-orange-500/30",
  police: "bg-blue-500/15 text-blue-700 dark:text-blue-300 ring-blue-500/30",
  assembly_point: "bg-violet-500/15 text-violet-700 dark:text-violet-300 ring-violet-500/30",
};

export function safeZoneClass(type: SafeZoneType): string {
  return SAFE_ZONE_COLORS[type] ?? "bg-muted text-muted-foreground ring-border";
}

const SAFE_ZONE_STATUS_COLORS: Record<SafeZoneStatus, string> = {
  open: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30",
  full: "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/30",
  closed: "bg-slate-500/15 text-slate-700 dark:text-slate-300 ring-slate-500/30",
};

export function safeZoneStatusClass(status: SafeZoneStatus): string {
  return SAFE_ZONE_STATUS_COLORS[status] ?? "bg-muted text-muted-foreground ring-border";
}

const RESOURCE_CATEGORY_COLORS: Record<ResourceCategory, string> = {
  water: "bg-blue-500/15 text-blue-700 dark:text-blue-300 ring-blue-500/30",
  food: "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/30",
  medical: "bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-rose-500/30",
  shelter: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30",
  communication: "bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-sky-500/30",
  transport: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 ring-indigo-500/30",
  tools: "bg-slate-500/15 text-slate-700 dark:text-slate-300 ring-slate-500/30",
};

export function resourceCategoryClass(category: ResourceCategory): string {
  return (
    RESOURCE_CATEGORY_COLORS[category] ??
    "bg-muted text-muted-foreground ring-border"
  );
}

const SERVICE_STATUS_COLORS: Record<ServiceStatus, string> = {
  operational: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30",
  degraded: "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/30",
  outage: "bg-rose-600/20 text-rose-700 dark:text-rose-300 ring-rose-600/50",
  unknown: "bg-slate-500/15 text-slate-700 dark:text-slate-300 ring-slate-500/30",
};

export function serviceStatusClass(status: ServiceStatus): string {
  return (
    SERVICE_STATUS_COLORS[status] ?? "bg-muted text-muted-foreground ring-border"
  );
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatDistance(km: number | undefined): string {
  if (km === undefined || km === null) return "—";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function severityRank(severity: CrisisSeverity): number {
  switch (severity) {
    case "low":
      return 1;
    case "moderate":
      return 2;
    case "high":
      return 3;
    case "critical":
      return 4;
    default:
      return 0;
  }
}

export function crisisHeadline(crisis: Crisis | null): string {
  if (!crisis) return "No active crisis";
  return `${crisisTypeIcon(crisis.type)} ${crisis.title}`;
}
