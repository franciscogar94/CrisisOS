"""Canvas state schema + frontend tool reference (documentation only).

In CopilotKit v2, the **React side is the single source of truth** for
frontend tools: each `useFrontendTool({ name, parameters, handler })` call
in `apps/frontend/src/app/leads/page.tsx` declares the tool's schema to
the runtime AND provides the handler. The runtime forwards those
declarations into the agent's tool list at run time, so the LLM sees them
automatically.

The Python functions below are NOT registered with the agent — passing them
to `create_deep_agent(tools=[...])` would cause Gemini to reject the request
with "Duplicate function declaration found: <name>". They live here as a
quick contract reference for anyone reading the agent code. The actual
schema is in `apps/frontend/src/app/leads/page.tsx`.

Frontend tool surface (all declared on the React side):

  state mutators:
    setHeader, setCrisis, setSafeZones, setChecklist, setResources,
    setAlerts, setTimeline, setWeather, toggleChecklistItem,
    updateResource, setActiveModule, highlightZones, selectZone
  controlled gen UI:
    renderCrisisMiniCard, renderEvacChecklist, renderResourceStatus
"""

from typing import Annotated, Any, Dict, List, Literal, Optional, TypedDict
from typing_extensions import NotRequired


# --- Crisis domain shapes (mirror apps/frontend/src/lib/leads/types.ts) ---


class LatLng(TypedDict, total=False):
    lat: float
    lng: float


class CrisisLocation(TypedDict, total=False):
    lat: float
    lng: float
    name: str


class Crisis(TypedDict, total=False):
    id: str
    type: str
    severity: str
    title: str
    description: str
    location: CrisisLocation
    affectedRadius: float
    timestamp: str


class SafeZone(TypedDict, total=False):
    id: str
    name: str
    type: str
    location: LatLng
    capacity: int
    status: str
    distance: float
    phone: str


class ChecklistItem(TypedDict, total=False):
    id: str
    text: str
    checked: bool
    priority: str
    category: str


class Resource(TypedDict, total=False):
    id: str
    name: str
    category: str
    have: int
    need: int
    unit: str
    critical: bool


class ServiceAlert(TypedDict, total=False):
    id: str
    service: str
    status: str
    message: str
    updatedAt: str


class TimelineEntry(TypedDict, total=False):
    id: str
    phase: str
    action: str
    completed: bool
    order: int


class WeatherData(TypedDict, total=False):
    temperature: float
    windSpeed: float
    humidity: float
    description: str
    alerts: List[str]


class CrisisFilter(TypedDict, total=False):
    severities: List[str]
    zoneTypes: List[str]
    search: str


class CanvasState(TypedDict):
    crisis: NotRequired[Optional[Crisis]]
    safeZones: NotRequired[List[SafeZone]]
    checklist: NotRequired[List[ChecklistItem]]
    resources: NotRequired[List[Resource]]
    alerts: NotRequired[List[ServiceAlert]]
    timeline: NotRequired[List[TimelineEntry]]
    weather: NotRequired[Optional[WeatherData]]
    filter: NotRequired[CrisisFilter]
    highlightedZoneIds: NotRequired[List[str]]
    selectedZoneId: NotRequired[Optional[str]]
    header: NotRequired[Dict[str, str]]
    activeModule: NotRequired[str]


# --- Frontend tool contract (documentation only — NOT registered) ---------
#
# The functions below mirror the `useFrontendTool` registrations in
# `apps/frontend/src/app/leads/page.tsx`. They exist so reviewers can see
# the contract at a glance from the agent side. They are deliberately NOT
# included in `frontend_tool_stubs` and NOT passed to
# `create_deep_agent(tools=)`. The React side declares them to the runtime,
# which forwards them to the agent at run time.


def setHeader(
    title: Annotated[Optional[str], "New canvas heading title."] = None,
    subtitle: Annotated[Optional[str], "New canvas heading subtitle."] = None,
) -> str:
    """Set the canvas heading."""
    return f"setHeader({title}, {subtitle})"


