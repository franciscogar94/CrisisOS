# CrisisOS — Hackathon Context

## Project

**CrisisOS** — generative UI workspace for emergency management.

- User describes emergency in chat (earthquake, flood, fire, etc.)
- AI agent generates interactive UI in real time: map, evacuation checklist, resource inventory, service alerts, action timeline
- Built on CopilotKit + LangGraph + Next.js 15 + React 19
- Hackathon: Generative UI Global Hackathon, May 9 2026, 6 hours
- Repo: https://github.com/franciscogar94/CrisisOS
- Plan file: `/Users/franciscogar94/.claude/plans/vivid-leaping-wolf.md`

## Team

**Tesla Model 3** — 2 people, both using Claude Code.

- **Persona A (frontend)** — francisco — works in `apps/frontend/`
- **Persona B (backend)** — friend (mgrddev) — works in `apps/agent/`

No file overlap between A and B. BFF (`apps/bff/`) and infra not touched.

## Gitflow

- `master` — production (default branch)
- `develop` — integration
- `feature/frontend-*` — Persona A
- `feature/backend-*` — Persona B
- `release/v1.0` — pre-submission cleanup
- All PRs target `develop`. Final release PR targets `master` + tag `v1.0`.

## Current State

### Frontend (Persona A)

- ✅ PR #1 MERGED (squash) — only first commit landed: types/state/derive/optimistic crisis types
- 🟡 PR #2 OPEN — atomic rewrite: page.tsx + all components + CrisisMap + EvacuationChecklist + ResourceTable + inline cards + stubbed about/showcase
- ⚠️ `develop` build BROKEN until #2 merges (crisis types + lead components mismatch)
- Build verified on `feature/frontend-types`: `npx tsc --noEmit` 0 errors, `npm run build` green
- Frontend dev server renders empty state at /leads correctly (verified via screenshot)

### Backend (Persona B)

- 🔴 NOT STARTED yet
- Schema in `apps/agent/src/lead_state.py` still uses `_Lead`/`_LeadFilter`/`_SyncMeta`
- Tools in `apps/agent/src/notion_tools.py` still Notion/Lead based
- Prompts in `apps/agent/src/prompts.py` still describe lead-triage workflow

### Infra

- Docker stack (Postgres + Redis) not yet started
- `.env` not created (only `.env.example`)
- Requires `GEMINI_API_KEY` to run end-to-end

## Frontend↔Backend Contract

`AgentState` shape (frontend types.ts MUST match backend lead_state.py):

```typescript
interface AgentState {
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
  activeModule: "overview" | "map" | "checklist" | "resources" | "timeline" | "alerts";
}
```

Frontend tools registered (agent must call by these exact names):

**State mutators**: setHeader, setCrisis, setSafeZones, setChecklist, setResources, setAlerts, setTimeline, setWeather, toggleChecklistItem, updateResource, setActiveModule, highlightZones, selectZone, toggleTimelineEntry

**Render tools**: renderCrisisMiniCard, renderResourceStatus, renderEvacChecklist

## Next Steps

### Immediate (blocks everything)

1. **Merge PR #2** (https://github.com/franciscogar94/CrisisOS/pull/2) → unblocks `develop`
2. **Persona B starts** working on `apps/agent/`

### Persona A (frontend) — after PR #2 merges

- Wait for backend before more frontend work, OR
- Polish: chat input placeholder, error states, animations
- Optional: add timeline drag-reorder, alerts severity filtering

### Persona B (backend) — needs to do all of this

1. Branch from develop: `git checkout develop && git pull && git checkout -b feature/backend-prompts`
2. Rewrite `apps/agent/src/lead_state.py` — replace `LeadCanvasState` with `CrisisCanvasState` matching the AgentState shape above
3. Rewrite `apps/agent/src/prompts.py`:
   - CANVAS_STATE_SHAPE block describing crisis state
   - FRONTEND_TOOLS block listing the 14 tools above with parameter descriptions
   - System prompt: identity = "Crisis Management assistant", policy = call generate_crisis on first turn to populate everything in one Command(update=)
4. Rewrite `apps/agent/src/notion_tools.py` (rename functionally, keep `load_notion_tools` export name to avoid breaking imports):
   - `generate_crisis(description, location_hint)` → returns `Command(update={crisis, safeZones, checklist, resources, alerts, timeline, header, activeModule})`
   - `fetch_weather(lat, lng)` → calls Open-Meteo HTTP, returns `Command(update={weather})`
   - `generate_timeline(crisis_type, severity)` → returns timeline entries
5. Stub `apps/agent/src/lead_store.py`, `notion_mcp.py`, `notion_integration.py`
6. Update `apps/agent/src/canvas.py` with crisis frontend tool docstrings
7. Test: `cd apps/agent && uv run langgraph dev --port 8133`
8. Push, open PR to develop

### Integration (both)

- After backend merge: `cp .env.example .env`, set `GEMINI_API_KEY`, run `npm run dev`
- Test: chat "Earthquake magnitude 7.2 in Santiago" → canvas populates
- Demo recording: 2-3 min video for submission

### Submission (final)

- Repo public: ✅
- Demo video URL
- Submission form: project name, pitch, repo, video, protocols used, team
- Deadline: 6 PM local (May 9), global judging Friday May 15

## Free APIs Available (no keys)

- **OpenStreetMap + Leaflet** — maps (already wired in CrisisMap.tsx)
- **Open-Meteo** — weather forecast (no key)
- **ExchangeRate-API** — currency (1500 req/mo free, optional)

## What NOT to Touch

- `apps/bff/src/server.ts` — works as-is
- `apps/agent/src/runtime.py` — middleware stack, runtime factory, leave alone
- `apps/agent/src/timing.py` — telemetry, leave alone
- `apps/frontend/src/app/layout.tsx` — only changed metadata title
- `apps/frontend/src/components/copilot/` — provider shell + fallback card
- `apps/frontend/src/components/threads-drawer/` — thread management UI
- Docker compose, deployment configs — fine as-is

## Reviewer Agents

User has two reviewer chats running in separate Claude Code sessions:
- **Manual reviewer** — user types "revisa PR #N"
- **Auto reviewer** — polls open PRs every 90s, comments findings

## Submission Transparency

Per hackathon rules: starter kit is allowed but must declare what was built during the 6 hours. Crisis-specific code (types, state, components, prompts, agent tools) is NEW. The CopilotKit/LangGraph/Hono/Next.js scaffolding is from the official starter kit.

## Stack Reference

- Frontend: Next.js 15 + React 19 + CopilotKit v2 + Tailwind 4 + Leaflet
- Agent: Python LangGraph + Gemini Flash-Lite (gemini-flash-deep) or Claude Sonnet 4.6
- BFF: Hono + CopilotRuntime + Intelligence (Postgres threads + Redis)
- MCP: optional, lower priority for hackathon

## Plan File

Full implementation plan with phase-by-phase breakdown:

@/Users/franciscogar94/.claude/plans/vivid-leaping-wolf.md

## Caveman mode

User has caveman skill active. Respond terse: drop articles/filler/pleasantries/hedging. Fragments OK. Code/commits/security written normally.
