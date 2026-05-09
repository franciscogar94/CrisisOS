"""LangGraph entry point for `langgraph dev --port 8133`.

Wires:
- A switchable runtime (Gemini Flash-Lite + deepagents | Gemini Flash-Lite + react |
  Claude Sonnet 4.6 + react) selected by `AGENT_RUNTIME`. See
  `src/runtime.py` and the README's "Switching to a different model".
- Crisis Manager backend tools — `generate_crisis`, `fetch_weather`,
  `generate_timeline`. See `src/notion_tools.py` (file name is legacy; the
  contents are Crisis-flavored after the hackathon rewrite).
- TimingMiddleware (per-turn wall-time logging — see `src/timing.py`)
- CrisisStateMiddleware + CopilotKitMiddleware for canvas state + AG-UI

Frontend tools (`setCrisis`, `setSafeZones`, `setChecklist`,
`toggleChecklistItem`, `setActiveModule`, etc.) are declared on the React
side via `useFrontendTool({ name, parameters, handler })` in
`apps/frontend/src/app/leads/page.tsx`. The runtime forwards those
declarations into the agent's tool list at run time, so we deliberately
do NOT include the Python `frontend_tool_stubs` here — adding them would
cause Gemini to reject the request with "Duplicate function declaration
found: <name>". The Python stubs in `agent/src/canvas.py` exist purely as
documentation of the contract the frontend is expected to honor.
"""

from __future__ import annotations

import os

from dotenv import load_dotenv

from src.intelligence_cleanup import wipe_orphan_threads
from src.notion_tools import load_crisis_tools
from src.prompts import build_system_prompt
from src.runtime import build_graph


# Load .env early so GEMINI_API_KEY / ANTHROPIC_API_KEY are visible.
load_dotenv()


# `langgraph dev` uses an in-memory checkpoint store, so every agent boot
# starts with zero threads in LangGraph but the Intelligence Postgres
# still holds the chat history from the previous run. Without this
# cleanup, the next `getCheckpointByMessage` lookup throws "Message not
# found" and surfaces in the UI as an opaque rxjs stack trace.
# See `src/intelligence_cleanup.py` for the full rationale.
wipe_orphan_threads()


_AGENT_RUNTIME = os.getenv("AGENT_RUNTIME", "gemini-flash-deep")
print(f"[runtime] AGENT_RUNTIME={_AGENT_RUNTIME}", flush=True)

_gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or ""
if _AGENT_RUNTIME.startswith("gemini-") and (
    not _gemini_key or _gemini_key.startswith("stub")
):
    print(
        "\n  GEMINI_API_KEY is unset or a stub.\n"
        "   The agent will boot but chat will fail on the first turn.\n"
        "   Get a key at https://aistudio.google.com → Get API key,\n"
        "   then set GEMINI_API_KEY in v2/.env and v2/agent/.env.\n",
        flush=True,
    )


backend_tools = load_crisis_tools()


SYSTEM_PROMPT = build_system_prompt()


_use_noop = (
    _AGENT_RUNTIME.startswith("gemini-")
    and (not _gemini_key or _gemini_key.startswith("stub"))
)
if _use_noop:
    print(
        "\n[runtime] GEMINI_API_KEY missing or stub — using noop fallback graph.\n"
        "          Chat will reply with a setup pointer instead of hanging.\n",
        flush=True,
    )

# Frontend tools are NOT listed here — see module docstring.
graph = build_graph(
    "noop" if _use_noop else _AGENT_RUNTIME,
    tools=backend_tools,
    system_prompt=SYSTEM_PROMPT,
)


def main() -> None:
    """Entry point for `uv run dev` / `python -m agent`.

    `langgraph dev` is the canonical local-dev runner — this just exists to
    satisfy the `[project.scripts] dev = "agent:main"` entry point.
    """
    import subprocess

    subprocess.run(
        ["langgraph", "dev", "--port", "8133"],
        check=True,
    )


if __name__ == "__main__":
    main()
