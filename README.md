# CrisisOS

> **Generative UI war-room for emergency response.**
> Describe a disaster in chat. AI builds you a live operations canvas in seconds.

<p align="center">
  <img src="apps/frontend/public/banner.jpg" alt="CrisisOS hero" width="780" />
</p>

**Demo video:** _TODO — paste URL here_

---

## What it does

- 🗺️ **Live evac map** — Leaflet + OpenStreetMap. Agent paints safe zones, hospitals, danger areas as it reasons.
- ✅ **Auto-generated evacuation checklist** — agent proposes ordered steps, user toggles as they happen.
- 📦 **Resource inventory** — vehicles, beds, supplies. Status color-coded, agent updates in real time.
- 🚨 **Service alerts feed** — power, water, comms, transit. Severity-tagged.
- 🕒 **Action timeline** — every agent decision and operator action, stamped and reorderable.
- 🌦️ **Live weather** — Open-Meteo, no API key required.

All six modules live in one canvas. The agent populates everything in a single `Command(update=)` after the first user message.

---

## Try it

Type any of these into chat:

```
Earthquake magnitude 7.2 in Santiago, Chile
Wildfire approaching Malibu, 80 mph winds
Coastal flooding in Miami, hurricane category 3
Industrial chemical spill near Houston port
```

---

## Architecture

```
User chat
   ↓
CopilotKit (Next.js 15 / React 19)
   ↓
Hono BFF + CopilotRuntime + Intelligence (Postgres threads, Redis)
   ↓
LangGraph Deep Agent (Python) — Gemini 3.1 Flash-Lite
   ↓
14 frontend tools (state mutators + render tools)
   ↓
AgentState — single source of truth
   ↓
6 canvas modules re-render
```

<details>
<summary><strong>14 frontend tools the agent calls</strong></summary>

| Tool | Type | Purpose |
|---|---|---|
| `setHeader` | mutator | title + subtitle of the canvas |
| `setCrisis` | mutator | crisis metadata (type, severity, location) |
| `setSafeZones` | mutator | Leaflet polygons + markers |
| `setChecklist` | mutator | evacuation steps |
| `setResources` | mutator | inventory rows |
| `setAlerts` | mutator | service alerts |
| `setTimeline` | mutator | action log |
| `setWeather` | mutator | Open-Meteo data |
| `toggleChecklistItem` | mutator | mark a step done |
| `updateResource` | mutator | adjust a resource row |
| `setActiveModule` | mutator | switch canvas tab |
| `highlightZones` | mutator | flash zones on the map |
| `selectZone` | mutator | focus map on a zone |
| `toggleTimelineEntry` | mutator | collapse/expand timeline entry |
| `renderCrisisMiniCard` | render | inline summary card |
| `renderResourceStatus` | render | inline resource status pill |
| `renderEvacChecklist` | render | inline checklist preview |

</details>

---

## Built in 6 hours

Hackathon rules require declaring what was built during the build window vs what came from the starter kit. Here is the honest split.

### ✅ Built today (Tesla Model 3 — 6h)

**Frontend** (`apps/frontend/`)
- Crisis domain types, state shape, derived selectors, optimistic updates
- `CrisisMap`, `ChatPanel`, `PipelineBoard`, `ResourceTable`, `Timeline`, `MockControls`, `Header`
- Sage war-room theme tokens + severity/priority/status chip primitives
- Light/dark theme toggle
- 14 frontend tools registered with CopilotKit

**Agent** (`apps/agent/`)
- `crisis_state.py` — full `CrisisCanvasState` schema
- `prompts.py` — crisis-management system prompt + canvas + tools blocks
- `notion_tools.py` rewritten as crisis tools: `generate_crisis`, `fetch_weather` (Open-Meteo), `generate_timeline`
- `canvas.py` — frontend tool docstrings for the agent

### ♻️ Inherited from CopilotKit's Agentic Interfaces Starter Kit

- CopilotKit v2 runtime + Intelligence (durable Postgres-backed threads)
- Hono BFF scaffolding
- Docker compose stack (Postgres + Redis)
- LangGraph runtime, middleware, telemetry
- Next.js 15 + React 19 shell + thread drawer + Copilot provider

We removed the starter's Notion lead-form demo, A2UI streaming, MCP App scaffolding, and Daytona integration — none are part of CrisisOS.

---

## Stack

| Layer | Tech | Why |
|---|---|---|
| Frontend | Next.js 15, React 19, Tailwind 4, Leaflet, CopilotKit v2 | Generative UI surface + live canvas |
| Agent | Python LangGraph (Deep Agents), Gemini 3.1 Flash-Lite | Cheap, fast, tool-calling, multi-step planning |
| BFF | Hono + CopilotRuntime + Postgres + Redis | Durable threads, agent bridge |
| Maps / Weather | OpenStreetMap, Open-Meteo | Free, no API key |

---

## Run locally

**Requirements:** Node 20+, Python 3.11+, `uv`, Docker.

```bash
npm install
cp .env.example .env
# paste GEMINI_API_KEY into .env
npm run dev
```

`npm run dev` runs `scripts/check-env.sh` first — fails loudly with numbered list if anything's missing, then boots Docker (Postgres + Redis), Next.js UI, Hono BFF and LangGraph agent in one shot.

Open `localhost:3000`, type a crisis prompt.

> Swap models or run without Docker: see `dev-docs/setup.md` and `dev-docs/model-switching.md`.

---

## Team — Tesla Model 3

- **francisco** — frontend (`apps/frontend/`)
- **mgrddev** — agent (`apps/agent/`)

Both pair-programming with Claude Code throughout the build.

## Acknowledgements

Built on top of CopilotKit's Agentic Interfaces Starter Kit — thanks to the CopilotKit, LangChain, Google Gemini, A2UI, Manufact and Daytona teams who shipped the underlying primitives.

## License

MIT.

---

> Built for the **Generative UI Global Hackathon — Agentic Interfaces** track. May 9, 2026.
