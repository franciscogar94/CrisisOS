# Frontend ↔ Backend Integration Guide

Guía para conectar el frontend de CrisisOS al backend (LangGraph agent + CopilotKit BFF).

> **TL;DR:** El frontend habla con el BFF (Hono) vía `/api/copilotkit/*`. El BFF rutea al agente Python (LangGraph) y a Intelligence. No tienes que hablar directo con el agente.

---

## 1. URLs

### Producción (Cloud Run · `southamerica-west1`)

| Servicio | URL | Notas |
|----------|-----|-------|
| **BFF** (target principal) | `https://crisisos-bff-264648594075.southamerica-west1.run.app` | Base path: `/api/copilotkit` |
| **Agent** (LangGraph) | `https://crisisos-agent-264648594075.southamerica-west1.run.app` | Solo para debugging directo |
| **Intelligence** | `https://crisisos-intelligence-264648594075.southamerica-west1.run.app` | ⚠️ caído por multi-port issue. UI debe fallback a polling |
| **Frontend reference** | `https://crisisos-frontend-264648594075.southamerica-west1.run.app` | Versión deployada (rama master, lead-flavor todavía) |

### Local

| Servicio | URL local |
|----------|-----------|
| BFF | `http://localhost:4010` |
| Agent | `http://localhost:8133` |
| Intelligence app-api | `http://localhost:4213` |
| Intelligence realtime | `http://localhost:4413` |
| Postgres | `localhost:5436` |
| Redis | `localhost:6382` |

---

## 2. Variables de entorno (frontend)

Crea `apps/frontend/.env.local`:

```bash
# Producción
BFF_URL=https://crisisos-bff-264648594075.southamerica-west1.run.app

# Local (si corres el stack completo con `npm run dev:full`)
# BFF_URL=http://localhost:4010
```

El frontend NO necesita keys de Gemini, Intelligence ni nada — todo eso vive en el BFF.

---

## 3. Wiring — cómo fluye un request

```
Browser
  │
  ▼
Next.js App Router  (apps/frontend)
  │  next.config.ts rewrite:
  │  /api/copilotkit/* → $BFF_URL/api/copilotkit/*
  ▼
BFF · Hono  (apps/bff, puerto 4010)
  │  CopilotRuntime v2 + Intelligence + LangGraphAgent
  ├──► Agent (LangGraph)  → genera tool calls
  ├──► Intelligence       → persiste threads
  └──► MCP apps           → tools opcionales
```

**Por qué BFF separado:** `@copilotkit/runtime/v2` arrastra `express` que Next.js no puede tree-shakear dentro de un App Router API route. Se levanta como Hono server aparte, Next hace rewrite. Cero CORS porque las URLs son relativas.

---

## 4. Setup en el frontend

### 4.1 `next.config.ts` (rewrites)

```ts
import type { NextConfig } from "next";

const config: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/copilotkit/:path*",
        destination: `${process.env.BFF_URL}/api/copilotkit/:path*`,
      },
    ];
  },
};

export default config;
```

### 4.2 Provider en el layout

```tsx
import { CopilotKit } from "@copilotkit/react-core";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <CopilotKit
          runtimeUrl="/api/copilotkit"
          agent="default"
        >
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}
```

El nombre del agente es `default` (registrado en el BFF como `LangGraphAgent$1`).

---

## 5. Contrato de Frontend Tools (CRÍTICO)

El agente Python invoca **estos 16 nombres EXACTOS**. Si no los declaras o renombras alguno, el canvas no se puebla.

### State mutators (13)

| Tool | Args | Efecto |
|------|------|--------|
| `setHeader` | `{ title, subtitle, severityBadge }` | Header del canvas |
| `setCrisis` | `Crisis` (objeto completo) | Datos generales de la crisis |
| `setSafeZones` | `SafeZone[]` | Zonas seguras en el mapa |
| `setChecklist` | `ChecklistItem[]` | Lista de evacuación |
| `setResources` | `Resource[]` | Recursos disponibles/necesarios |
| `setAlerts` | `ServiceAlert[]` | Alertas activas de servicios |
| `setTimeline` | `TimelineEntry[]` | Timeline 4 fases (immediate/short/medium/long) |
| `setWeather` | `WeatherData \| null` | Datos Open-Meteo |
| `toggleChecklistItem` | `{ id }` | Marca/desmarca un item |
| `updateResource` | `{ id, have?, need? }` | Actualiza barra de recurso |
| `setActiveModule` | `{ module }` | Cambia el módulo activo del canvas |
| `highlightZones` | `{ zoneIds: string[] }` | Highlight visual de zonas |
| `selectZone` | `{ zoneId }` | Selecciona una zona específica |

### Render tools (3)

| Tool | Renderiza |
|------|-----------|
| `renderCrisisMiniCard` | Card resumen inline en el chat |
| `renderEvacChecklist` | Checklist inline en el chat |
| `renderResourceStatus` | Status de recursos inline en el chat |

### Ejemplo — declarar un tool

```tsx
"use client";
import { useFrontendTool } from "@copilotkit/react-core";
import { z } from "zod";

useFrontendTool({
  name: "setCrisis",
  description: "Set the active crisis on the canvas",
  parameters: z.object({
    type: z.enum(["earthquake", "flood", "fire", "hurricane", "tornado", "tsunami", "chemical", "other"]),
    severity: z.enum(["low", "medium", "high", "critical"]),
    location: z.object({
      city: z.string(),
      lat: z.number(),
      lng: z.number(),
    }),
    description: z.string(),
    magnitude: z.number().optional(),
  }),
  handler: async (crisis) => {
    setCrisisStore(crisis); // tu zustand/context store
  },
});
```

