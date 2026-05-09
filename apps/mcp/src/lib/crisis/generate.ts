import {
  CITIES,
  DEFAULT_CITY,
  TYPE_KEYWORDS,
  TYPE_LABEL_ES,
  SEVERITY_LABEL_ES,
  SEVERITY_RADIUS_KM,
  SEVERITY_NEED_MULT,
  ZONE_SLOTS,
  CHECKLIST_TEMPLATES,
  RESOURCE_TEMPLATES,
  ALERT_BASELINE,
  TIMELINE_TEMPLATES,
  type CityInfo,
} from "./templates";
import type {
  ChecklistItem,
  Crisis,
  CrisisDashboardProps,
  CrisisType,
  Resource,
  SafeZone,
  ServiceAlert,
  ServiceStatus,
  Severity,
  TimelineEntry,
  WeatherData,
} from "./types";

// Pure-TS port of apps/agent/src/notion_tools.py `generate_crisis`. Runs
// inside the MCP server tool handler. No external API dependencies aside
// from Open-Meteo (best-effort, fail silently).

function uid(prefix: string): string {
  // Short hex; collision-safe enough for a single canvas snapshot.
  return `${prefix}-${Math.random().toString(16).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function detectType(description: string): CrisisType {
  const desc = (description ?? "").toLowerCase();
  for (const { type, keywords } of TYPE_KEYWORDS) {
    if (keywords.some((kw) => desc.includes(kw))) return type;
  }
  return "other";
}

export function detectLocation(description: string): CityInfo {
  const desc = (description ?? "").toLowerCase();
  // Longest match first so 'ciudad de méxico' wins over 'méxico'.
  const keys = Object.keys(CITIES).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (desc.includes(key)) return CITIES[key];
  }
  return DEFAULT_CITY;
}

export function detectSeverity(
  description: string,
  crisisType: CrisisType,
): Severity {
  const desc = (description ?? "").toLowerCase();
  if (
    ["catastrófico", "catastrofico", "critical", "crítico", "critico"].some((w) =>
      desc.includes(w),
    )
  ) {
    return "critical";
  }
  if (
    ["grave", "severo", "high", "fuerte", "intenso"].some((w) => desc.includes(w))
  ) {
    return "high";
  }
  if (["moderado", "moderate"].some((w) => desc.includes(w))) return "moderate";
  if (["leve", "menor", "low", "minor"].some((w) => desc.includes(w))) return "low";

  if (crisisType === "earthquake") {
    let m = desc.match(/magnitud[^\d]*(\d+(?:\.\d+)?)/);
    if (!m) m = desc.match(/magnitude[^\d]*(\d+(?:\.\d+)?)/);
    if (!m) m = desc.match(/\b([4-9](?:\.\d)?)\b/);
    if (m) {
      const mag = parseFloat(m[1]);
      if (!Number.isNaN(mag)) {
        if (mag >= 8.0) return "critical";
        if (mag >= 6.5) return "high";
        if (mag >= 5.0) return "moderate";
        return "low";
      }
    }
  }
  return "high";
}

class SeededRng {
  private state: number;

  constructor(seed: string) {
    let h = 0x811c9dc5;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    this.state = h >>> 0;
  }

  next(): number {
    // mulberry32
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

function buildSafeZones(
  crisisType: CrisisType,
  severity: Severity,
  center: CityInfo,
): SafeZone[] {
  const rng = new SeededRng(`${crisisType}-${center.name}`);
  let slots = [...ZONE_SLOTS];
  if (crisisType === "chemical") {
    slots = slots.filter((s) => s.type !== "fire_station").slice(0, 7);
  }

  const capacityMap = {
    hospital: [200, 400, 600],
    shelter: [300, 800, 1500],
    fire_station: [50],
    police: [80],
    assembly_point: [1000, 2500, 5000],
  } as const;

  return slots.map((slot) => {
    const dLat =
      crisisType === "tsunami"
        ? rng.range(0.005, 0.030)
        : rng.range(-0.025, 0.025);
    const dLng =
      crisisType === "tsunami"
        ? rng.range(0.005, 0.025)
        : rng.range(-0.025, 0.025);
    const lat = +(center.lat + dLat).toFixed(5);
    const lng = +(center.lng + dLng).toFixed(5);
    const distKm = +Math.sqrt(
      (dLat * 111.0) ** 2 +
        (dLng * 111.0 * Math.cos((center.lat * Math.PI) / 180)) ** 2,
    ).toFixed(2);

    const status: SafeZone["status"] =
      (severity === "high" || severity === "critical") && rng.next() < 0.25
        ? "full"
        : "open";

    return {
      id: uid("zone"),
      name: slot.name,
      type: slot.type,
      location: { lat, lng },
      capacity: rng.pick(capacityMap[slot.type]),
      status,
      distance: distKm,
      phone: `+56 2 ${Math.floor(rng.range(2000, 2999))} ${Math.floor(
        rng.range(1000, 9999),
      )}`,
    };
  });
}

function buildChecklist(crisisType: CrisisType): ChecklistItem[] {
  const template =
    CHECKLIST_TEMPLATES[crisisType] ?? CHECKLIST_TEMPLATES.other;
  return template.map((row) => ({
    id: uid("chk"),
    text: row.text,
    checked: false,
    priority: row.priority,
    category: row.category,
  }));
}

function buildResources(
  crisisType: CrisisType,
  severity: Severity,
): Resource[] {
  const template =
    RESOURCE_TEMPLATES[crisisType] ?? RESOURCE_TEMPLATES.other;
  const needMult = SEVERITY_NEED_MULT[severity];
  const rng = new SeededRng(`${crisisType}-${severity}-resources`);
  return template.map((row) => {
    const need =
      row.unit === "litros"
        ? needMult * 5
        : row.unit === "raciones"
          ? needMult * 3
          : Math.max(5, Math.floor(needMult / 20));
    const havePct = Math.max(
      0,
      Math.min(1, row.baseHavePct + rng.range(-0.10, 0.10)),
    );
    const have = Math.floor(need * havePct);
    return {
      id: uid("res"),
      name: row.name,
      category: row.category,
      have,
      need,
      unit: row.unit,
      critical: have / Math.max(need, 1) < 0.30,
    };
  });
}

function buildAlerts(
  crisisType: CrisisType,
  severity: Severity,
): ServiceAlert[] {
  const base = ALERT_BASELINE[crisisType] ?? ALERT_BASELINE.other;
  const ts = nowIso();
  return base.map((row) => {
    let status: ServiceStatus = row.status;
    let message = row.message;
    if (
      severity === "critical" &&
      status === "degraded" &&
      ["water", "electricity", "communications"].includes(row.service)
    ) {
      status = "outage";
      message = `${message} — escala crítica`;
    }
    return {
      id: uid("alert"),
      service: row.service,
      status,
      message,
      updatedAt: ts,
    };
  });
}

function buildTimeline(crisisType: CrisisType): TimelineEntry[] {
  const template =
    TIMELINE_TEMPLATES[crisisType] ?? TIMELINE_TEMPLATES.other;
  return template.map((row, i) => ({
    id: uid("tl"),
    phase: row.phase,
    action: row.action,
    completed: false,
    order: i,
  }));
}

const WMO_DESC_ES: Record<number, string> = {
  0: "Despejado",
  1: "Mayormente despejado",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Niebla",
  48: "Niebla con escarcha",
  51: "Llovizna ligera",
  53: "Llovizna moderada",
  55: "Llovizna densa",
  61: "Lluvia ligera",
  63: "Lluvia moderada",
  65: "Lluvia fuerte",
  71: "Nieve ligera",
  73: "Nieve moderada",
  75: "Nieve fuerte",
  80: "Chubascos ligeros",
  81: "Chubascos moderados",
  82: "Chubascos violentos",
  95: "Tormenta eléctrica",
  96: "Tormenta con granizo ligero",
  99: "Tormenta con granizo fuerte",
};

export async function fetchWeather(
  lat: number,
  lng: number,
): Promise<WeatherData | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,wind_speed_10m,relative_humidity_2m,weather_code` +
      `&timezone=auto`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const resp = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!resp.ok) return null;
    const data = await resp.json();
    const cur = data?.current ?? {};
    const code = Math.floor(cur.weather_code ?? 0);
    return {
      temperature: Number(cur.temperature_2m ?? 0),
      windSpeed: Number(cur.wind_speed_10m ?? 0),
      humidity: Number(cur.relative_humidity_2m ?? 0),
      description: WMO_DESC_ES[code] ?? `Código ${code}`,
      alerts: [],
    };
  } catch {
    return null;
  }
}

