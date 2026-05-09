// Dev-only fixture data for the crisis canvas.
// Gated by NEXT_PUBLIC_ENABLE_MOCK=1. Not intended for production.
// Each scenario is a complete AgentState — drop-in replacement until the
// agent emits real state. IDs are prefixed with "mock:" to avoid colliding
// with anything the agent might produce.

import type { AgentState } from "./types";
import { emptyFilter } from "./state";

export type MockScenarioId = "earthquake" | "flood" | "wildfire";

export const mockScenarioLabels: Record<MockScenarioId, string> = {
  earthquake: "Earthquake — Santiago",
  flood: "Coastal flood — Valparaíso",
  wildfire: "Wildfire — Viña del Mar",
};

const NOW = "2026-05-09T12:00:00.000Z";

const earthquake: AgentState = {
  crisis: {
    id: "mock:crisis-eq",
    type: "earthquake",
    severity: "critical",
    title: "[DEMO] M7.2 earthquake — Santiago",
    description:
      "Magnitude 7.2 earthquake, epicenter 30km southwest of Santiago centro. Aftershocks expected next 72h.",
    location: { lat: -33.4489, lng: -70.6693, name: "Santiago, Chile" },
    affectedRadius: 50,
    timestamp: NOW,
  },
  safeZones: [
    {
      id: "mock:zone-eq-1",
      name: "Hospital Salvador",
      type: "hospital",
      location: { lat: -33.435, lng: -70.625 },
      capacity: 500,
      status: "open",
      distance: 1.8,
      phone: "+56 2 2575 0000",
    },
    {
      id: "mock:zone-eq-2",
      name: "Estadio Nacional (assembly)",
      type: "assembly_point",
      location: { lat: -33.464, lng: -70.61 },
      capacity: 12000,
      status: "open",
      distance: 3.4,
    },
    {
      id: "mock:zone-eq-3",
      name: "Cuartel Bomberos Providencia",
      type: "fire_station",
      location: { lat: -33.42, lng: -70.61 },
      status: "open",
      distance: 2.1,
      phone: "132",
    },
    {
      id: "mock:zone-eq-4",
      name: "Refugio Escuela San Cristóbal",
      type: "shelter",
      location: { lat: -33.41, lng: -70.63 },
      capacity: 800,
      status: "full",
      distance: 2.9,
    },
    {
      id: "mock:zone-eq-5",
      name: "Comisaría 19 Providencia",
      type: "police",
      location: { lat: -33.426, lng: -70.617 },
      status: "open",
      distance: 2.4,
      phone: "133",
    },
  ],
  checklist: [
    { id: "mock:cl-eq-1", text: "Drop, cover, hold on until shaking stops", checked: true, priority: "immediate", category: "safety" },
    { id: "mock:cl-eq-2", text: "Evacuate building via stairs once tremor ends", checked: false, priority: "immediate", category: "evacuation" },
    { id: "mock:cl-eq-3", text: "Shut off gas if you smell leak", checked: false, priority: "immediate", category: "utilities" },
    { id: "mock:cl-eq-4", text: "Account for all family members", checked: false, priority: "immediate", category: "people" },
    { id: "mock:cl-eq-5", text: "Move to designated assembly point", checked: false, priority: "short-term", category: "evacuation" },
    { id: "mock:cl-eq-6", text: "Tune to emergency radio (95.3 FM)", checked: false, priority: "short-term", category: "communication" },
    { id: "mock:cl-eq-7", text: "Inspect home for structural damage", checked: false, priority: "short-term", category: "structure" },
    { id: "mock:cl-eq-8", text: "Stock 72h water + food supply", checked: false, priority: "long-term", category: "supplies" },
    { id: "mock:cl-eq-9", text: "Document damage for insurance", checked: false, priority: "long-term", category: "admin" },
    { id: "mock:cl-eq-10", text: "Plan reunification with extended family", checked: false, priority: "long-term", category: "people" },
  ],
  resources: [
    { id: "mock:res-eq-1", name: "Bottled water", category: "water", have: 120, need: 500, unit: "liters", critical: true },
    { id: "mock:res-eq-2", name: "Non-perishable food", category: "food", have: 80, need: 300, unit: "kg", critical: true },
    { id: "mock:res-eq-3", name: "First aid kits", category: "medical", have: 35, need: 50, unit: "kits", critical: true },
    { id: "mock:res-eq-4", name: "Blankets", category: "shelter", have: 200, need: 200, unit: "units", critical: false },
    { id: "mock:res-eq-5", name: "Two-way radios", category: "communication", have: 12, need: 30, unit: "units", critical: false },
    { id: "mock:res-eq-6", name: "Diesel for vehicles", category: "transport", have: 400, need: 600, unit: "liters", critical: false },
    { id: "mock:res-eq-7", name: "Crowbars / pry tools", category: "tools", have: 18, need: 25, unit: "units", critical: false },
    { id: "mock:res-eq-8", name: "Insulin (cold chain)", category: "medical", have: 4, need: 20, unit: "vials", critical: true },
  ],
  alerts: [
    { id: "mock:al-eq-1", service: "electricity", status: "outage", message: "Grid down across Providencia, Ñuñoa, La Reina", updatedAt: NOW },
    { id: "mock:al-eq-2", service: "water", status: "degraded", message: "Pressure low; boil-water advisory in effect", updatedAt: NOW },
    { id: "mock:al-eq-3", service: "gas", status: "outage", message: "Network shut off as precaution", updatedAt: NOW },
    { id: "mock:al-eq-4", service: "communications", status: "degraded", message: "Mobile networks congested; SMS preferred", updatedAt: NOW },
  ],
  timeline: [
    { id: "mock:tl-eq-1", phase: "first_5_min", action: "Drop, cover, hold on", completed: true, order: 1 },
    { id: "mock:tl-eq-2", phase: "first_5_min", action: "Stay away from windows + heavy furniture", completed: true, order: 2 },
    { id: "mock:tl-eq-3", phase: "first_hour", action: "Evacuate to assembly point", completed: false, order: 1 },
    { id: "mock:tl-eq-4", phase: "first_hour", action: "Account for all people", completed: false, order: 2 },
    { id: "mock:tl-eq-5", phase: "first_day", action: "Inspect structural damage", completed: false, order: 1 },
    { id: "mock:tl-eq-6", phase: "first_day", action: "Distribute water + food rations", completed: false, order: 2 },
    { id: "mock:tl-eq-7", phase: "first_week", action: "Coordinate with insurance + relief", completed: false, order: 1 },
    { id: "mock:tl-eq-8", phase: "first_week", action: "Restore utilities and reopen schools", completed: false, order: 2 },
  ],
  weather: {
    temperature: 14,
    windSpeed: 12,
    humidity: 65,
    description: "Partly cloudy, mild",
    alerts: ["Aftershock advisory active"],
  },
  filter: emptyFilter,
  highlightedZoneIds: [],
  selectedZoneId: null,
  header: {
    title: "[DEMO] CrisisOS — Santiago Earthquake",
    subtitle: "M7.2 epicenter 30km SW of Santiago centro",
  },
  activeModule: "overview",
};

