// Dev-only fixture data for the crisis canvas.
// Gated by NEXT_PUBLIC_ENABLE_MOCK=1. Not intended for production.
// Each scenario is a complete AgentState — drop-in replacement until the
// agent emits real state. IDs are prefixed with "mock:" to avoid colliding
// with anything the agent might produce.
//
// Localized fixtures: same numeric/structural data, translated strings per
// locale. UI chrome is translated via the i18n dictionary; this file
// translates the embedded content (titles, item text, alert messages).

import type { AgentState } from "./types";
import type { Locale } from "@/lib/i18n/dictionary";
import { emptyFilter } from "./state";

export type MockScenarioId = "earthquake" | "flood" | "wildfire";

const NOW = "2026-05-09T12:00:00.000Z";

interface ScenarioStrings {
  headerTitle: string;
  headerSubtitle: string;
  crisisTitle: string;
  crisisDescription: string;
  zone1: string; // hospital
  zone2: string; // assembly point
  zone3: string; // fire station
  zone4: string; // shelter
  zone5?: string; // police / extra
  cl: string[]; // checklist (10 items)
  res: string[]; // resources (8 items)
  resUnits: string[]; // resource units
  alertMessages: string[];
  timelineActions: string[];
  weatherDesc: string;
  weatherAlerts: string[];
}

// ─────────────── EARTHQUAKE ───────────────

const EQ_EN: ScenarioStrings = {
  headerTitle: "[DEMO] CrisisOS — Santiago Earthquake",
  headerSubtitle: "M7.2 epicenter 30km SW of Santiago centro",
  crisisTitle: "[DEMO] M7.2 earthquake — Santiago",
  crisisDescription:
    "Magnitude 7.2 earthquake, epicenter 30km southwest of Santiago centro. Aftershocks expected next 72h.",
  zone1: "Hospital Salvador",
  zone2: "Estadio Nacional (assembly)",
  zone3: "Cuartel Bomberos Providencia",
  zone4: "Refugio Escuela San Cristóbal",
  zone5: "Comisaría 19 Providencia",
  cl: [
    "Drop, cover, hold on until shaking stops",
    "Evacuate building via stairs once tremor ends",
    "Shut off gas if you smell leak",
    "Account for all family members",
    "Move to designated assembly point",
    "Tune to emergency radio (95.3 FM)",
    "Inspect home for structural damage",
    "Stock 72h water + food supply",
    "Document damage for insurance",
    "Plan reunification with extended family",
  ],
  res: [
    "Bottled water",
    "Non-perishable food",
    "First aid kits",
    "Blankets",
    "Two-way radios",
    "Diesel for vehicles",
    "Crowbars / pry tools",
    "Insulin (cold chain)",
  ],
  resUnits: ["liters", "kg", "kits", "units", "units", "liters", "units", "vials"],
  alertMessages: [
    "Grid down across Providencia, Ñuñoa, La Reina",
    "Pressure low; boil-water advisory in effect",
    "Network shut off as precaution",
    "Mobile networks congested; SMS preferred",
  ],
  timelineActions: [
    "Drop, cover, hold on",
    "Stay away from windows + heavy furniture",
    "Evacuate to assembly point",
    "Account for all people",
    "Inspect structural damage",
    "Distribute water + food rations",
    "Coordinate with insurance + relief",
    "Restore utilities and reopen schools",
  ],
  weatherDesc: "Partly cloudy, mild",
  weatherAlerts: ["Aftershock advisory active"],
};

