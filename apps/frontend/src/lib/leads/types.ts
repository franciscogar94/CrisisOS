// Crisis Manager — type definitions
// Shared contract with apps/agent/src/lead_state.py (CrisisCanvasState)

export type CrisisSeverity = "low" | "moderate" | "high" | "critical";

export type CrisisType =
  | "earthquake"
  | "flood"
  | "fire"
  | "hurricane"
  | "tornado"
  | "tsunami"
  | "chemical"
  | "other";

export type ServiceStatus =
  | "operational"
  | "degraded"
  | "outage"
  | "unknown";

export type ChecklistPriority = "immediate" | "short-term" | "long-term";

export type SafeZoneType =
  | "shelter"
  | "hospital"
  | "fire_station"
  | "police"
  | "assembly_point";

export type SafeZoneStatus = "open" | "full" | "closed";

export type ResourceCategory =
  | "water"
  | "food"
  | "medical"
  | "shelter"
  | "communication"
  | "transport"
  | "tools";

export type ServiceType =
  | "water"
  | "electricity"
  | "gas"
  | "communications"
  | "internet"
  | "transport";

export type TimelinePhase =
  | "first_5_min"
  | "first_hour"
  | "first_day"
  | "first_week";

export type ActiveModule =
  | "overview"
  | "map"
  | "checklist"
  | "resources"
  | "timeline"
  | "alerts";

export const SEVERITIES: readonly CrisisSeverity[] = [
  "low",
  "moderate",
  "high",
  "critical",
] as const;

export const CRISIS_TYPES: readonly CrisisType[] = [
  "earthquake",
  "flood",
  "fire",
  "hurricane",
  "tornado",
  "tsunami",
  "chemical",
  "other",
] as const;

export const CHECKLIST_PRIORITIES: readonly ChecklistPriority[] = [
  "immediate",
  "short-term",
  "long-term",
] as const;

export const RESOURCE_CATEGORIES: readonly ResourceCategory[] = [
  "water",
  "food",
  "medical",
  "shelter",
  "communication",
  "transport",
  "tools",
] as const;

export const SAFE_ZONE_TYPES: readonly SafeZoneType[] = [
  "shelter",
  "hospital",
  "fire_station",
  "police",
  "assembly_point",
] as const;

export const TIMELINE_PHASES: readonly TimelinePhase[] = [
  "first_5_min",
  "first_hour",
  "first_day",
  "first_week",
] as const;

export interface GeoPoint {
  lat: number;
  lng: number;
  name?: string;
}

export interface Crisis {
  id: string;
  type: CrisisType;
  severity: CrisisSeverity;
  title: string;
  description: string;
  location: GeoPoint;
  affectedRadius: number;
  timestamp: string;
  updatedAt?: string;
}

export interface SafeZone {
  id: string;
  name: string;
  type: SafeZoneType;
  location: GeoPoint;
  capacity?: number;
  status: SafeZoneStatus;
  distance?: number;
  phone?: string;
  notes?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  priority: ChecklistPriority;
  category: string;
}

export interface Resource {
  id: string;
  name: string;
  category: ResourceCategory;
  have: number;
  need: number;
  unit: string;
  critical: boolean;
}

export interface ServiceAlert {
  id: string;
  service: ServiceType;
  status: ServiceStatus;
  message: string;
  updatedAt: string;
}

export interface TimelineEntry {
  id: string;
  phase: TimelinePhase;
  action: string;
  completed: boolean;
  order: number;
}

export interface WeatherData {
  temperature: number;
  windSpeed: number;
  humidity: number;
  description: string;
  alerts: string[];
}

export interface CrisisFilter {
  resourceCategories: ResourceCategory[];
  checklistPriorities: ChecklistPriority[];
  safeZoneTypes: SafeZoneType[];
  search: string;
}

export interface AgentState {
  crisis: Crisis | null;
  safeZones: SafeZone[];
  checklist: ChecklistItem[];
  resources: Resource[];
  alerts: ServiceAlert[];
  timeline: TimelineEntry[];
  weather: WeatherData | null;
  filter: CrisisFilter;
  highlightedZoneIds: string[];
  selectedZoneId: string | null;
  header: { title: string; subtitle: string };
  activeModule: ActiveModule;
}
