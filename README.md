# CrisisOS — AI co-pilot for emergency response

> **Generative UI Global Hackathon · Santiago de Chile · 9 May 2026**
> **Track:** Agentic Interfaces

CrisisOS is an agentic interface for crisis managers. You describe an event in natural language ("magnitude 7 earthquake in Santiago, Chile") and a LangGraph agent generates a structured response plan — severity, impact radius, safe zones, immediate actions, resource allocation — and renders it live on a canvas you can keep editing by talking to it.

The agent does not return a wall of text. It drives the UI directly through the AG-UI protocol: each tool call mutates the canvas state, and the canvas re-renders as the plan takes shape.

**Live demo (production, GCP Cloud Run, region `southamerica-west1`):**

- Frontend → https://crisisos-frontend-264648594075.southamerica-west1.run.app
- BFF (CopilotKit runtime) → https://crisisos-bff-264648594075.southamerica-west1.run.app
- Agent (LangGraph) → https://crisisos-agent-264648594075.southamerica-west1.run.app

---

## Why this exists

Chile is one of the most seismic countries on Earth. When the next large earthquake hits, the first hour is decided by the quality of the plan that emergency teams improvise in the chaos: where to evacuate, what radius is unsafe, which hospitals are still reachable, what resources are inbound.

Today that plan is built by humans staring at maps and phones. CrisisOS shrinks the first-hour decision loop from hours to seconds: describe the event, get a structured plan, edit it conversationally, and hand it off. The same pattern generalises to wildfires, floods, tsunamis, and industrial accidents.

This is **not the starter kit's lead-triage demo**. We tore out the Notion lead pipeline and rebuilt the agent, the canvas state, the toolset, and the MCP server around crisis management. Every domain object you see — `CrisisEvent`, `SafeZone`, `ImmediateAction`, `ResourceAllocation` — was designed for this use case.

---

## What we built

### 1. A LangGraph agent that drives a canvas through AG-UI

The agent (`apps/agent/`) is a Python LangGraph workflow running the `gemini-flash-react` runtime — plain `langchain.agents.create_agent` on top of Gemini 3.1 Flash-Lite. We benchmarked it against the kit's default `gemini-flash-deep` (deepagents planner): **15s vs 41s end-to-end** for the demo prompt. For a hackathon demo, that's the difference between holding attention and losing it.

Each agent tool returns a `Command(update={...})` that mutates a strongly-typed canvas state via AG-UI's `STATE_SNAPSHOT` event. The frontend subscribes to those snapshots and repaints reactively. There is no polling, no manual sync, no "click refresh" anywhere in the loop.

### 2. AG-UI used with depth, not as a pass-through

The CopilotKit runtime exposes **16 frontend tools** to the agent — 13 mutators that change canvas state and 3 render tools that stream rich components from the agent into the UI. The agent picks tools, the frontend renders. The contract between agent and frontend lives in `dev-docs/frontend-integration.md` (Zod-typed state shape, tool signatures, smoke tests).

This is the part the rubric calls "A2UI / AG-UI used with depth, not superficially". We picked AG-UI because the canvas needs **bidirectional state**: the agent writes plan structure, the user edits cards inline, and both views stay coherent. A pure render-only Gen UI surface would have made that impossible.

### 3. A deployable MCP server (Claude / ChatGPT connector)

`apps/mcp/` is a stand-alone MCP server built on `mcp-use` that exposes the same crisis-planning capability as a connector you can install in Claude Web or ChatGPT. Three tools + one unified widget. Boots in ~900ms locally; deploys to Manufact Cloud with one command. This is the third surface for the same agent — web canvas, embedded chat, and now any MCP host.

### 4. Production deploy on GCP

Five Cloud Run services in `southamerica-west1` (Santiago) — frontend, BFF, agent, intelligence (legacy), MCP — backed by Cloud SQL (Postgres 16) and Memorystore (Redis 7) over a VPC connector. Service account scoped to runtime roles only. Eight secrets in Secret Manager. The `Dockerfile` for each service is in this repo; the deploy gotchas we hit (and the workarounds) are documented in `dev-docs/architecture.md`.

The BFF currently runs in **headless mode** (`mode: "sse"`) because the upstream `copilotkit/intelligence/composite:0.1.0` image has a legacy-services crash loop we could not patch from outside. Headless trade-off: no chat thread persistence across reloads. The plan, the agent run, the tool calls, and the canvas updates all work end-to-end. Documented honestly in `dev-docs/architecture.md`.

---

## Demo path (what you'll see in the video)