const EQ_ES: ScenarioStrings = {
  headerTitle: "[DEMO] CrisisOS — Terremoto Santiago",
  headerSubtitle: "Epicentro M7.2 a 30km al SW del centro de Santiago",
  crisisTitle: "[DEMO] Terremoto M7.2 — Santiago",
  crisisDescription:
    "Terremoto de magnitud 7.2, epicentro 30km al suroeste del centro de Santiago. Réplicas esperadas próximas 72h.",
  zone1: "Hospital Salvador",
  zone2: "Estadio Nacional (punto de encuentro)",
  zone3: "Cuartel Bomberos Providencia",
  zone4: "Refugio Escuela San Cristóbal",
  zone5: "Comisaría 19 Providencia",
  cl: [
    "Agacharse, cubrirse, sostenerse hasta que pare el sismo",
    "Evacuar el edificio por escaleras al terminar el temblor",
    "Cerrar gas si hueles fuga",
    "Verificar a todos los familiares",
    "Trasladarse al punto de encuentro designado",
    "Sintonizar radio de emergencia (95.3 FM)",
    "Inspeccionar daños estructurales del hogar",
    "Almacenar 72h de agua + comida",
    "Documentar daños para seguros",
    "Planear reunión con familia extendida",
  ],
  res: [
    "Agua embotellada",
    "Alimentos no perecibles",
    "Kits de primeros auxilios",
    "Mantas",
    "Radios bidireccionales",
    "Diésel para vehículos",
    "Palancas / herramientas",
    "Insulina (cadena fría)",
  ],
  resUnits: ["litros", "kg", "kits", "unidades", "unidades", "litros", "unidades", "frascos"],
  alertMessages: [
    "Red caída en Providencia, Ñuñoa, La Reina",
    "Presión baja; aviso para hervir agua vigente",
    "Red cerrada como precaución",
    "Redes móviles congestionadas; preferir SMS",
  ],
  timelineActions: [
    "Agacharse, cubrirse, sostenerse",
    "Alejarse de ventanas y muebles pesados",
    "Evacuar al punto de encuentro",
    "Verificar a todas las personas",
    "Inspeccionar daños estructurales",
    "Distribuir agua + raciones de comida",
    "Coordinar con seguros + auxilio",
    "Restaurar servicios y reabrir escuelas",
  ],
  weatherDesc: "Parcialmente nublado, templado",
  weatherAlerts: ["Aviso de réplicas activo"],
};