const flood: AgentState = {
  crisis: {
    id: "mock:crisis-fl",
    type: "flood",
    severity: "high",
    title: "[DEMO] Coastal flood — Valparaíso",
    description:
      "Storm surge + king tide flooding low-lying coastal districts. Evacuation ordered for zones below 5m elevation.",
    location: { lat: -33.0472, lng: -71.6127, name: "Valparaíso, Chile" },
    affectedRadius: 15,
    timestamp: NOW,
  },
  safeZones: [
    { id: "mock:zone-fl-1", name: "Hospital Carlos Van Buren", type: "hospital", location: { lat: -33.05, lng: -71.6 }, capacity: 350, status: "open", distance: 1.2, phone: "+56 32 220 4000" },
    { id: "mock:zone-fl-2", name: "Plaza Sotomayor (assembly)", type: "assembly_point", location: { lat: -33.036, lng: -71.628 }, capacity: 4000, status: "open", distance: 0.8 },
    { id: "mock:zone-fl-3", name: "Refugio Cerro Alegre", type: "shelter", location: { lat: -33.04, lng: -71.628 }, capacity: 600, status: "open", distance: 1.5 },
    { id: "mock:zone-fl-4", name: "Cuartel Bomberos Centro", type: "fire_station", location: { lat: -33.045, lng: -71.62 }, status: "open", distance: 1.0, phone: "132" },
  ],
  checklist: [
    { id: "mock:cl-fl-1", text: "Move to higher ground immediately", checked: false, priority: "immediate", category: "evacuation" },
    { id: "mock:cl-fl-2", text: "Disconnect power at the breaker if water rises", checked: false, priority: "immediate", category: "utilities" },
    { id: "mock:cl-fl-3", text: "Avoid driving through standing water", checked: false, priority: "immediate", category: "safety" },
    { id: "mock:cl-fl-4", text: "Move valuables + documents to upper floor", checked: false, priority: "short-term", category: "supplies" },
    { id: "mock:cl-fl-5", text: "Tune to emergency radio for tide updates", checked: false, priority: "short-term", category: "communication" },
    { id: "mock:cl-fl-6", text: "Account for neighbors with mobility issues", checked: false, priority: "short-term", category: "people" },
    { id: "mock:cl-fl-7", text: "Sanitize wells + standing water sources", checked: false, priority: "long-term", category: "supplies" },
    { id: "mock:cl-fl-8", text: "Document waterline damage for insurance", checked: false, priority: "long-term", category: "admin" },
  ],
  resources: [
    { id: "mock:res-fl-1", name: "Sandbags", category: "tools", have: 800, need: 2000, unit: "units", critical: true },
    { id: "mock:res-fl-2", name: "Bottled water", category: "water", have: 200, need: 400, unit: "liters", critical: true },
    { id: "mock:res-fl-3", name: "Boats / rafts", category: "transport", have: 6, need: 12, unit: "units", critical: true },
    { id: "mock:res-fl-4", name: "Life jackets", category: "shelter", have: 80, need: 150, unit: "units", critical: false },
    { id: "mock:res-fl-5", name: "Tetanus vaccines", category: "medical", have: 60, need: 100, unit: "doses", critical: false },
    { id: "mock:res-fl-6", name: "Dry food rations", category: "food", have: 120, need: 250, unit: "kg", critical: false },
  ],
  alerts: [
    { id: "mock:al-fl-1", service: "electricity", status: "degraded", message: "Outages in Cerro Concepción + Plan", updatedAt: NOW },
    { id: "mock:al-fl-2", service: "water", status: "degraded", message: "Saltwater intrusion suspected — avoid tap water", updatedAt: NOW },
    { id: "mock:al-fl-3", service: "transport", status: "outage", message: "Av. Errázuriz closed; trolleybuses suspended", updatedAt: NOW },
  ],
  timeline: [
    { id: "mock:tl-fl-1", phase: "first_5_min", action: "Confirm evacuation order received", completed: true, order: 1 },
    { id: "mock:tl-fl-2", phase: "first_5_min", action: "Move pets + valuables to upper floor", completed: false, order: 2 },
    { id: "mock:tl-fl-3", phase: "first_hour", action: "Evacuate to higher-ground assembly", completed: false, order: 1 },
    { id: "mock:tl-fl-4", phase: "first_hour", action: "Cut power at the breaker before leaving", completed: false, order: 2 },
    { id: "mock:tl-fl-5", phase: "first_day", action: "Distribute potable water + dry rations", completed: false, order: 1 },
    { id: "mock:tl-fl-6", phase: "first_day", action: "Survey infrastructure damage", completed: false, order: 2 },
    { id: "mock:tl-fl-7", phase: "first_week", action: "Restore drainage + clean public roads", completed: false, order: 1 },
  ],
  weather: {
    temperature: 11,
    windSpeed: 38,
    humidity: 92,
    description: "Heavy rain, gusty SW wind",
    alerts: ["Coastal flood warning", "High surf advisory"],
  },
  filter: emptyFilter,
  highlightedZoneIds: [],
  selectedZoneId: null,
  header: {
    title: "[DEMO] CrisisOS — Valparaíso Flood",
    subtitle: "Storm surge + king tide; coastal evacuation ordered",
  },
  activeModule: "overview",
};

