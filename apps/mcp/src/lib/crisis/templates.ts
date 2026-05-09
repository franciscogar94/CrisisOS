import type {
  ChecklistItem,
  CrisisType,
  Priority,
  Resource,
  ResourceCategory,
  Service,
  ServiceAlert,
  ServiceStatus,
  Severity,
  TimelineEntry,
  TimelinePhase,
} from "./types";

// Templates por tipo de crisis. Espejados del Python en
// apps/agent/src/notion_tools.py para mantener consistencia entre el agente
// LangGraph y el MCP server. Texto en español: el demo es en Santiago.

export const SEVERITY_RADIUS_KM: Record<Severity, number> = {
  low: 1.0,
  moderate: 5.0,
  high: 15.0,
  critical: 30.0,
};

export const SEVERITY_NEED_MULT: Record<Severity, number> = {
  low: 50,
  moderate: 200,
  high: 1000,
  critical: 5000,
};

export interface CityInfo {
  lat: number;
  lng: number;
  name: string;
}

export const CITIES: Record<string, CityInfo> = {
  // Chile
  santiago: { lat: -33.4489, lng: -70.6693, name: "Santiago de Chile" },
  valparaiso: { lat: -33.0472, lng: -71.6127, name: "Valparaíso, Chile" },
  "valparaíso": { lat: -33.0472, lng: -71.6127, name: "Valparaíso, Chile" },
  concepcion: { lat: -36.8201, lng: -73.0444, name: "Concepción, Chile" },
  "concepción": { lat: -36.8201, lng: -73.0444, name: "Concepción, Chile" },
  iquique: { lat: -20.2208, lng: -70.1431, name: "Iquique, Chile" },
  antofagasta: { lat: -23.6509, lng: -70.3975, name: "Antofagasta, Chile" },
  valdivia: { lat: -39.8142, lng: -73.2459, name: "Valdivia, Chile" },
  // Perú
  lima: { lat: -12.0464, lng: -77.0428, name: "Lima, Perú" },
  cusco: { lat: -13.5319, lng: -71.9675, name: "Cusco, Perú" },
  arequipa: { lat: -16.4090, lng: -71.5375, name: "Arequipa, Perú" },
  // Argentina
  "buenos aires": {
    lat: -34.6037,
    lng: -58.3816,
    name: "Buenos Aires, Argentina",
  },
  mendoza: { lat: -32.8908, lng: -68.8272, name: "Mendoza, Argentina" },
  cordoba: { lat: -31.4201, lng: -64.1888, name: "Córdoba, Argentina" },
  "córdoba": { lat: -31.4201, lng: -64.1888, name: "Córdoba, Argentina" },
  // Colombia
  bogota: { lat: 4.7110, lng: -74.0721, name: "Bogotá, Colombia" },
  "bogotá": { lat: 4.7110, lng: -74.0721, name: "Bogotá, Colombia" },
  medellin: { lat: 6.2442, lng: -75.5812, name: "Medellín, Colombia" },
  "medellín": { lat: 6.2442, lng: -75.5812, name: "Medellín, Colombia" },
  // México
  "ciudad de mexico": { lat: 19.4326, lng: -99.1332, name: "Ciudad de México" },
  "ciudad de méxico": {
    lat: 19.4326,
    lng: -99.1332,
    name: "Ciudad de México",
  },
  cdmx: { lat: 19.4326, lng: -99.1332, name: "Ciudad de México" },
  guadalajara: { lat: 20.6597, lng: -103.3496, name: "Guadalajara, México" },
  monterrey: { lat: 25.6866, lng: -100.3161, name: "Monterrey, México" },
  // Brasil
  "sao paulo": { lat: -23.5505, lng: -46.6333, name: "São Paulo, Brasil" },
  "são paulo": { lat: -23.5505, lng: -46.6333, name: "São Paulo, Brasil" },
  "rio de janeiro": { lat: -22.9068, lng: -43.1729, name: "Rio de Janeiro, Brasil" },
  // Otros LatAm
  quito: { lat: -0.1807, lng: -78.4678, name: "Quito, Ecuador" },
  caracas: { lat: 10.4806, lng: -66.9036, name: "Caracas, Venezuela" },
  "la paz": { lat: -16.4897, lng: -68.1193, name: "La Paz, Bolivia" },
  montevideo: { lat: -34.9011, lng: -56.1645, name: "Montevideo, Uruguay" },
};