export async function generateCrisis(
  description: string,
): Promise<CrisisDashboardProps> {
  const desc = (description ?? "").trim();
  const crisisType = detectType(desc);
  const location = detectLocation(desc);
  const severity = detectSeverity(desc, crisisType);
  const radius = SEVERITY_RADIUS_KM[severity];

  const crisis: Crisis = {
    id: uid("crisis"),
    type: crisisType,
    severity,
    title: desc.slice(0, 80) || `Crisis ${crisisType}`,
    description: desc,
    location: { lat: location.lat, lng: location.lng, name: location.name },
    affectedRadius: radius,
    timestamp: nowIso(),
  };

  const safeZones = buildSafeZones(crisisType, severity, location);
  const checklist = buildChecklist(crisisType);
  const resources = buildResources(crisisType, severity);
  const alerts = buildAlerts(crisisType, severity);
  const timeline = buildTimeline(crisisType);
  const weather = await fetchWeather(location.lat, location.lng);

  const immediateCount = checklist.filter((c) => c.priority === "immediate").length;

  const header = {
    title: `${TYPE_LABEL_ES[crisisType]} · ${location.name}`,
    subtitle:
      `Severidad ${SEVERITY_LABEL_ES[severity]} · radio ${radius} km · ` +
      `${safeZones.length} zonas seguras · ${immediateCount} acciones inmediatas`,
  };

  return {
    crisis,
    safeZones,
    checklist,
    resources,
    alerts,
    timeline,
    weather,
    header,
  };
}