> **⚠️ NO registres estos tools también en Python.** Gemini explota con `Duplicate function declaration found`. Los frontend tools van SOLO en React.

---

## 6. State shape

El backend escribe `CrisisCanvasState`. Schemas Zod completos en el repo:
- `apps/agent/src/lead_state.py` (Python, autoritativo)
- `apps/mcp/src/lib/crisis/types.ts` (TypeScript, copia espejada — usar este)

```ts
// apps/frontend/src/lib/crisis/types.ts (responsabilidad del frontend)
import { z } from "zod";

export const CrisisSchema = z.object({
  type: z.enum(["earthquake", "flood", "fire", "hurricane", "tornado", "tsunami", "chemical", "other"]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  location: z.object({
    city: z.string(),
    lat: z.number(),
    lng: z.number(),
  }),
  description: z.string(),
  magnitude: z.number().optional(),
  startedAt: z.string().optional(),
});

export const SafeZoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["shelter", "hospital", "open-area", "rally-point"]),
  lat: z.number(),
  lng: z.number(),
  capacity: z.number(),
  status: z.enum(["available", "filling", "full", "unknown"]),
});

export const ChecklistItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  priority: z.enum(["critical", "high", "medium", "low"]),
  completed: z.boolean(),
  category: z.string(),
});

export const ResourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  unit: z.string(),
  have: z.number(),
  need: z.number(),
  category: z.string(),
});

// ... ServiceAlert, TimelineEntry, WeatherData
// Schemas completos: apps/mcp/src/lib/crisis/types.ts
```

> **Regla:** si el backend agrega un campo, el frontend lo replica ese mismo commit. Templates Python ↔ TS deben quedar **espejados**.

---

## 7. Test de conexión

### 7.1 Smoke test — health del BFF

```bash
curl https://crisisos-bff-264648594075.southamerica-west1.run.app/api/copilotkit/info
```

Deberías ver el listado de agentes registrados (`default`).

### 7.2 Smoke test — agent directo (bypass BFF)

```bash
# Crear thread
THREAD=$(curl -sX POST https://crisisos-agent-264648594075.southamerica-west1.run.app/threads \
  -H "Content-Type: application/json" -d '{}' | jq -r .thread_id)

# Mandar prompt y esperar respuesta sincrónica
curl -sX POST "https://crisisos-agent-264648594075.southamerica-west1.run.app/threads/$THREAD/runs/wait" \
  -H "Content-Type: application/json" \
  -d '{
    "assistant_id": "default",
    "input": { "messages": [{ "role": "user", "content": "Terremoto magnitud 7 en Santiago" }] }
  }' | jq .
```

Si funciona, ves tool calls a `generate_crisis` + `renderCrisisMiniCard` y el state poblado con 8 safeZones, 12 checklist items, 7 resources, 6 alerts, 11 timeline entries, weather y header.

Latencia: ~30s primer turno (cold start), ~15s warm.

### 7.3 Smoke test — frontend → BFF

Con el frontend corriendo (`npm run dev` en `apps/frontend`):

```bash
curl http://localhost:3010/api/copilotkit/info
```

Si devuelve 200 con info del runtime, el rewrite está bien.

---

## 8. Demo prompts

Para validar end-to-end:

- "Genera plan para terremoto magnitud 7 en Santiago"
- "Inundación severa en Lima"
- "Incendio forestal en Buenos Aires, evacuación urgente"
- "Tsunami alerta en Valparaíso"

Default city = Santiago (-33.4489, -70.6693) si la descripción no menciona ciudad conocida (12 ciudades LatAm en el diccionario).

---

## 9. Troubleshooting

| Síntoma | Causa probable | Fix |
|---------|----------------|-----|
| Tool calls llegan pero el canvas no se puebla | Nombres de tools no matchean | Revisar los 16 nombres exactos de la sección 5 |
| `Duplicate function declaration found` | Tool registrado en Python Y React | Sacar el registro Python, dejar solo React |
| 503 en cualquier endpoint del BFF | Intelligence caído | Modo degradado: el chat funciona pero los threads no persisten entre refresh |
| Cold start ~30s | Cloud Run scale-to-zero | Normal en hackathon, después de 1 prompt queda warm |
| `weather` viene `null` | Open-Meteo timeout (4s) | Esperado, el backend hace fail silently |
| Latencia >20s warm | Runtime en `gemini-flash-deep` | Cambiar `AGENT_RUNTIME=gemini-flash-react` en `.env` del agente |

---

## 10. Recursos

- Arquitectura completa: [`architecture.md`](./architecture.md)
- Customización (agregar tools, suggestion chips, HITL): [`customization.md`](./customization.md)
- Threads durables: [`threads.md`](./threads.md)
- Demo prompts: [`demo-prompts.md`](./demo-prompts.md)
- CopilotKit docs: https://docs.copilotkit.ai
- AG-UI protocol: https://docs.copilotkit.ai/learn/ag-ui

---

**Contacto backend:** Persona B (este equipo). Cualquier cosa que rompa o falte, avisar antes de hackear workarounds.
