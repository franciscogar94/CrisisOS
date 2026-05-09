"""CrisisStateMiddleware — declares the Crisis Manager canvas fields on the
agent's TypedDict state schema so they survive STATE_SNAPSHOT round-trips.

Without the schema declaration the agent's state would only contain
``messages``, ``jump_to``, ``structured_response``, ``copilotkit``. When the
agent emits ``STATE_SNAPSHOT`` to the frontend, the snapshot replaces the
frontend's local ``agent.state``, wiping any keys (``crisis``, ``safeZones``,
``checklist``, …) the React handlers wrote via ``agent.setState``.

By declaring those keys here, LangGraph carries them through state-event
emission so the frontend's canvas state survives reloads of the run loop.

Field shapes mirror the TypeScript ``AgentState`` in
``apps/frontend/src/lib/leads/types.ts``.

Note on hydration: unlike the lead-triage starter, the Crisis Manager has
no canonical store to pre-load — every thread starts with an empty canvas
that the user populates by describing a crisis ("Terremoto magnitud 7 en
Santiago"). The agent calls ``generate_crisis`` once and the canvas fills
in.
"""

from __future__ import annotations

from typing import Annotated, Any, List, Literal, Optional

from langchain.agents.middleware.types import AgentMiddleware, AgentState
from typing_extensions import NotRequired, TypedDict


# --- Core domain typed dicts ------------------------------------------------


class _LatLng(TypedDict, total=False):
    lat: float
    lng: float


class _CrisisLocation(TypedDict, total=False):
    lat: float
    lng: float
    name: str


class _Crisis(TypedDict, total=False):
    id: str
    type: str  # earthquake | flood | fire | hurricane | tornado | tsunami | chemical | other
    severity: str  # low | moderate | high | critical
    title: str
    description: str
    location: _CrisisLocation
    affectedRadius: float  # km
    timestamp: str  # ISO


class _SafeZone(TypedDict, total=False):
    id: str
    name: str
    type: str  # shelter | hospital | fire_station | police | assembly_point
    location: _LatLng
    capacity: int
    status: str  # open | full | closed
    distance: float
    phone: str


class _ChecklistItem(TypedDict, total=False):
    id: str
    text: str
    checked: bool
    priority: str  # immediate | short-term | long-term
    category: str


class _Resource(TypedDict, total=False):
    id: str
    name: str
    category: str  # water | food | medical | shelter | communication | transport | tools
    have: int
    need: int
    unit: str
    critical: bool


class _ServiceAlert(TypedDict, total=False):
    id: str
    service: str  # water | electricity | gas | communications | internet | transport
    status: str  # operational | degraded | outage | unknown
    message: str
    updatedAt: str  # ISO


class _TimelineEntry(TypedDict, total=False):
    id: str
    phase: str  # first_5_min | first_hour | first_day | first_week
    action: str
    completed: bool
    order: int


class _WeatherData(TypedDict, total=False):
    temperature: float
    windSpeed: float
    humidity: float
    description: str
    alerts: List[str]


class _Header(TypedDict, total=False):
    title: str
    subtitle: str


class _CrisisFilter(TypedDict, total=False):
    severities: List[str]
    zoneTypes: List[str]
    search: str


# --- LangGraph reducer ------------------------------------------------------


def _replace(_left: Any, right: Any) -> Any:
    """LangGraph reducer that always takes the most recent value.

    Without an explicit reducer, LangGraph would either default to
    last-write-wins for scalars or raise on conflicting types.
    """
    return right


# --- Canvas state schema ----------------------------------------------------


class CrisisCanvasState(AgentState):
    """Extended agent state for the Crisis Manager canvas.

    Each field is `NotRequired` so the agent can boot with an empty canvas;
    the frontend's `mergeState` provides defaults on the React side.
    """

    crisis: NotRequired[Annotated[Optional[_Crisis], _replace]]
    safeZones: NotRequired[Annotated[List[_SafeZone], _replace]]
    checklist: NotRequired[Annotated[List[_ChecklistItem], _replace]]
    resources: NotRequired[Annotated[List[_Resource], _replace]]
    alerts: NotRequired[Annotated[List[_ServiceAlert], _replace]]
    timeline: NotRequired[Annotated[List[_TimelineEntry], _replace]]
    weather: NotRequired[Annotated[Optional[_WeatherData], _replace]]
    filter: NotRequired[Annotated[_CrisisFilter, _replace]]
    highlightedZoneIds: NotRequired[Annotated[List[str], _replace]]
    selectedZoneId: NotRequired[Annotated[Optional[str], _replace]]
    header: NotRequired[Annotated[_Header, _replace]]
    activeModule: NotRequired[Annotated[str, _replace]]


# --- Middleware -------------------------------------------------------------


class CrisisStateMiddleware(AgentMiddleware[CrisisCanvasState, Any]):  # type: ignore[type-arg]
    """Contributes the crisis-canvas state schema to the agent graph.

    LangGraph merges the state schemas of every middleware in the chain, so
    inserting this alongside CopilotKitMiddleware adds the crisis fields to
    the graph's state. There is no ``before_agent`` hydration: a fresh
    thread starts with an empty canvas, and the agent populates it via
    ``generate_crisis`` on the first user description.
    """

    state_schema = CrisisCanvasState


# Backwards-compat alias — kept so any stale import paths still resolve
# during the rewrite. Safe to remove once everything has migrated.
LeadStateMiddleware = CrisisStateMiddleware
LeadCanvasState = CrisisCanvasState
