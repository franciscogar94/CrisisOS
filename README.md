# CrisisOS

> **Generative UI war-room for emergency response.**
> Describe a disaster in chat. AI builds you a live operations canvas in seconds.

![hackathon](https://img.shields.io/badge/Generative_UI_Hackathon-Agentic_Interfaces-7c3aed)
![built](https://img.shields.io/badge/Built_in-6h-orange)
![license](https://img.shields.io/badge/license-MIT-green)
![next](https://img.shields.io/badge/Next.js-15-black)
![react](https://img.shields.io/badge/React-19-61dafb)
![langgraph](https://img.shields.io/badge/LangGraph-Gemini-4285f4)
![copilotkit](https://img.shields.io/badge/CopilotKit-v2-ff6b6b)

<!-- TODO: replace with real hero GIF (docs/hero.gif) once demo is recorded -->
<p align="center">
  <img src="apps/frontend/public/banner.jpg" alt="CrisisOS hero — placeholder" width="780" />
  <br/>
  <em>Hero GIF placeholder — record once backend is wired and replace.</em>
</p>

**[ Demo video — TODO ] · [Repo](https://github.com/franciscogar94/CrisisOS) · [Hackathon submission — TODO ]**

---

## Demo

<!-- TODO: upload 90-120s demo video to a GitHub comment, copy the user-attachments URL, paste here. -->

> 📹 **Demo video coming.** 90-second walkthrough: type "Earthquake magnitude 7.2 in Santiago" → watch the canvas paint a Leaflet map with safe zones, an evacuation checklist, resource inventory, alerts and a live timeline — all in one shot.

<p align="center">
  <em>[ screenshot — light mode — TODO docs/screenshot-light.png ]</em><br/>
  <em>[ screenshot — dark mode — TODO docs/screenshot-dark.png ]</em>
</p>

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

### ♻️ Inherited from CopilotKit's [Agentic Interfaces Starter Kit](https://github.com/CopilotKit/agentic-interfaces-starter)

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

**Requirements:** Node 20+, Python 3.11+, [`uv`](https://docs.astral.sh/uv/), Docker.

```bash
git clone https://github.com/franciscogar94/CrisisOS
cd CrisisOS
npm install
cp .env.example .env
# paste GEMINI_API_KEY into .env  (https://aistudio.google.com)
npm run dev
```

`npm run dev` runs `scripts/check-env.sh` first — it fails loudly with a numbered list if anything's missing, then boots Docker (Postgres + Redis), the Next.js UI, the Hono BFF and the LangGraph agent in one shot.

Open `http://localhost:3000`, type a crisis prompt.

> Need to swap models or run without Docker? See [`dev-docs/setup.md`](dev-docs/setup.md) and [`dev-docs/model-switching.md`](dev-docs/model-switching.md).

---

## Team — Tesla Model 3

- **francisco** ([@franciscogar94](https://github.com/franciscogar94)) — frontend (`apps/frontend/`)
- **mgrddev** — agent (`apps/agent/`)

Both pair-programming with Claude Code throughout the build.

## Acknowledgements

Built on top of CopilotKit's Agentic Interfaces Starter Kit — thanks to the CopilotKit, LangChain, Google Gemini, A2UI, Manufact and Daytona teams who shipped the underlying primitives.

## License

MIT.

---

> Built for the **Generative UI Global Hackathon — Agentic Interfaces** track. May 9, 2026.