def setCrisis(
    crisis: Annotated[Crisis, "Full Crisis object — replaces canvas state."],
) -> str:
    """REPLACE the active crisis."""
    return f"setCrisis({crisis.get('title', '?')})"


def setSafeZones(
    zones: Annotated[List[SafeZone], "Full zone list — replaces canvas state."],
) -> str:
    """REPLACE the safe-zones list on the canvas."""
    return f"setSafeZones({len(zones)} zones)"


def setChecklist(
    items: Annotated[List[ChecklistItem], "Full checklist — replaces canvas state."],
) -> str:
    """REPLACE the evacuation / response checklist."""
    return f"setChecklist({len(items)} items)"


def setResources(
    resources: Annotated[List[Resource], "Full resource list — replaces canvas state."],
) -> str:
    """REPLACE the resource have/need list."""
    return f"setResources({len(resources)} resources)"


def setAlerts(
    alerts: Annotated[List[ServiceAlert], "Full alert list — replaces canvas state."],
) -> str:
    """REPLACE the service-alert list."""
    return f"setAlerts({len(alerts)} alerts)"


def setTimeline(
    entries: Annotated[List[TimelineEntry], "Full timeline — replaces canvas state."],
) -> str:
    """REPLACE the response-timeline entries."""
    return f"setTimeline({len(entries)} entries)"


def setWeather(
    weather: Annotated[WeatherData, "Weather snapshot — replaces canvas state."],
) -> str:
    """REPLACE the weather data."""
    return f"setWeather({weather.get('temperature', '?')}°)"


def toggleChecklistItem(
    itemId: Annotated[str, "Checklist item id to flip checked/unchecked."],
) -> str:
    """Flip the checked flag on a single checklist item."""
    return f"toggleChecklistItem({itemId})"


def updateResource(
    resourceId: Annotated[str, "Resource id to update."],
    have: Annotated[int, "New 'have' value (0..need)."],
) -> str:
    """Update the 'have' value of a single resource."""
    return f"updateResource({resourceId}, have={have})"


def setActiveModule(
    module: Annotated[
        str, "Active canvas tab: overview | map | checklist | resources | timeline | alerts."
    ],
) -> str:
    """Switch the active canvas module/tab."""
    return f"setActiveModule({module})"


def highlightZones(
    zoneIds: Annotated[List[str], "Zone ids to visually highlight on the map."],
) -> str:
    """Highlight specific zones (visual emphasis only — not a filter)."""
    return f"highlightZones({zoneIds})"


def selectZone(
    zoneId: Annotated[Optional[str], "Zone id to open, or None to close."],
) -> str:
    """Open / close the safe-zone detail panel."""
    return f"selectZone({zoneId})"


def renderCrisisMiniCard(
    crisisId: Annotated[str, "Crisis id (from state.crisis.id)."],
    title: Annotated[Optional[str], "Optional title override."] = None,
) -> str:
    """Render an inline crisis summary card in the chat stream."""
    return f"renderCrisisMiniCard({crisisId}, {title})"


def renderEvacChecklist(
    priority: Annotated[
        Optional[str], "Filter by 'immediate' | 'short-term' | 'long-term' | None."
    ] = None,
) -> str:
    """Render an inline interactive evacuation checklist in the chat stream."""
    return f"renderEvacChecklist({priority})"


def renderResourceStatus(
    category: Annotated[
        Optional[str], "Filter by 'water' | 'food' | 'medical' | etc. | None."
    ] = None,
) -> str:
    """Render an inline resource have/need bar chart in the chat stream."""
    return f"renderResourceStatus({category})"


# --- Export list ----------------------------------------------------------
# Intentionally empty: tools are declared on the React side via
# `useFrontendTool` and forwarded by the runtime. See module docstring.

frontend_tool_stubs: list = []