1. Open the frontend at the URL above.
2. In the chat sidebar, type: **"Genera un plan de respuesta para un terremoto magnitud 7 en Santiago de Chile"** (or in English).
3. The agent runs `generate_crisis` → `Command(update={...})` → `STATE_SNAPSHOT` arrives in the frontend → the canvas header repaints to **"Terremoto · Santiago de Chile / Severidad alta · radio 15.0 km · 8 zonas seguras · 4 acciones inmediatas"**.
4. Continue the conversation: "Add 3 more safe zones in Las Condes" → new tool call → canvas updates.
5. Open the same agent as an MCP connector in Claude or ChatGPT — same tools, same plan structure, different surface.

---

## Stack

| Layer | Tech | Why |
| --- | --- | --- |
| Frontend | Next.js 15 (App Router), React 19, TypeScript | Canvas + chat sidebar, deployed on Cloud Run |
| Agent runtime | CopilotKit v2 (AG-UI protocol, SSE transport) | Bidirectional state, 16 frontend tools |
| BFF | Hono on Node 20 | CopilotKit runtime + agent proxy, headless mode |
| Agent | LangGraph 0.8.7 (Python), `gemini-flash-react` runtime | Tool-driven planning, low-latency Gemini path |
| Model | Gemini 3.1 Flash-Lite | 15s end-to-end demo response |
| MCP server | `mcp-use` (TypeScript) | Connector for Claude Web / ChatGPT |
| Infra | GCP Cloud Run + Cloud SQL + Memorystore + VPC Connector + Secret Manager | One region, southamerica-west1 |

Full architecture diagram and deployment notes live in [`dev-docs/architecture.md`](dev-docs/architecture.md).

---

## Run it locally

Requires Node 20+, Python 3.12+ with `uv`, Docker Desktop running.

```bash
git clone https://github.com/franciscogar94/CrisisOS.git
cd CrisisOS
cp .env.example .env
# Drop a Gemini API key into .env (root) AND apps/agent/.env
npm install
npm run dev      # boots frontend (3010), BFF (4000), agent (8133)
# OR
npm run dev:full # adds the MCP server (apps/mcp/, port 8901)
```

The pre-flight script (`scripts/check-env.sh`) fails loudly with a numbered list if anything is missing. See [`dev-docs/troubleshooting.md`](dev-docs/troubleshooting.md) for fixes per failure mode.

To talk to the **production stack** instead of running the agent locally, point the local frontend at the deployed BFF:

```bash
# apps/frontend/.env.local
BFF_URL=https://crisisos-bff-264648594075.southamerica-west1.run.app
```

```bash
cd apps/frontend && npm run dev
# open http://localhost:3010
```

---

## Repo layout

```
.
├── apps/
│   ├── agent/                  ← LangGraph agent (Python), gemini-flash-react runtime
│   │   └── src/
│   │       ├── runtime.py      ← Gemini wiring + agent factory
│   │       ├── tools/          ← Crisis-domain tools (generate_crisis, add_safe_zone, …)
│   │       └── state.py        ← Typed canvas state (CrisisEvent, SafeZone, …)
│   ├── bff/                    ← Hono BFF, CopilotKit runtime in headless SSE mode
│   ├── frontend/               ← Next.js 15 canvas + chat sidebar
│   └── mcp/                    ← mcp-use MCP server (Claude / ChatGPT connector)
├── deployment/                 ← Dockerfiles + Cloud Build configs
├── dev-docs/
│   ├── architecture.md         ← System diagram, AG-UI flow, deploy gotchas
│   ├── frontend-integration.md ← 16 tools contract (Zod), state shape, smoke tests
│   ├── submission/             ← Hackathon submission artifacts (video script, post)
│   └── STARTER_KIT_README.md   ← Original starter kit README (kept for traceability)
└── scripts/                    ← Dev / preflight / deploy helpers
```

---

## What we deliberately did NOT do

- **No A2UI declarative components yet.** AG-UI carries our state and tool calls; A2UI would have added a second protocol surface for marginal gain in a 1-day build. Documented as future work.
- **No persistent chat threads in production.** BFF runs headless to dodge the upstream Intelligence crash loop. Re-enabling Intelligence is a single env-var flip once the upstream image ships a fix.
- **No mock data in the demo.** The plan you see is generated by Gemini in real time against the real production stack. If the network drops, the demo drops with it. We accept that risk.

---

## Team

Built in one day for the Generative UI Global Hackathon, Santiago chapter, by:

- **Persona B (backend / infra)** — agent, BFF, MCP server, Cloud Run deploy
- **Persona A (frontend)** — canvas components, chat UX, microinteractions

Forked from [`franciscogar94/CrisisOS`](https://github.com/franciscogar94/CrisisOS) (the Generative UI Hackathon starter kit) and rebuilt around crisis management.

## License

MIT.

---

> **Built for the Generative UI Global Hackathon: Agentic Interfaces — Santiago, 9 May 2026.**
> Sponsors: AI Tinkerers HQ · Google DeepMind · CopilotKit · Manufact