function buildEarthquake(s: ScenarioStrings): AgentState {
  return {
    crisis: {
      id: "mock:crisis-eq",
      type: "earthquake",
      severity: "critical",
      title: s.crisisTitle,
      description: s.crisisDescription,
      location: { lat: -33.4489, lng: -70.6693, name: "Santiago, Chile" },
      affectedRadius: 50,
      timestamp: NOW,
    },
    safeZones: [
      { id: "mock:zone-eq-1", name: s.zone1, type: "hospital", location: { lat: -33.435, lng: -70.625 }, capacity: 500, status: "open", distance: 1.8, phone: "+56 2 2575 0000" },
      { id: "mock:zone-eq-2", name: s.zone2, type: "assembly_point", location: { lat: -33.464, lng: -70.61 }, capacity: 12000, status: "open", distance: 3.4 },
      { id: "mock:zone-eq-3", name: s.zone3, type: "fire_station", location: { lat: -33.42, lng: -70.61 }, status: "open", distance: 2.1, phone: "132" },
      { id: "mock:zone-eq-4", name: s.zone4, type: "shelter", location: { lat: -33.41, lng: -70.63 }, capacity: 800, status: "full", distance: 2.9 },
      { id: "mock:zone-eq-5", name: s.zone5 ?? "Police", type: "police", location: { lat: -33.426, lng: -70.617 }, status: "open", distance: 2.4, phone: "133" },
    ],
    checklist: [
      { id: "mock:cl-eq-1", text: s.cl[0], checked: true, priority: "immediate", category: "safety" },
      { id: "mock:cl-eq-2", text: s.cl[1], checked: false, priority: "immediate", category: "evacuation" },
      { id: "mock:cl-eq-3", text: s.cl[2], checked: false, priority: "immediate", category: "utilities" },
      { id: "mock:cl-eq-4", text: s.cl[3], checked: false, priority: "immediate", category: "people" },
      { id: "mock:cl-eq-5", text: s.cl[4], checked: false, priority: "short-term", category: "evacuation" },
      { id: "mock:cl-eq-6", text: s.cl[5], checked: false, priority: "short-term", category: "communication" },
      { id: "mock:cl-eq-7", text: s.cl[6], checked: false, priority: "short-term", category: "structure" },
      { id: "mock:cl-eq-8", text: s.cl[7], checked: false, priority: "long-term", category: "supplies" },
      { id: "mock:cl-eq-9", text: s.cl[8], checked: false, priority: "long-term", category: "admin" },
      { id: "mock:cl-eq-10", text: s.cl[9], checked: false, priority: "long-term", category: "people" },
    ],
    resources: [
      { id: "mock:res-eq-1", name: s.res[0], category: "water", have: 120, need: 500, unit: s.resUnits[0], critical: true },
      { id: "mock:res-eq-2", name: s.res[1], category: "food", have: 80, need: 300, unit: s.resUnits[1], critical: true },
      { id: "mock:res-eq-3", name: s.res[2], category: "medical", have: 35, need: 50, unit: s.resUnits[2], critical: true },
      { id: "mock:res-eq-4", name: s.res[3], category: "shelter", have: 200, need: 200, unit: s.resUnits[3], critical: false },
      { id: "mock:res-eq-5", name: s.res[4], category: "communication", have: 12, need: 30, unit: s.resUnits[4], critical: false },
      { id: "mock:res-eq-6", name: s.res[5], category: "transport", have: 400, need: 600, unit: s.resUnits[5], critical: false },
      { id: "mock:res-eq-7", name: s.res[6], category: "tools", have: 18, need: 25, unit: s.resUnits[6], critical: false },
      { id: "mock:res-eq-8", name: s.res[7], category: "medical", have: 4, need: 20, unit: s.resUnits[7], critical: true },
    ],
    alerts: [
      { id: "mock:al-eq-1", service: "electricity", status: "outage", message: s.alertMessages[0], updatedAt: NOW },
      { id: "mock:al-eq-2", service: "water", status: "degraded", message: s.alertMessages[1], updatedAt: NOW },
      { id: "mock:al-eq-3", service: "gas", status: "outage", message: s.alertMessages[2], updatedAt: NOW },
      { id: "mock:al-eq-4", service: "communications", status: "degraded", message: s.alertMessages[3], updatedAt: NOW },
    ],
    timeline: [
      { id: "mock:tl-eq-1", phase: "first_5_min", action: s.timelineActions[0], completed: true, order: 1 },
      { id: "mock:tl-eq-2", phase: "first_5_min", action: s.timelineActions[1], completed: true, order: 2 },
      { id: "mock:tl-eq-3", phase: "first_hour", action: s.timelineActions[2], completed: false, order: 1 },
      { id: "mock:tl-eq-4", phase: "first_hour", action: s.timelineActions[3], completed: false, order: 2 },
      { id: "mock:tl-eq-5", phase: "first_day", action: s.timelineActions[4], completed: false, order: 1 },
      { id: "mock:tl-eq-6", phase: "first_day", action: s.timelineActions[5], completed: false, order: 2 },
      { id: "mock:tl-eq-7", phase: "first_week", action: s.timelineActions[6], completed: false, order: 1 },
      { id: "mock:tl-eq-8", phase: "first_week", action: s.timelineActions[7], completed: false, order: 2 },
    ],
    weather: { temperature: 14, windSpeed: 12, humidity: 65, description: s.weatherDesc, alerts: s.weatherAlerts },
    filter: emptyFilter,
    highlightedZoneIds: [],
    selectedZoneId: null,
    header: { title: s.headerTitle, subtitle: s.headerSubtitle },
    activeModule: "overview",
  };
}

// ─────────────── FLOOD ───────────────

const FL_EN: ScenarioStrings = {
  headerTitle: "[DEMO] CrisisOS — Valparaíso Flood",
  headerSubtitle: "Storm surge + king tide; coastal evacuation ordered",
  crisisTitle: "[DEMO] Coastal flood — Valparaíso",
  crisisDescription:
    "Storm surge + king tide flooding low-lying coastal districts. Evacuation ordered for zones below 5m elevation.",
  zone1: "Hospital Carlos Van Buren",
  zone2: "Plaza Sotomayor (assembly)",
  zone3: "Cuartel Bomberos Centro",
  zone4: "Refugio Cerro Alegre",
  cl: [
    "Move to higher ground immediately",
    "Disconnect power at the breaker if water rises",
    "Avoid driving through standing water",
    "Move valuables + documents to upper floor",
    "Tune to emergency radio for tide updates",
    "Account for neighbors with mobility issues",
    "Sanitize wells + standing water sources",
    "Document waterline damage for insurance",
  ],
  res: ["Sandbags", "Bottled water", "Boats / rafts", "Life jackets", "Tetanus vaccines", "Dry food rations"],
  resUnits: ["units", "liters", "units", "units", "doses", "kg"],
  alertMessages: [
    "Outages in Cerro Concepción + Plan",
    "Saltwater intrusion suspected — avoid tap water",
    "Av. Errázuriz closed; trolleybuses suspended",
  ],
  timelineActions: [
    "Confirm evacuation order received",
    "Move pets + valuables to upper floor",
    "Evacuate to higher-ground assembly",
    "Cut power at the breaker before leaving",
    "Distribute potable water + dry rations",
    "Survey infrastructure damage",
    "Restore drainage + clean public roads",
  ],
  weatherDesc: "Heavy rain, gusty SW wind",
  weatherAlerts: ["Coastal flood warning", "High surf advisory"],
};