const wildfire: AgentState = {
  crisis: {
    id: "mock:crisis-wf",
    type: "fire",
    severity: "high",
    title: "[DEMO] Wildfire — Viña del Mar hills",
    description:
      "Wildfire advancing toward residential sectors of Reñaca Alto. Sustained 40 km/h winds from NE.",
    location: { lat: -33.0153, lng: -71.5503, name: "Viña del Mar, Chile" },
    affectedRadius: 8,
    timestamp: NOW,
  },
  safeZones: [
    { id: "mock:zone-wf-1", name: "Hospital Gustavo Fricke", type: "hospital", location: { lat: -33.018, lng: -71.55 }, capacity: 420, status: "open", distance: 1.0, phone: "+56 32 257 7000" },
    { id: "mock:zone-wf-2", name: "Estadio Sausalito (assembly)", type: "assembly_point", location: { lat: -33.026, lng: -71.553 }, capacity: 8000, status: "open", distance: 1.6 },
    { id: "mock:zone-wf-3", name: "Cuartel Bomberos Reñaca", type: "fire_station", location: { lat: -32.973, lng: -71.547 }, status: "open", distance: 4.7, phone: "132" },
    { id: "mock:zone-wf-4", name: "Refugio Liceo Bicentenario", type: "shelter", location: { lat: -33.022, lng: -71.555 }, capacity: 500, status: "open", distance: 1.3 },
  ],
  checklist: [
    { id: "mock:cl-wf-1", text: "Evacuate immediately if smoke is visible nearby", checked: false, priority: "immediate", category: "evacuation" },
    { id: "mock:cl-wf-2", text: "Close all windows + vents to limit ember entry", checked: false, priority: "immediate", category: "structure" },
    { id: "mock:cl-wf-3", text: "Don N95 mask outdoors", checked: false, priority: "immediate", category: "safety" },
    { id: "mock:cl-wf-4", text: "Wet down roof + perimeter if time permits", checked: false, priority: "short-term", category: "structure" },
    { id: "mock:cl-wf-5", text: "Move flammables ≥10m from structure", checked: false, priority: "short-term", category: "structure" },
    { id: "mock:cl-wf-6", text: "Pack go-bag (docs, meds, water, charger)", checked: false, priority: "short-term", category: "supplies" },
    { id: "mock:cl-wf-7", text: "Replace HEPA filters + air purifier media", checked: false, priority: "long-term", category: "supplies" },
    { id: "mock:cl-wf-8", text: "Inspect roof + gutters for ember damage", checked: false, priority: "long-term", category: "structure" },
  ],
  resources: [
    { id: "mock:res-wf-1", name: "N95 / KN95 masks", category: "medical", have: 200, need: 800, unit: "units", critical: true },
    { id: "mock:res-wf-2", name: "Water tankers", category: "water", have: 2, need: 6, unit: "units", critical: true },
    { id: "mock:res-wf-3", name: "Fire hose lengths", category: "tools", have: 14, need: 20, unit: "units", critical: false },
    { id: "mock:res-wf-4", name: "Bus seats (evac)", category: "transport", have: 120, need: 400, unit: "seats", critical: true },
    { id: "mock:res-wf-5", name: "Bottled water", category: "water", have: 300, need: 500, unit: "liters", critical: false },
    { id: "mock:res-wf-6", name: "Cots / mattresses", category: "shelter", have: 180, need: 250, unit: "units", critical: false },
  ],
  alerts: [
    { id: "mock:al-wf-1", service: "electricity", status: "degraded", message: "Preventive cuts in Reñaca Alto + El Salto", updatedAt: NOW },
    { id: "mock:al-wf-2", service: "transport", status: "degraded", message: "Camino Internacional closed; bus reroutes via Av. Borgoño", updatedAt: NOW },
    { id: "mock:al-wf-3", service: "communications", status: "operational", message: "All carriers nominal", updatedAt: NOW },
  ],
  timeline: [
    { id: "mock:tl-wf-1", phase: "first_5_min", action: "Confirm fire direction + wind", completed: true, order: 1 },
    { id: "mock:tl-wf-2", phase: "first_5_min", action: "Order phased evacuation of Reñaca Alto", completed: false, order: 2 },
    { id: "mock:tl-wf-3", phase: "first_hour", action: "Stage buses at assembly point", completed: false, order: 1 },
    { id: "mock:tl-wf-4", phase: "first_hour", action: "Open shelter at Liceo Bicentenario", completed: false, order: 2 },
    { id: "mock:tl-wf-5", phase: "first_day", action: "Distribute N95 masks + water", completed: false, order: 1 },
    { id: "mock:tl-wf-6", phase: "first_day", action: "Damage assessment of evacuated sectors", completed: false, order: 2 },
    { id: "mock:tl-wf-7", phase: "first_week", action: "Reforestation + erosion control plan", completed: false, order: 1 },
  ],
  weather: {
    temperature: 28,
    windSpeed: 42,
    humidity: 18,
    description: "Hot, dry, gusty NE wind",
    alerts: ["Red flag warning", "Air quality: hazardous"],
  },
  filter: emptyFilter,
  highlightedZoneIds: [],
  selectedZoneId: null,
  header: {
    title: "[DEMO] CrisisOS — Viña del Mar Wildfire",
    subtitle: "Fire approaching Reñaca Alto; phased evacuation underway",
  },
  activeModule: "overview",
};

export const mockScenarios: Record<MockScenarioId, AgentState> = {
  earthquake,
  flood,
  wildfire,
};