export const DEFAULT_CITY = CITIES.santiago;

export const TYPE_KEYWORDS: { type: CrisisType; keywords: string[] }[] = [
  {
    type: "earthquake",
    keywords: ["terremoto", "sismo", "earthquake", "temblor"],
  },
  {
    type: "flood",
    keywords: ["inundación", "inundacion", "flood", "crecida", "desborde"],
  },
  {
    type: "volcanic",
    keywords: [
      "volcánico",
      "volcanico",
      "volcanic",
      "erupción",
      "erupcion",
      "ceniza",
      "volcán",
      "volcan",
    ],
  },
  {
    type: "fire",
    keywords: ["incendio", "fuego forestal", "wildfire", "fire", "fuego"],
  },
  {
    type: "hurricane",
    keywords: ["huracán", "huracan", "hurricane", "ciclón", "ciclon"],
  },
  { type: "tornado", keywords: ["tornado"] },
  { type: "tsunami", keywords: ["tsunami", "maremoto"] },
  {
    type: "chemical",
    keywords: ["químico", "quimico", "chemical", "tóxico", "toxico", "fuga"],
  },
  {
    type: "blackout",
    keywords: [
      "apagón",
      "apagon",
      "blackout",
      "corte de luz",
      "corte eléctrico",
      "corte electrico",
    ],
  },
];