const FL_ES: ScenarioStrings = {
  headerTitle: "[DEMO] CrisisOS — Inundación Valparaíso",
  headerSubtitle: "Marejada + marea alta; evacuación costera ordenada",
  crisisTitle: "[DEMO] Inundación costera — Valparaíso",
  crisisDescription:
    "Marejada + marea alta inundan zonas costeras bajas. Evacuación ordenada para zonas bajo 5m de elevación.",
  zone1: "Hospital Carlos Van Buren",
  zone2: "Plaza Sotomayor (punto de encuentro)",
  zone3: "Cuartel Bomberos Centro",
  zone4: "Refugio Cerro Alegre",
  cl: [
    "Trasladarse a zonas altas de inmediato",
    "Cortar luz en el tablero si sube el agua",
    "Evitar conducir por agua estancada",
    "Subir objetos de valor + documentos al piso superior",
    "Sintonizar radio de emergencia para mareas",
    "Verificar vecinos con problemas de movilidad",
    "Sanitizar pozos + fuentes de agua estancada",
    "Documentar daños por agua para seguros",
  ],
  res: ["Sacos de arena", "Agua embotellada", "Botes / balsas", "Chalecos salvavidas", "Vacunas antitetánicas", "Raciones secas"],
  resUnits: ["unidades", "litros", "unidades", "unidades", "dosis", "kg"],
  alertMessages: [
    "Cortes en Cerro Concepción + Plan",
    "Posible intrusión salina — evitar agua de grifo",
    "Av. Errázuriz cerrada; trolebuses suspendidos",
  ],
  timelineActions: [
    "Confirmar recepción de orden de evacuación",
    "Subir mascotas + objetos de valor al piso superior",
    "Evacuar al punto de encuentro en zona alta",
    "Cortar la luz en el tablero antes de salir",
    "Distribuir agua potable + raciones secas",
    "Inspeccionar daños en infraestructura",
    "Restaurar drenaje + limpiar calles públicas",
  ],
  weatherDesc: "Lluvia fuerte, viento racheado del SW",
  weatherAlerts: ["Alerta de inundación costera", "Aviso de marejada alta"],
};

