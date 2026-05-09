import { z } from "zod";

// Crisis Manager domain shapes — mirrored from the Python `CrisisCanvasState`
// in apps/agent/src/lead_state.py so the MCP server, the LangGraph agent, and
// the Next.js canvas all speak the same vocabulary.

export const CRISIS_TYPES = [
  "earthquake",
  "flood",
  "fire",
  "hurricane",
  "tornado",
  "tsunami",
  "chemical",
  "volcanic",
  "blackout",
  "other",
] as const;
export type CrisisType = (typeof CRISIS_TYPES)[number];

export const SEVERITIES = ["low", "moderate", "high", "critical"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const ZONE_TYPES = [
  "shelter",
  "hospital",
  "fire_station",
  "police",
  "assembly_point",
] as const;
export type ZoneType = (typeof ZONE_TYPES)[number];

export const ZONE_STATUSES = ["open", "full", "closed"] as const;
export type ZoneStatus = (typeof ZONE_STATUSES)[number];

export const PRIORITIES = ["immediate", "short-term", "long-term"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const RESOURCE_CATEGORIES = [
  "water",
  "food",
  "medical",
  "shelter",
  "communication",
  "transport",
  "tools",
] as const;
export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

export const SERVICES = [
  "water",
  "electricity",
  "gas",
  "communications",
  "internet",
  "transport",
] as const;
export type Service = (typeof SERVICES)[number];

export const SERVICE_STATUSES = [
  "operational",
  "degraded",
  "outage",
  "unknown",
] as const;
export type ServiceStatus = (typeof SERVICE_STATUSES)[number];

export const TIMELINE_PHASES = [
  "first_5_min",
  "first_hour",
  "first_day",
  "first_week",
] as const;
export type TimelinePhase = (typeof TIMELINE_PHASES)[number];

export const crisisLocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  name: z.string(),
});
export type CrisisLocation = z.infer<typeof crisisLocationSchema>;

export const crisisSchema = z.object({
  id: z.string(),
  type: z.enum(CRISIS_TYPES),
  severity: z.enum(SEVERITIES),
  title: z.string(),
  description: z.string(),
  location: crisisLocationSchema,
  affectedRadius: z.number(),
  timestamp: z.string(),
});
export type Crisis = z.infer<typeof crisisSchema>;

export const safeZoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(ZONE_TYPES),
  location: z.object({ lat: z.number(), lng: z.number() }),
  capacity: z.number().optional(),
  status: z.enum(ZONE_STATUSES),
  distance: z.number().optional(),
  phone: z.string().optional(),
});
export type SafeZone = z.infer<typeof safeZoneSchema>;

export const checklistItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  checked: z.boolean(),
  priority: z.enum(PRIORITIES),
  category: z.string(),
});
export type ChecklistItem = z.infer<typeof checklistItemSchema>;

export const resourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(RESOURCE_CATEGORIES),
  have: z.number(),
  need: z.number(),
  unit: z.string(),
  critical: z.boolean(),
});
export type Resource = z.infer<typeof resourceSchema>;

export const serviceAlertSchema = z.object({
  id: z.string(),
  service: z.enum(SERVICES),
  status: z.enum(SERVICE_STATUSES),
  message: z.string(),
  updatedAt: z.string(),
});
export type ServiceAlert = z.infer<typeof serviceAlertSchema>;

export const timelineEntrySchema = z.object({
  id: z.string(),
  phase: z.enum(TIMELINE_PHASES),
  action: z.string(),
  completed: z.boolean(),
  order: z.number(),
});
export type TimelineEntry = z.infer<typeof timelineEntrySchema>;

export const weatherDataSchema = z.object({
  temperature: z.number(),
  windSpeed: z.number(),
  humidity: z.number(),
  description: z.string(),
  alerts: z.array(z.string()),
});
export type WeatherData = z.infer<typeof weatherDataSchema>;

// Composite shape — what generate-crisis returns. The widget consumes this.
export const crisisDashboardPropsSchema = z.object({
  crisis: crisisSchema,
  safeZones: z.array(safeZoneSchema).default([]),
  checklist: z.array(checklistItemSchema).default([]),
  resources: z.array(resourceSchema).default([]),
  alerts: z.array(serviceAlertSchema).default([]),
  timeline: z.array(timelineEntrySchema).default([]),
  weather: weatherDataSchema.nullable().optional(),
  header: z
    .object({
      title: z.string(),
      subtitle: z.string(),
    })
    .optional(),
});
export type CrisisDashboardProps = z.infer<typeof crisisDashboardPropsSchema>;