export const TYPE_LABEL_ES: Record<CrisisType, string> = {
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

export const SEVERITY_LABEL_ES: Record<Severity, string> = {
  low: "leve",
  moderate: "moderada",
  high: "alta",
  critical: "crítica",
};

type SafeZoneType =
  | "shelter"
  | "hospital"
  | "fire_station"
  | "police"
  | "assembly_point";

// Zone slots — paired (type, name). Same set as Python; we jitter coords on
// generation so they look distinct per city.
export const ZONE_SLOTS: { type: SafeZoneType; name: string }[] = [
  { type: "hospital", name: "Hospital Central" },
  { type: "hospital", name: "Hospital Regional Sur" },
  { type: "shelter", name: "Albergue Estadio Municipal" },
  { type: "shelter", name: "Polideportivo Comunal" },
  { type: "fire_station", name: "Estación de Bomberos N°1" },
  { type: "police", name: "Comisaría Central" },
  { type: "assembly_point", name: "Plaza de Armas" },
  { type: "assembly_point", name: "Parque Central" },
];

// Checklist por tipo. (priority, category, text).
type ChecklistRow = { priority: Priority; category: string; text: string };

export const CHECKLIST_TEMPLATES: Record<CrisisType, ChecklistRow[]> = {
  earthquake: [
    {
      priority: "immediate",
      category: "seguridad",
      text: "Agacharse, cubrirse y sujetarse hasta que el sismo termine",
    },
    {
      priority: "immediate",
      category: "seguridad",
      text: "Alejarse de ventanas, espejos y objetos que puedan caer",
    },
    {
      priority: "immediate",
      category: "evaluación",
      text: "Evaluar lesiones propias y de personas cercanas",
    },
    {
      priority: "immediate",
      category: "evaluación",
      text: "Revisar daños estructurales visibles antes de moverse",
    },
    {
      priority: "short-term",
      category: "evacuación",
      text: "Salir del edificio por escaleras (NO usar ascensores)",
    },
    {
      priority: "short-term",
      category: "comunicación",
      text: "Avisar al grupo familiar o equipo del estado",
    },
    {
      priority: "short-term",
      category: "seguridad",
      text: "Cortar suministro de gas si se percibe olor",
    },
    {
      priority: "short-term",
      category: "logística",
      text: "Trasladarse a la zona segura más cercana",
    },
    {
      priority: "long-term",
      category: "preparación",
      text: "Inspección estructural profesional del inmueble",
    },
    {
      priority: "long-term",
      category: "logística",
      text: "Stock de agua y alimentos para 72 horas mínimo",
    },
    {
      priority: "long-term",
      category: "preparación",
      text: "Preparar plan para réplicas en las próximas 48 h",
    },
    {
      priority: "long-term",
      category: "documentación",
      text: "Registrar daños con fotos para seguros",
    },
  ],
  flood: [
    {
      priority: "immediate",
      category: "seguridad",
      text: "Trasladarse a un nivel superior dentro del edificio",
    },
    {
      priority: "immediate",
      category: "seguridad",
      text: "NO caminar en agua con corriente (>15 cm de altura)",
    },
    {
      priority: "immediate",
      category: "seguridad",
      text: "Cortar electricidad si el agua se acerca a tomas",
    },
    {
      priority: "immediate",
      category: "evaluación",
      text: "Identificar vías de escape elevadas",
    },
    {
      priority: "short-term",
      category: "evacuación",
      text: "Evacuar a zona en altitud si la crecida supera 50 cm",
    },
    {
      priority: "short-term",
      category: "comunicación",
      text: "Reportar personas atrapadas a emergencias",
    },
    {
      priority: "short-term",
      category: "logística",
      text: "Llevar documentos en bolsa impermeable",
    },
    {
      priority: "short-term",
      category: "salud",
      text: "Hervir o tratar el agua antes de consumir",
    },
    {
      priority: "long-term",
      category: "preparación",
      text: "Esperar autorización oficial antes de regresar",
    },
    {
      priority: "long-term",
      category: "salud",
      text: "Vacunación / control sanitario tras exposición a agua",
    },
    {
      priority: "long-term",
      category: "logística",
      text: "Limpieza con desinfectante para evitar enfermedades",
    },
    {
      priority: "long-term",
      category: "documentación",
      text: "Registrar daños materiales para seguros",
    },
  ],
  fire: [
    {
      priority: "immediate",
      category: "seguridad",
      text: "Evacuar hacia barlovento (contra el viento)",
    },
    {
      priority: "immediate",
      category: "seguridad",
      text: "Cubrir nariz y boca con paño húmedo",
    },
    {
      priority: "immediate",
      category: "seguridad",
      text: "Cerrar ventanas y puertas para frenar entrada de humo",
    },
    {
      priority: "immediate",
      category: "comunicación",
      text: "Llamar a bomberos (132 en Chile)",
    },
    {
      priority: "short-term",
      category: "evacuación",
      text: "Trasladarse a zona de encuentro asignada",
    },
    {
      priority: "short-term",
      category: "logística",
      text: "Llevar mascarilla N95 si hay disponible",
    },
    {
      priority: "short-term",
      category: "salud",
      text: "Evitar esfuerzo físico — humo daña pulmones",
    },
    {
      priority: "short-term",
      category: "comunicación",
      text: "Mantener radio encendida para alertas oficiales",
    },
    {
      priority: "long-term",
      category: "salud",
      text: "Control médico si hubo exposición prolongada al humo",
    },
    {
      priority: "long-term",
      category: "preparación",
      text: "Esperar autorización oficial para regresar",
    },
    {
      priority: "long-term",
      category: "logística",
      text: "Limpieza profunda de cenizas y residuos tóxicos",
    },
    {
      priority: "long-term",
      category: "documentación",
      text: "Registrar daños y reportar a aseguradora",
    },
  ],
  hurricane: [
    {
      priority: "immediate",
      category: "seguridad",
      text: "Refugiarse en habitación interior sin ventanas",
    },
    {
      priority: "immediate",
      category: "logística",
      text: "Cargar dispositivos electrónicos al máximo",
    },
    {
      priority: "short-term",
      category: "comunicación",
      text: "Sintonizar radio con baterías para alertas",
    },
    {
      priority: "short-term",
      category: "seguridad",
      text: "NO salir durante el ojo del huracán (calma engañosa)",
    },
    {
      priority: "long-term",
      category: "preparación",
      text: "Esperar declaración oficial de fin de alerta",
    },
    {
      priority: "long-term",
      category: "documentación",
      text: "Documentar daños con fotos y video",
    },
  ],
  tornado: [
    {
      priority: "immediate",
      category: "seguridad",
      text: "Refugiarse en sótano o habitación interior sin ventanas",
    },
    {
      priority: "immediate",
      category: "seguridad",
      text: "Cubrirse con colchón o manta gruesa",
    },
    {
      priority: "short-term",
      category: "comunicación",
      text: "Sintonizar radio para confirmar fin de alerta",
    },
    {
      priority: "long-term",
      category: "documentación",
      text: "Registrar daños para seguros",
    },
  ],
  tsunami: [
    {
      priority: "immediate",
      category: "seguridad",
      text: "Trasladarse a terreno alto (>30 m) inmediatamente",
    },
    {
      priority: "immediate",
      category: "seguridad",
      text: "Alejarse de la costa y zonas bajas",
    },
    {
      priority: "short-term",
      category: "evacuación",
      text: "Mantenerse en altura por al menos 6 horas",
    },
    {
      priority: "long-term",
      category: "preparación",
      text: "Esperar autorización oficial antes de regresar",
    },
  ],
  chemical: [
    {
      priority: "immediate",
      category: "seguridad",
      text: "Refugiarse en interior y sellar puertas/ventanas",
    },
    {
      priority: "immediate",
      category: "seguridad",
      text: "Apagar HVAC y sistemas de ventilación",
    },
    {
      priority: "short-term",
      category: "evacuación",
      text: "Evacuar SOLO con instrucción oficial",
    },
    {
      priority: "long-term",
      category: "salud",
      text: "Control médico tras exposición",
    },
  ],
  volcanic: [
    {
      priority: "immediate",
      category: "seguridad",
      text: "Refugiarse en interior y cerrar puertas/ventanas",
    },
    {
      priority: "immediate",
      category: "salud",
      text: "Cubrir nariz y boca con paño húmedo (ceniza es abrasiva)",
    },
    {
      priority: "immediate",
      category: "seguridad",
      text: "Apagar HVAC y sistemas de ventilación externa",
    },
    {
      priority: "immediate",
      category: "evaluación",
      text: "Monitorear dirección del viento (ceniza viaja km)",
    },
    {
      priority: "short-term",
      category: "evacuación",
      text: "Evacuar zona de exclusión si SERNAGEOMIN lo ordena",
    },
    {
      priority: "short-term",
      category: "logística",
      text: "Tener mochila lista con linterna, agua, medicamentos",
    },
    {
      priority: "short-term",
      category: "salud",
      text: "Usar antiparras o lentes para proteger ojos",
    },
    {
      priority: "short-term",
      category: "logística",
      text: "Limpiar techos con menos de 10 cm de ceniza (peso colapsa)",
    },
    {
      priority: "long-term",
      category: "salud",
      text: "Control respiratorio si hubo exposición prolongada",
    },
    {
      priority: "long-term",
      category: "preparación",
      text: "Mantener vigilancia de actividad sísmica volcánica",
    },
    {
      priority: "long-term",
      category: "logística",
      text: "Limpieza de ceniza con agua (NO escoba, levanta polvo)",
    },
    {
      priority: "long-term",
      category: "documentación",
      text: "Registrar daños en techos / vehículos para seguros",
    },
  ],
  blackout: [
    {
      priority: "immediate",
      category: "seguridad",
      text: "Apagar electrodomésticos para evitar daño al volver luz",
    },
    {
      priority: "immediate",
      category: "logística",
      text: "Localizar linternas y radio a baterías",
    },
    {
      priority: "immediate",
      category: "comunicación",
      text: "Reportar el corte a la distribuidora eléctrica",
    },
    {
      priority: "immediate",
      category: "salud",
      text: "Si hay equipos médicos críticos, contactar emergencias",
    },
    {
      priority: "short-term",
      category: "logística",
      text: "Mantener heladera cerrada (4h preserva alimentos)",
    },
    {
      priority: "short-term",
      category: "comunicación",
      text: "Conservar batería del celular para emergencias",
    },
    {
      priority: "short-term",
      category: "logística",
      text: "Cargar power banks si tienen carga residual",
    },
    {
      priority: "short-term",
      category: "salud",
      text: "Vigilar adultos mayores y bebés en olas de calor/frío",
    },
    {
      priority: "long-term",
      category: "logística",
      text: "Descartar alimentos perecibles si corte > 4 horas",
    },
    {
      priority: "long-term",
      category: "preparación",
      text: "Considerar generador o UPS para próximos cortes",
    },
    {
      priority: "long-term",
      category: "documentación",
      text: "Documentar pérdidas en alimentos / equipos quemados",
    },
  ],
  other: [
    {
      priority: "immediate",
      category: "seguridad",
      text: "Mantener la calma y evaluar la situación",
    },
    {
      priority: "immediate",
      category: "comunicación",
      text: "Llamar a servicios de emergencia",
    },
    {
      priority: "short-term",
      category: "evacuación",
      text: "Trasladarse a zona segura más cercana",
    },
    {
      priority: "long-term",
      category: "preparación",
      text: "Esperar autorización oficial antes de regresar",
    },
  ],
};

// Resources por tipo. (name, category, unit, baseline have%).
type ResourceRow = {
  name: string;
  category: ResourceCategory;
  unit: string;
  baseHavePct: number;
};

export const RESOURCE_TEMPLATES: Record<CrisisType, ResourceRow[]> = {
  earthquake: [
    { name: "Agua potable", category: "water", unit: "litros", baseHavePct: 0.20 },
    {
      name: "Alimentos no perecibles",
      category: "food",
      unit: "raciones",
      baseHavePct: 0.30,
    },
    { name: "Botiquines", category: "medical", unit: "unidades", baseHavePct: 0.40 },
    {
      name: "Carpas / refugios",
      category: "shelter",
      unit: "unidades",
      baseHavePct: 0.15,
    },
    {
      name: "Radios portátiles",
      category: "communication",
      unit: "unidades",
      baseHavePct: 0.50,
    },
    {
      name: "Vehículos de rescate",
      category: "transport",
      unit: "unidades",
      baseHavePct: 0.25,
    },
    {
      name: "Linternas / herramientas",
      category: "tools",
      unit: "unidades",
      baseHavePct: 0.35,
    },
  ],
  flood: [
    { name: "Agua potable", category: "water", unit: "litros", baseHavePct: 0.10 },
    {
      name: "Alimentos no perecibles",
      category: "food",
      unit: "raciones",
      baseHavePct: 0.20,
    },
    {
      name: "Medicamentos / botiquines",
      category: "medical",
      unit: "unidades",
      baseHavePct: 0.30,
    },
    {
      name: "Botes / lanchas de rescate",
      category: "transport",
      unit: "unidades",
      baseHavePct: 0.15,
    },
    {
      name: "Bombas de achique",
      category: "tools",
      unit: "unidades",
      baseHavePct: 0.25,
    },
    {
      name: "Radios portátiles",
      category: "communication",
      unit: "unidades",
      baseHavePct: 0.45,
    },
  ],
  fire: [
    { name: "Agua / cisternas", category: "water", unit: "litros", baseHavePct: 0.30 },
    { name: "Mascarillas N95", category: "medical", unit: "unidades", baseHavePct: 0.40 },
    {
      name: "Equipos de oxígeno",
      category: "medical",
      unit: "unidades",
      baseHavePct: 0.20,
    },
    {
      name: "Camiones cisterna",
      category: "transport",
      unit: "unidades",
      baseHavePct: 0.25,
    },
    {
      name: "Radios bomberiles",
      category: "communication",
      unit: "unidades",
      baseHavePct: 0.55,
    },
    { name: "Hachas / palas", category: "tools", unit: "unidades", baseHavePct: 0.40 },
  ],
  hurricane: [
    { name: "Agua potable", category: "water", unit: "litros", baseHavePct: 0.15 },
    { name: "Alimentos", category: "food", unit: "raciones", baseHavePct: 0.25 },
    { name: "Botiquines", category: "medical", unit: "unidades", baseHavePct: 0.40 },
    {
      name: "Generadores eléctricos",
      category: "tools",
      unit: "unidades",
      baseHavePct: 0.20,
    },
  ],
  tornado: [
    { name: "Botiquines", category: "medical", unit: "unidades", baseHavePct: 0.35 },
    {
      name: "Refugios temporales",
      category: "shelter",
      unit: "unidades",
      baseHavePct: 0.25,
    },
    {
      name: "Radios con baterías",
      category: "communication",
      unit: "unidades",
      baseHavePct: 0.50,
    },
  ],
  tsunami: [
    { name: "Agua potable", category: "water", unit: "litros", baseHavePct: 0.10 },
    {
      name: "Alimentos no perecibles",
      category: "food",
      unit: "raciones",
      baseHavePct: 0.15,
    },
    { name: "Botiquines", category: "medical", unit: "unidades", baseHavePct: 0.25 },
    {
      name: "Buses de evacuación",
      category: "transport",
      unit: "unidades",
      baseHavePct: 0.30,
    },
  ],
  chemical: [
    {
      name: "Mascarillas químicas",
      category: "medical",
      unit: "unidades",
      baseHavePct: 0.20,
    },
    { name: "Trajes hazmat", category: "medical", unit: "unidades", baseHavePct: 0.10 },
    {
      name: "Refugios sellados",
      category: "shelter",
      unit: "unidades",
      baseHavePct: 0.20,
    },
  ],
  volcanic: [
    {
      name: "Mascarillas N95 / antipolvo",
      category: "medical",
      unit: "unidades",
      baseHavePct: 0.30,
    },
    {
      name: "Antiparras / protección ocular",
      category: "medical",
      unit: "unidades",
      baseHavePct: 0.20,
    },
    { name: "Agua potable", category: "water", unit: "litros", baseHavePct: 0.25 },
    {
      name: "Alimentos no perecibles",
      category: "food",
      unit: "raciones",
      baseHavePct: 0.35,
    },
    {
      name: "Refugios sellados",
      category: "shelter",
      unit: "unidades",
      baseHavePct: 0.20,
    },
    {
      name: "Buses de evacuación",
      category: "transport",
      unit: "unidades",
      baseHavePct: 0.20,
    },
    {
      name: "Radios con baterías",
      category: "communication",
      unit: "unidades",
      baseHavePct: 0.50,
    },
    {
      name: "Lonas / cubiertas para techos",
      category: "tools",
      unit: "unidades",
      baseHavePct: 0.25,
    },
  ],
  blackout: [
    {
      name: "Generadores eléctricos",
      category: "tools",
      unit: "unidades",
      baseHavePct: 0.10,
    },
    {
      name: "Power banks / baterías",
      category: "tools",
      unit: "unidades",
      baseHavePct: 0.40,
    },
    {
      name: "Velas y linternas",
      category: "tools",
      unit: "unidades",
      baseHavePct: 0.55,
    },
    { name: "Hielo / refrigerantes", category: "food", unit: "kg", baseHavePct: 0.15 },
    {
      name: "Alimentos no perecibles",
      category: "food",
      unit: "raciones",
      baseHavePct: 0.30,
    },
    {
      name: "Radios con baterías",
      category: "communication",
      unit: "unidades",
      baseHavePct: 0.45,
    },
    {
      name: "Combustible para generadores",
      category: "tools",
      unit: "litros",
      baseHavePct: 0.20,
    },
  ],
  other: [
    { name: "Agua potable", category: "water", unit: "litros", baseHavePct: 0.25 },
    { name: "Alimentos", category: "food", unit: "raciones", baseHavePct: 0.30 },
    { name: "Botiquines", category: "medical", unit: "unidades", baseHavePct: 0.40 },
  ],
};

type AlertRow = { service: Service; status: ServiceStatus; message: string };

export const ALERT_BASELINE: Record<CrisisType, AlertRow[]> = {
  earthquake: [
    { service: "electricity", status: "outage", message: "Cortes de energía en sectores afectados" },
    { service: "water", status: "degraded", message: "Suministro de agua potable comprometido" },
    { service: "gas", status: "outage", message: "Gas cortado preventivamente" },
    {
      service: "communications",
      status: "degraded",
      message: "Saturación de red móvil — usar SMS",
    },
    { service: "internet", status: "degraded", message: "Conectividad intermitente" },
    {
      service: "transport",
      status: "outage",
      message: "Metro y trenes detenidos para inspección",
    },
  ],
  flood: [
    { service: "electricity", status: "outage", message: "Cortes preventivos en zonas anegadas" },
    { service: "water", status: "degraded", message: "Agua potable contaminada por desbordes" },
    {
      service: "communications",
      status: "degraded",
      message: "Antenas afectadas en zonas bajas",
    },
    { service: "transport", status: "outage", message: "Rutas principales cortadas por agua" },
  ],
  fire: [
    { service: "electricity", status: "degraded", message: "Cortes en sectores próximos al fuego" },
    { service: "transport", status: "degraded", message: "Rutas de evacuación con tráfico denso" },
  ],
  hurricane: [
    { service: "electricity", status: "outage", message: "Cortes generalizados por viento" },
    { service: "internet", status: "outage", message: "Sin servicio en zonas afectadas" },
    {
      service: "transport",
      status: "outage",
      message: "Aeropuertos cerrados, rutas cortadas",
    },
  ],
  tornado: [
    { service: "electricity", status: "outage", message: "Cortes en zona de paso" },
    { service: "transport", status: "degraded", message: "Rutas con escombros" },
  ],
  tsunami: [
    { service: "electricity", status: "outage", message: "Cortes en zona costera" },
    { service: "communications", status: "degraded", message: "Saturación masiva de red" },
    { service: "transport", status: "outage", message: "Rutas costeras cortadas" },
  ],
  chemical: [
    {
      service: "water",
      status: "outage",
      message: "Suministro suspendido por contaminación",
    },
    { service: "transport", status: "degraded", message: "Cordón sanitario en zona afectada" },
  ],
  volcanic: [
    {
      service: "electricity",
      status: "degraded",
      message: "Cortes esporádicos por ceniza en transformadores",
    },
    {
      service: "water",
      status: "degraded",
      message: "Posible contaminación por ceniza en estanques",
    },
    {
      service: "internet",
      status: "degraded",
      message: "Antenas con interferencia por ceniza",
    },
    {
      service: "transport",
      status: "outage",
      message: "Aeropuertos cerrados — ceniza daña turbinas",
    },
  ],
  blackout: [
    {
      service: "electricity",
      status: "outage",
      message: "Corte total de suministro eléctrico",
    },
    {
      service: "water",
      status: "degraded",
      message: "Bombas sin energía — presión cayendo",
    },
    {
      service: "communications",
      status: "degraded",
      message: "Antenas en respaldo (~4 h de batería)",
    },
    {
      service: "internet",
      status: "outage",
      message: "Sin servicio en zonas residenciales",
    },
    {
      service: "transport",
      status: "outage",
      message: "Semáforos apagados — Metro detenido",
    },
  ],
  other: [
    { service: "electricity", status: "operational", message: "Operativo" },
    { service: "communications", status: "operational", message: "Operativo" },
  ],
};

type TimelineRow = { phase: TimelinePhase; action: string };

export const TIMELINE_TEMPLATES: Record<CrisisType, TimelineRow[]> = {
  earthquake: [
    { phase: "first_5_min", action: "Resguardarse hasta que cese el sismo" },
    { phase: "first_5_min", action: "Evaluar lesiones inmediatas" },
    { phase: "first_hour", action: "Evacuar edificios potencialmente dañados" },
    { phase: "first_hour", action: "Activar puntos de encuentro" },
    { phase: "first_day", action: "Inspección estructural por equipos especializados" },
    { phase: "first_day", action: "Distribución inicial de agua y alimentos" },
    { phase: "first_week", action: "Restablecimiento progresivo de servicios" },
    { phase: "first_week", action: "Reubicación de damnificados en albergues" },
  ],
  flood: [
    { phase: "first_5_min", action: "Trasladarse a niveles altos" },
    { phase: "first_hour", action: "Activar rutas de evacuación elevadas" },
    { phase: "first_day", action: "Distribución de agua potable embotellada" },
    { phase: "first_week", action: "Limpieza y desinfección de zonas anegadas" },
  ],
  fire: [
    { phase: "first_5_min", action: "Llamar a bomberos y evaluar dirección del viento" },
    { phase: "first_hour", action: "Despliegue de carros bomba y aviones cisterna" },
    { phase: "first_day", action: "Combate sostenido y vigilancia de focos secundarios" },
    { phase: "first_week", action: "Control de daños y reforestación" },
  ],
  hurricane: [
    { phase: "first_5_min", action: "Refugiarse en habitación interior segura" },
    { phase: "first_hour", action: "Monitoreo continuo del trayecto del huracán" },
    { phase: "first_day", action: "Evaluación de daños tras paso del fenómeno" },
    { phase: "first_week", action: "Reconstrucción de techos, vidrios y postes caídos" },
  ],
  tornado: [
    { phase: "first_5_min", action: "Refugiarse en sótano o habitación interior" },
    { phase: "first_hour", action: "Evaluación de daños y rescate" },
    { phase: "first_week", action: "Reconstrucción y soporte psicológico" },
  ],
  tsunami: [
    { phase: "first_5_min", action: "Activar alarmas y evacuar a altura" },
    { phase: "first_hour", action: "Mantener evacuación — esperar trenes de olas adicionales" },
    { phase: "first_day", action: "Búsqueda y rescate en zonas costeras" },
    { phase: "first_week", action: "Reconstrucción de infraestructura costera" },
  ],
  chemical: [
    { phase: "first_5_min", action: "Sellar interiores y apagar ventilación" },
    { phase: "first_hour", action: "Despliegue de equipos hazmat" },
    { phase: "first_day", action: "Descontaminación profesional del área" },
    { phase: "first_week", action: "Seguimiento médico de personas expuestas" },
  ],
  volcanic: [
    {
      phase: "first_5_min",
      action: "Refugiarse en interior y monitorear dirección del viento",
    },
    {
      phase: "first_5_min",
      action: "Sintonizar SERNAGEOMIN para estado de actividad",
    },
    {
      phase: "first_hour",
      action: "Activar zona de exclusión según radio de impacto",
    },
    {
      phase: "first_hour",
      action: "Despliegue de mascarillas N95 a la población",
    },
    {
      phase: "first_day",
      action: "Limpieza de techos y vías principales (peso de ceniza)",
    },
    {
      phase: "first_day",
      action: "Inspección sanitaria de aguas de consumo",
    },
    {
      phase: "first_week",
      action: "Restablecimiento progresivo de aeropuertos",
    },
    {
      phase: "first_week",
      action: "Vigilancia continua de actividad sísmica volcánica",
    },
  ],
  blackout: [
    {
      phase: "first_5_min",
      action: "Confirmar el corte y reportar a la distribuidora",
    },
    {
      phase: "first_hour",
      action: "Activar generadores en hospitales y servicios críticos",
    },
    {
      phase: "first_hour",
      action: "Comunicación oficial sobre tiempo estimado de restauración",
    },
    {
      phase: "first_day",
      action: "Distribución de hielo y agua a barrios afectados",
    },
    {
      phase: "first_day",
      action: "Atención prioritaria a equipos médicos domiciliarios",
    },
    {
      phase: "first_week",
      action: "Auditoría del sistema eléctrico para evitar recurrencia",
    },
  ],
  other: [
    { phase: "first_5_min", action: "Evaluación inicial de la situación" },
    { phase: "first_hour", action: "Activación de equipos de respuesta" },
    { phase: "first_day", action: "Estabilización y atención a afectados" },
    { phase: "first_week", action: "Reconstrucción y normalización" },
  ],
};