function buildFlood(s: ScenarioStrings): AgentState {
  return {
    crisis: {
      id: "mock:crisis-fl",
      type: "flood",
      severity: "high",
      title: s.crisisTitle,
      description: s.crisisDescription,
      location: { lat: -33.0472, lng: -71.6127, name: "Valparaíso, Chile" },
      affectedRadius: 15,
      timestamp: NOW,
    },
    safeZones: [
      { id: "mock:zone-fl-1", name: s.zone1, type: "hospital", location: { lat: -33.05, lng: -71.6 }, capacity: 350, status: "open", distance: 1.2, phone: "+56 32 220 4000" },
      { id: "mock:zone-fl-2", name: s.zone2, type: "assembly_point", location: { lat: -33.036, lng: -71.628 }, capacity: 4000, status: "open", distance: 0.8 },
      { id: "mock:zone-fl-3", name: s.zone4, type: "shelter", location: { lat: -33.04, lng: -71.628 }, capacity: 600, status: "open", distance: 1.5 },
      { id: "mock:zone-fl-4", name: s.zone3, type: "fire_station", location: { lat: -33.045, lng: -71.62 }, status: "open", distance: 1.0, phone: "132" },
    ],
    checklist: [
      { id: "mock:cl-fl-1", text: s.cl[0], checked: false, priority: "immediate", category: "evacuation" },
      { id: "mock:cl-fl-2", text: s.cl[1], checked: false, priority: "immediate", category: "utilities" },
      { id: "mock:cl-fl-3", text: s.cl[2], checked: false, priority: "immediate", category: "safety" },
      { id: "mock:cl-fl-4", text: s.cl[3], checked: false, priority: "short-term", category: "supplies" },
      { id: "mock:cl-fl-5", text: s.cl[4], checked: false, priority: "short-term", category: "communication" },
      { id: "mock:cl-fl-6", text: s.cl[5], checked: false, priority: "short-term", category: "people" },
      { id: "mock:cl-fl-7", text: s.cl[6], checked: false, priority: "long-term", category: "supplies" },
      { id: "mock:cl-fl-8", text: s.cl[7], checked: false, priority: "long-term", category: "admin" },
    ],
    resources: [
      { id: "mock:res-fl-1", name: s.res[0], category: "tools", have: 800, need: 2000, unit: s.resUnits[0], critical: true },
      { id: "mock:res-fl-2", name: s.res[1], category: "water", have: 200, need: 400, unit: s.resUnits[1], critical: true },
      { id: "mock:res-fl-3", name: s.res[2], category: "transport", have: 6, need: 12, unit: s.resUnits[2], critical: true },
      { id: "mock:res-fl-4", name: s.res[3], category: "shelter", have: 80, need: 150, unit: s.resUnits[3], critical: false },
      { id: "mock:res-fl-5", name: s.res[4], category: "medical", have: 60, need: 100, unit: s.resUnits[4], critical: false },
      { id: "mock:res-fl-6", name: s.res[5], category: "food", have: 120, need: 250, unit: s.resUnits[5], critical: false },
    ],
    alerts: [
      { id: "mock:al-fl-1", service: "electricity", status: "degraded", message: s.alertMessages[0], updatedAt: NOW },
      { id: "mock:al-fl-2", service: "water", status: "degraded", message: s.alertMessages[1], updatedAt: NOW },
      { id: "mock:al-fl-3", service: "transport", status: "outage", message: s.alertMessages[2], updatedAt: NOW },
    ],
    timeline: [
      { id: "mock:tl-fl-1", phase: "first_5_min", action: s.timelineActions[0], completed: true, order: 1 },
      { id: "mock:tl-fl-2", phase: "first_5_min", action: s.timelineActions[1], completed: false, order: 2 },
      { id: "mock:tl-fl-3", phase: "first_hour", action: s.timelineActions[2], completed: false, order: 1 },
      { id: "mock:tl-fl-4", phase: "first_hour", action: s.timelineActions[3], completed: false, order: 2 },
      { id: "mock:tl-fl-5", phase: "first_day", action: s.timelineActions[4], completed: false, order: 1 },
      { id: "mock:tl-fl-6", phase: "first_day", action: s.timelineActions[5], completed: false, order: 2 },
      { id: "mock:tl-fl-7", phase: "first_week", action: s.timelineActions[6], completed: false, order: 1 },
    ],
    weather: { temperature: 11, windSpeed: 38, humidity: 92, description: s.weatherDesc, alerts: s.weatherAlerts },
    filter: emptyFilter,
    highlightedZoneIds: [],
    selectedZoneId: null,
    header: { title: s.headerTitle, subtitle: s.headerSubtitle },
    activeModule: "overview",
  };
}

// ─────────────── WILDFIRE ───────────────

const WF_EN: ScenarioStrings = {
  headerTitle: "[DEMO] CrisisOS — Viña del Mar Wildfire",
  headerSubtitle: "Fire approaching Reñaca Alto; phased evacuation underway",
  crisisTitle: "[DEMO] Wildfire — Viña del Mar hills",
  crisisDescription:
    "Wildfire advancing toward residential sectors of Reñaca Alto. Sustained 40 km/h winds from NE.",
  zone1: "Hospital Gustavo Fricke",
  zone2: "Estadio Sausalito (assembly)",
  zone3: "Cuartel Bomberos Reñaca",
  zone4: "Refugio Liceo Bicentenario",
  cl: [
    "Evacuate immediately if smoke is visible nearby",
    "Close all windows + vents to limit ember entry",
    "Don N95 mask outdoors",
    "Wet down roof + perimeter if time permits",
    "Move flammables ≥10m from structure",
    "Pack go-bag (docs, meds, water, charger)",
    "Replace HEPA filters + air purifier media",
    "Inspect roof + gutters for ember damage",
  ],
  res: ["N95 / KN95 masks", "Water tankers", "Fire hose lengths", "Bus seats (evac)", "Bottled water", "Cots / mattresses"],
  resUnits: ["units", "units", "units", "seats", "liters", "units"],
  alertMessages: [
    "Preventive cuts in Reñaca Alto + El Salto",
    "Camino Internacional closed; bus reroutes via Av. Borgoño",
    "All carriers nominal",
  ],
  timelineActions: [
    "Confirm fire direction + wind",
    "Order phased evacuation of Reñaca Alto",
    "Stage buses at assembly point",
    "Open shelter at Liceo Bicentenario",
    "Distribute N95 masks + water",
    "Damage assessment of evacuated sectors",
    "Reforestation + erosion control plan",
  ],
  weatherDesc: "Hot, dry, gusty NE wind",
  weatherAlerts: ["Red flag warning", "Air quality: hazardous"],
};

const WF_ES: ScenarioStrings = {
  headerTitle: "[DEMO] CrisisOS — Incendio Viña del Mar",
  headerSubtitle: "Fuego avanza a Reñaca Alto; evacuación por fases en curso",
  crisisTitle: "[DEMO] Incendio forestal — cerros Viña del Mar",
  crisisDescription:
    "Incendio forestal avanza hacia sectores residenciales de Reñaca Alto. Vientos sostenidos 40 km/h del NE.",
  zone1: "Hospital Gustavo Fricke",
  zone2: "Estadio Sausalito (punto de encuentro)",
  zone3: "Cuartel Bomberos Reñaca",
  zone4: "Refugio Liceo Bicentenario",
  cl: [
    "Evacuar inmediatamente si hay humo visible cerca",
    "Cerrar todas las ventanas + ductos para limitar entrada de brasas",
    "Usar mascarilla N95 al aire libre",
    "Mojar techo + perímetro si hay tiempo",
    "Alejar inflamables ≥10m de la estructura",
    "Preparar bolsa de emergencia (docs, medicamentos, agua, cargador)",
    "Reemplazar filtros HEPA + medios del purificador",
    "Inspeccionar techo + canaletas por daños de brasas",
  ],
  res: ["Mascarillas N95 / KN95", "Camiones aljibe", "Mangueras de incendio", "Asientos bus (evac)", "Agua embotellada", "Catres / colchones"],
  resUnits: ["unidades", "unidades", "unidades", "asientos", "litros", "unidades"],
  alertMessages: [
    "Cortes preventivos en Reñaca Alto + El Salto",
    "Camino Internacional cerrado; buses redirigidos por Av. Borgoño",
    "Todos los operadores nominales",
  ],
  timelineActions: [
    "Confirmar dirección del fuego + viento",
    "Ordenar evacuación por fases de Reñaca Alto",
    "Posicionar buses en punto de encuentro",
    "Abrir refugio en Liceo Bicentenario",
    "Distribuir mascarillas N95 + agua",
    "Evaluar daños en sectores evacuados",
    "Plan de reforestación + control de erosión",
  ],
  weatherDesc: "Caluroso, seco, viento racheado NE",
  weatherAlerts: ["Alerta roja vigente", "Calidad de aire: peligrosa"],
};

function buildWildfire(s: ScenarioStrings): AgentState {
  return {
    crisis: {
      id: "mock:crisis-wf",
      type: "fire",
      severity: "high",
      title: s.crisisTitle,
      description: s.crisisDescription,
      location: { lat: -33.0153, lng: -71.5503, name: "Viña del Mar, Chile" },
      affectedRadius: 8,
      timestamp: NOW,
    },
    safeZones: [
      { id: "mock:zone-wf-1", name: s.zone1, type: "hospital", location: { lat: -33.018, lng: -71.55 }, capacity: 420, status: "open", distance: 1.0, phone: "+56 32 257 7000" },
      { id: "mock:zone-wf-2", name: s.zone2, type: "assembly_point", location: { lat: -33.026, lng: -71.553 }, capacity: 8000, status: "open", distance: 1.6 },
      { id: "mock:zone-wf-3", name: s.zone3, type: "fire_station", location: { lat: -32.973, lng: -71.547 }, status: "open", distance: 4.7, phone: "132" },
      { id: "mock:zone-wf-4", name: s.zone4, type: "shelter", location: { lat: -33.022, lng: -71.555 }, capacity: 500, status: "open", distance: 1.3 },
    ],
    checklist: [
      { id: "mock:cl-wf-1", text: s.cl[0], checked: false, priority: "immediate", category: "evacuation" },
      { id: "mock:cl-wf-2", text: s.cl[1], checked: false, priority: "immediate", category: "structure" },
      { id: "mock:cl-wf-3", text: s.cl[2], checked: false, priority: "immediate", category: "safety" },
      { id: "mock:cl-wf-4", text: s.cl[3], checked: false, priority: "short-term", category: "structure" },
      { id: "mock:cl-wf-5", text: s.cl[4], checked: false, priority: "short-term", category: "structure" },
      { id: "mock:cl-wf-6", text: s.cl[5], checked: false, priority: "short-term", category: "supplies" },
      { id: "mock:cl-wf-7", text: s.cl[6], checked: false, priority: "long-term", category: "supplies" },
      { id: "mock:cl-wf-8", text: s.cl[7], checked: false, priority: "long-term", category: "structure" },
    ],
    resources: [
      { id: "mock:res-wf-1", name: s.res[0], category: "medical", have: 200, need: 800, unit: s.resUnits[0], critical: true },
      { id: "mock:res-wf-2", name: s.res[1], category: "water", have: 2, need: 6, unit: s.resUnits[1], critical: true },
      { id: "mock:res-wf-3", name: s.res[2], category: "tools", have: 14, need: 20, unit: s.resUnits[2], critical: false },
      { id: "mock:res-wf-4", name: s.res[3], category: "transport", have: 120, need: 400, unit: s.resUnits[3], critical: true },
      { id: "mock:res-wf-5", name: s.res[4], category: "water", have: 300, need: 500, unit: s.resUnits[4], critical: false },
      { id: "mock:res-wf-6", name: s.res[5], category: "shelter", have: 180, need: 250, unit: s.resUnits[5], critical: false },
    ],
    alerts: [
      { id: "mock:al-wf-1", service: "electricity", status: "degraded", message: s.alertMessages[0], updatedAt: NOW },
      { id: "mock:al-wf-2", service: "transport", status: "degraded", message: s.alertMessages[1], updatedAt: NOW },
      { id: "mock:al-wf-3", service: "communications", status: "operational", message: s.alertMessages[2], updatedAt: NOW },
    ],
    timeline: [
      { id: "mock:tl-wf-1", phase: "first_5_min", action: s.timelineActions[0], completed: true, order: 1 },
      { id: "mock:tl-wf-2", phase: "first_5_min", action: s.timelineActions[1], completed: false, order: 2 },
      { id: "mock:tl-wf-3", phase: "first_hour", action: s.timelineActions[2], completed: false, order: 1 },
      { id: "mock:tl-wf-4", phase: "first_hour", action: s.timelineActions[3], completed: false, order: 2 },
      { id: "mock:tl-wf-5", phase: "first_day", action: s.timelineActions[4], completed: false, order: 1 },
      { id: "mock:tl-wf-6", phase: "first_day", action: s.timelineActions[5], completed: false, order: 2 },
      { id: "mock:tl-wf-7", phase: "first_week", action: s.timelineActions[6], completed: false, order: 1 },
    ],
    weather: { temperature: 28, windSpeed: 42, humidity: 18, description: s.weatherDesc, alerts: s.weatherAlerts },
    filter: emptyFilter,
    highlightedZoneIds: [],
    selectedZoneId: null,
    header: { title: s.headerTitle, subtitle: s.headerSubtitle },
    activeModule: "overview",
  };
}

export const mockScenariosByLocale: Record<
  Locale,
  Record<MockScenarioId, AgentState>
> = {
  en: {
    earthquake: buildEarthquake(EQ_EN),
    flood: buildFlood(FL_EN),
    wildfire: buildWildfire(WF_EN),
  },
  es: {
    earthquake: buildEarthquake(EQ_ES),
    flood: buildFlood(FL_ES),
    wildfire: buildWildfire(WF_ES),
  },
};

// Backward compat: keep `mockScenarios` (English) for any consumer that
// doesn't yet pass a locale.
export const mockScenarios = mockScenariosByLocale.en;
