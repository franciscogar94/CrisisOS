"""Backend tools for the Crisis Manager canvas.

Exposes the Python tools the agent always has available:

- ``generate_crisis(description)`` — the workhorse. Parses a free-form
  description, extracts type / severity / location, and writes the ENTIRE
  canvas (crisis, safeZones, checklist, resources, alerts, timeline,
  weather, header) in one ``Command(update=)``. Pure-Python templates
  per crisis type — no internal LLM call, so the demo is fast and
  deterministic.

- ``fetch_weather(lat, lng)`` — pulls a current-weather snapshot from the
  Open-Meteo public API (no key needed, urllib stdlib only) and updates
  ``state.weather``.

- ``generate_timeline(crisis_type, severity)`` — regenerates the response
  timeline for a given (type, severity) pair, useful when the user wants
  to swap timeline depth without regenerating the whole canvas.

Why ``Command(update=)`` instead of plain JSON returns: Gemini stalls when
asked to construct fat tool-call output (issue 006 from the lead-triage
starter). Routing structured data through agent state via ``Command``
sidesteps the construction step entirely and the frontend STATE_SNAPSHOT
picks up the change in one shot.

The function name ``load_notion_tools`` (and the file name ``notion_tools.py``)
are kept for backwards compatibility with the boot path in
``apps/agent/main.py``. The exported ``load_crisis_tools`` is the canonical
forward-compatible name; ``load_notion_tools`` remains as an alias.
"""

from __future__ import annotations

import json
import math
import random
import re
import urllib.parse
import urllib.request
import uuid
from datetime import datetime, timezone
from typing import Annotated, Any, Dict, List, Optional, Tuple

from langchain_core.messages import ToolMessage
from langchain_core.tools import tool, InjectedToolCallId
from langgraph.types import Command


# ---------------------------------------------------------------------- ids


def _uid(prefix: str) -> str:
    """Short-but-unique id for canvas items. Prefix tells the eye what it is."""
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# -------------------------------------------------------------- known cities
#
# Curated set of Latin American hubs (with a few global ones) so the demo
# can resolve "Terremoto en Santiago" / "Inundación en Lima" without an
# external geocoder. Coordinates are rough city centers — close enough to
# render a marker; safe zones are jittered around this point.

_CITIES: Dict[str, Dict[str, Any]] = {
    # Chile
    "santiago": {"lat": -33.4489, "lng": -70.6693, "name": "Santiago de Chile"},
    "valparaíso": {"lat": -33.0472, "lng": -71.6127, "name": "Valparaíso, Chile"},
    "valparaiso": {"lat": -33.0472, "lng": -71.6127, "name": "Valparaíso, Chile"},
    "concepción": {"lat": -36.8201, "lng": -73.0444, "name": "Concepción, Chile"},
    "concepcion": {"lat": -36.8201, "lng": -73.0444, "name": "Concepción, Chile"},
    "iquique": {"lat": -20.2208, "lng": -70.1431, "name": "Iquique, Chile"},
    "antofagasta": {"lat": -23.6509, "lng": -70.3975, "name": "Antofagasta, Chile"},
    "valdivia": {"lat": -39.8142, "lng": -73.2459, "name": "Valdivia, Chile"},
    # Perú
    "lima": {"lat": -12.0464, "lng": -77.0428, "name": "Lima, Perú"},
    "cusco": {"lat": -13.5319, "lng": -71.9675, "name": "Cusco, Perú"},
    "arequipa": {"lat": -16.4090, "lng": -71.5375, "name": "Arequipa, Perú"},
    # Argentina
    "buenos aires": {"lat": -34.6037, "lng": -58.3816, "name": "Buenos Aires, Argentina"},
    "mendoza": {"lat": -32.8908, "lng": -68.8272, "name": "Mendoza, Argentina"},
    "córdoba": {"lat": -31.4201, "lng": -64.1888, "name": "Córdoba, Argentina"},
    "cordoba": {"lat": -31.4201, "lng": -64.1888, "name": "Córdoba, Argentina"},
    # Colombia
    "bogotá": {"lat": 4.7110, "lng": -74.0721, "name": "Bogotá, Colombia"},
    "bogota": {"lat": 4.7110, "lng": -74.0721, "name": "Bogotá, Colombia"},
    "medellín": {"lat": 6.2442, "lng": -75.5812, "name": "Medellín, Colombia"},
    "medellin": {"lat": 6.2442, "lng": -75.5812, "name": "Medellín, Colombia"},
    # México
    "ciudad de méxico": {"lat": 19.4326, "lng": -99.1332, "name": "Ciudad de México"},
    "ciudad de mexico": {"lat": 19.4326, "lng": -99.1332, "name": "Ciudad de México"},
    "cdmx": {"lat": 19.4326, "lng": -99.1332, "name": "Ciudad de México"},
    "guadalajara": {"lat": 20.6597, "lng": -103.3496, "name": "Guadalajara, México"},
    "monterrey": {"lat": 25.6866, "lng": -100.3161, "name": "Monterrey, México"},
    # Brasil
    "são paulo": {"lat": -23.5505, "lng": -46.6333, "name": "São Paulo, Brasil"},
    "sao paulo": {"lat": -23.5505, "lng": -46.6333, "name": "São Paulo, Brasil"},
    "rio de janeiro": {"lat": -22.9068, "lng": -43.1729, "name": "Rio de Janeiro, Brasil"},
    # Otros LatAm
    "quito": {"lat": -0.1807, "lng": -78.4678, "name": "Quito, Ecuador"},
    "guayaquil": {"lat": -2.1709, "lng": -79.9224, "name": "Guayaquil, Ecuador"},
    "caracas": {"lat": 10.4806, "lng": -66.9036, "name": "Caracas, Venezuela"},
    "la paz": {"lat": -16.4897, "lng": -68.1193, "name": "La Paz, Bolivia"},
    "asunción": {"lat": -25.2637, "lng": -57.5759, "name": "Asunción, Paraguay"},
    "asuncion": {"lat": -25.2637, "lng": -57.5759, "name": "Asunción, Paraguay"},
    "montevideo": {"lat": -34.9011, "lng": -56.1645, "name": "Montevideo, Uruguay"},
    "san josé": {"lat": 9.9281, "lng": -84.0907, "name": "San José, Costa Rica"},
    "san jose": {"lat": 9.9281, "lng": -84.0907, "name": "San José, Costa Rica"},
    "ciudad de panamá": {"lat": 8.9824, "lng": -79.5199, "name": "Ciudad de Panamá"},
    "panamá": {"lat": 8.9824, "lng": -79.5199, "name": "Ciudad de Panamá"},
    "panama": {"lat": 8.9824, "lng": -79.5199, "name": "Ciudad de Panamá"},
    "guatemala": {"lat": 14.6349, "lng": -90.5069, "name": "Ciudad de Guatemala"},
    "tegucigalpa": {"lat": 14.0723, "lng": -87.1921, "name": "Tegucigalpa, Honduras"},
    "managua": {"lat": 12.1364, "lng": -86.2514, "name": "Managua, Nicaragua"},
    "san salvador": {"lat": 13.6929, "lng": -89.2182, "name": "San Salvador, El Salvador"},
}

_DEFAULT_CITY = _CITIES["santiago"]


# ----------------------------------------------------------- type detection

_TYPE_KEYWORDS: List[Tuple[str, List[str]]] = [
    ("earthquake", ["terremoto", "sismo", "earthquake", "temblor"]),
    ("flood", ["inundación", "inundacion", "flood", "crecida", "desborde"]),
    ("volcanic", ["volcánico", "volcanico", "volcanic", "erupción", "erupcion", "ceniza", "volcán", "volcan"]),
    ("fire", ["incendio", "fuego forestal", "wildfire", "fire", "fuego"]),
    ("hurricane", ["huracán", "huracan", "hurricane", "ciclón", "ciclon"]),
    ("tornado", ["tornado"]),
    ("tsunami", ["tsunami", "maremoto"]),
    ("chemical", ["químico", "quimico", "chemical", "tóxico", "toxico", "fuga", "derrame"]),
    ("blackout", ["apagón", "apagon", "blackout", "corte de luz", "corte eléctrico", "corte electrico"]),
]


def _detect_type(description: str) -> str:
    desc = (description or "").lower()
    for crisis_type, keywords in _TYPE_KEYWORDS:
        if any(kw in desc for kw in keywords):
            return crisis_type
    return "other"


def _detect_location(description: str) -> Dict[str, Any]:
    """Find a known city in the description. Falls back to Santiago for the demo."""
    desc = (description or "").lower()
    # Longest-match-first so 'ciudad de méxico' wins over 'méxico'.
    for key in sorted(_CITIES.keys(), key=len, reverse=True):
        if key in desc:
            return _CITIES[key]
    return _DEFAULT_CITY


def _detect_severity(description: str, crisis_type: str) -> str:
    desc = (description or "").lower()
    # Explicit severity words win.
    if any(w in desc for w in ["catastrófico", "catastrofico", "critical", "crítico", "critico"]):
        return "critical"
    if any(w in desc for w in ["grave", "severo", "high", "fuerte", "intenso"]):
        return "high"
    if any(w in desc for w in ["moderado", "moderate"]):
        return "moderate"
    if any(w in desc for w in ["leve", "menor", "low", "minor"]):
        return "low"

    # Infer from earthquake magnitude when present.
    if crisis_type == "earthquake":
        m = re.search(r"magnitud[^\d]*(\d+(?:\.\d+)?)", desc)
        if not m:
            m = re.search(r"magnitude[^\d]*(\d+(?:\.\d+)?)", desc)
        if not m:
            m = re.search(r"\b([4-9](?:\.\d)?)\b", desc)
        if m:
            try:
                mag = float(m.group(1))
                if mag >= 8.0:
                    return "critical"
                if mag >= 6.5:
                    return "high"
                if mag >= 5.0:
                    return "moderate"
                return "low"
            except ValueError:
                pass

    # Default: high. Crisis Manager is for events worth coordinating around.
    return "high"


_SEVERITY_RADIUS_KM: Dict[str, float] = {
    "low": 1.0,
    "moderate": 5.0,
    "high": 15.0,
    "critical": 30.0,
}

_SEVERITY_NEED_MULT: Dict[str, int] = {
    "low": 50,
    "moderate": 200,
    "high": 1000,
    "critical": 5000,
}


# --------------------------------------------------------------- safe zones

# 6 typical zone slots. Type-specific tweaks happen below.
_BASE_ZONE_SLOTS: List[Dict[str, Any]] = [
    {"type": "hospital", "name": "Hospital Central"},
    {"type": "hospital", "name": "Hospital Regional Sur"},
    {"type": "shelter", "name": "Albergue Estadio Municipal"},
    {"type": "shelter", "name": "Polideportivo Comunal"},
    {"type": "fire_station", "name": "Estación de Bomberos N°1"},
    {"type": "police", "name": "Comisaría Central"},
    {"type": "assembly_point", "name": "Plaza de Armas"},
    {"type": "assembly_point", "name": "Parque Central"},
]


def _build_safe_zones(
    crisis_type: str, severity: str, center: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """Build 6-8 safe zones jittered around the crisis epicenter.

    For tsunami, anchor shelters inland (north/east jitter only).
    For chemical, drop fire stations to 1 (less useful in a chemical event).
    """
    rng = random.Random(f"{crisis_type}-{center.get('name', '')}")
    zones: List[Dict[str, Any]] = []

    slots = list(_BASE_ZONE_SLOTS)
    if crisis_type == "chemical":
        slots = [s for s in slots if s["type"] != "fire_station"][:7]

    for i, slot in enumerate(slots):
        # Jitter ~0.005-0.025 deg ≈ 0.5-3 km.
        if crisis_type == "tsunami":
            # Inland: positive lat (away from coast), east in lng.
            d_lat = rng.uniform(0.005, 0.030)
            d_lng = rng.uniform(0.005, 0.025)
        else:
            d_lat = rng.uniform(-0.025, 0.025)
            d_lng = rng.uniform(-0.025, 0.025)

        lat = round(center["lat"] + d_lat, 5)
        lng = round(center["lng"] + d_lng, 5)
        # Approx great-circle distance using equirectangular shortcut (close
        # enough for a few km). 1 deg lat ≈ 111 km.
        dist_km = round(
            math.sqrt((d_lat * 111.0) ** 2 + (d_lng * 111.0 * math.cos(math.radians(center["lat"]))) ** 2),
            2,
        )
        capacity_map = {
            "hospital": rng.choice([200, 400, 600]),
            "shelter": rng.choice([300, 800, 1500]),
            "fire_station": 50,
            "police": 80,
            "assembly_point": rng.choice([1000, 2500, 5000]),
        }
        # Higher severity → some zones flip to "full".
        status = "open"
        if severity in ("high", "critical") and rng.random() < 0.25:
            status = "full"

        zones.append(
            {
                "id": _uid("zone"),
                "name": slot["name"],
                "type": slot["type"],
                "location": {"lat": lat, "lng": lng},
                "capacity": capacity_map[slot["type"]],
                "status": status,
                "distance": dist_km,
                "phone": f"+56 2 {rng.randint(2000, 2999)} {rng.randint(1000, 9999)}",
            }
        )
    return zones


# ----------------------------------------------------------------- checklist

# Per-type checklist templates. Each entry is (priority, category, text).
_CHECKLIST_TEMPLATES: Dict[str, List[Tuple[str, str, str]]] = {
    "earthquake": [
        ("immediate", "seguridad", "Agacharse, cubrirse y sujetarse hasta que el sismo termine"),
        ("immediate", "seguridad", "Alejarse de ventanas, espejos y objetos que puedan caer"),
        ("immediate", "evaluación", "Evaluar lesiones propias y de personas cercanas"),
        ("immediate", "evaluación", "Revisar daños estructurales visibles antes de moverse"),
        ("short-term", "evacuación", "Salir del edificio por escaleras (NO usar ascensores)"),
        ("short-term", "comunicación", "Avisar al grupo familiar o equipo del estado"),
        ("short-term", "seguridad", "Cortar suministro de gas si se percibe olor"),
        ("short-term", "logística", "Trasladarse a la zona segura más cercana"),
        ("long-term", "preparación", "Inspección estructural profesional del inmueble"),
        ("long-term", "logística", "Stock de agua y alimentos para 72 horas mínimo"),
        ("long-term", "preparación", "Preparar plan para réplicas en las próximas 48 h"),
        ("long-term", "documentación", "Registrar daños con fotos para seguros"),
    ],
    "flood": [
        ("immediate", "seguridad", "Trasladarse a un nivel superior dentro del edificio"),
        ("immediate", "seguridad", "NO caminar en agua con corriente (>15 cm de altura)"),
        ("immediate", "seguridad", "Cortar electricidad si el agua se acerca a tomas"),
        ("immediate", "evaluación", "Identificar vías de escape elevadas"),
        ("short-term", "evacuación", "Evacuar a zona en altitud si la crecida supera 50 cm"),
        ("short-term", "comunicación", "Reportar personas atrapadas a emergencias"),
        ("short-term", "logística", "Llevar documentos en bolsa impermeable"),
        ("short-term", "salud", "Hervir o tratar el agua antes de consumir"),
        ("long-term", "preparación", "Esperar autorización oficial antes de regresar"),
        ("long-term", "salud", "Vacunación / control sanitario tras exposición a agua"),
        ("long-term", "logística", "Limpieza con desinfectante para evitar enfermedades"),
        ("long-term", "documentación", "Registrar daños materiales para seguros"),
    ],
    "fire": [
        ("immediate", "seguridad", "Evacuar hacia barlovento (contra el viento)"),
        ("immediate", "seguridad", "Cubrir nariz y boca con paño húmedo"),
        ("immediate", "seguridad", "Cerrar ventanas y puertas para frenar entrada de humo"),
        ("immediate", "comunicación", "Llamar a bomberos (132 en Chile)"),
        ("short-term", "evacuación", "Trasladarse a zona de encuentro asignada"),
        ("short-term", "logística", "Llevar mascarilla N95 si hay disponible"),
        ("short-term", "salud", "Evitar esfuerzo físico — humo daña pulmones"),
        ("short-term", "comunicación", "Mantener radio encendida para alertas oficiales"),
        ("long-term", "salud", "Control médico si hubo exposición prolongada al humo"),
        ("long-term", "preparación", "Esperar autorización oficial para regresar"),
        ("long-term", "logística", "Limpieza profunda de cenizas y residuos tóxicos"),
        ("long-term", "documentación", "Registrar daños y reportar a aseguradora"),
    ],
    "hurricane": [
        ("immediate", "seguridad", "Refugiarse en habitación interior sin ventanas"),
        ("immediate", "seguridad", "Reforzar ventanas con tableros o cinta cruzada"),
        ("immediate", "logística", "Cargar dispositivos electrónicos al máximo"),
        ("immediate", "logística", "Llenar contenedores con agua potable"),
        ("short-term", "comunicación", "Sintonizar radio con baterías para alertas"),
        ("short-term", "seguridad", "NO salir durante el ojo del huracán (calma engañosa)"),
        ("short-term", "logística", "Mantener kit de emergencia accesible"),
        ("short-term", "salud", "Resguardar medicamentos esenciales"),
        ("long-term", "preparación", "Esperar declaración oficial de fin de alerta"),
        ("long-term", "logística", "Inspeccionar antes de entrar a inmuebles dañados"),
        ("long-term", "documentación", "Documentar daños con fotos y video"),
        ("long-term", "salud", "Cuidado con escombros y cables caídos"),
    ],
    "tornado": [
        ("immediate", "seguridad", "Refugiarse en sótano o habitación interior sin ventanas"),
        ("immediate", "seguridad", "Cubrirse con colchón o manta gruesa"),
        ("immediate", "evaluación", "Mantenerse alejado de ventanas y puertas"),
        ("short-term", "comunicación", "Sintonizar radio para confirmar fin de alerta"),
        ("short-term", "evaluación", "Evaluar lesiones y daños solo cuando pase"),
        ("short-term", "logística", "Cuidado con escombros y cables eléctricos"),
        ("long-term", "documentación", "Registrar daños para seguros"),
        ("long-term", "preparación", "Preparar plan para tornados secundarios"),
    ],
    "tsunami": [
        ("immediate", "seguridad", "Trasladarse a terreno alto (>30 m) inmediatamente"),
        ("immediate", "seguridad", "Alejarse de la costa y zonas bajas"),
        ("immediate", "comunicación", "Activar alertas SHOA / sistema oficial"),
        ("short-term", "evacuación", "Mantenerse en altura por al menos 6 horas"),
        ("short-term", "comunicación", "Contactar familiares solo por SMS (saturación de red)"),
        ("short-term", "logística", "Esperar trenes de olas adicionales"),
        ("long-term", "preparación", "Esperar autorización oficial antes de regresar"),
        ("long-term", "salud", "Cuidado con agua contaminada y escombros"),
        ("long-term", "documentación", "Reportar personas no localizadas a Carabineros"),
    ],
    "chemical": [
        ("immediate", "seguridad", "Refugiarse en interior y sellar puertas/ventanas"),
        ("immediate", "seguridad", "Apagar HVAC y sistemas de ventilación"),
        ("immediate", "salud", "Cubrir nariz y boca con paño húmedo"),
        ("immediate", "comunicación", "Llamar a línea de emergencias químicas"),
        ("short-term", "evacuación", "Evacuar SOLO con instrucción oficial"),
        ("short-term", "salud", "Evitar contacto con superficies expuestas"),
        ("short-term", "comunicación", "Sintonizar radio oficial"),
        ("long-term", "salud", "Control médico tras exposición"),
        ("long-term", "preparación", "Descontaminación profesional del área"),
        ("long-term", "documentación", "Registrar síntomas para seguimiento médico"),
    ],
    "volcanic": [
        ("immediate", "seguridad", "Refugiarse en interior y cerrar puertas/ventanas"),
        ("immediate", "salud", "Cubrir nariz y boca con paño húmedo (ceniza es abrasiva)"),
        ("immediate", "seguridad", "Apagar HVAC y sistemas de ventilación externa"),
        ("immediate", "evaluación", "Monitorear dirección del viento (ceniza viaja km)"),
        ("short-term", "evacuación", "Evacuar zona de exclusión si SERNAGEOMIN lo ordena"),
        ("short-term", "logística", "Tener mochila lista con linterna, agua, medicamentos"),
        ("short-term", "salud", "Usar antiparras o lentes para proteger ojos"),
        ("short-term", "logística", "Limpiar techos con menos de 10cm de ceniza (peso colapsa)"),
        ("long-term", "salud", "Control respiratorio si hubo exposición prolongada"),
        ("long-term", "preparación", "Mantener vigilancia de actividad sísmica volcánica"),
        ("long-term", "logística", "Limpieza de ceniza con agua (NO escoba, levanta polvo)"),
        ("long-term", "documentación", "Registrar daños en techos / vehículos para seguros"),
    ],
    "blackout": [
        ("immediate", "seguridad", "Apagar electrodomésticos para evitar daño al volver luz"),
        ("immediate", "logística", "Localizar linternas y radio a baterías"),
        ("immediate", "comunicación", "Reportar el corte a la distribuidora eléctrica"),
        ("immediate", "salud", "Si hay equipos médicos críticos, contactar emergencias"),
        ("short-term", "logística", "Mantener heladera cerrada (4h preserva alimentos)"),
        ("short-term", "comunicación", "Conservar batería del celular para emergencias"),
        ("short-term", "logística", "Cargar power banks si tienen carga residual"),
        ("short-term", "salud", "Vigilar adultos mayores y bebés en olas de calor/frío"),
        ("long-term", "logística", "Descartar alimentos perecibles si corte > 4 horas"),
        ("long-term", "preparación", "Considerar generador o UPS para próximos cortes"),
        ("long-term", "documentación", "Documentar pérdidas en alimentos / equipos quemados"),
    ],
    "other": [
        ("immediate", "seguridad", "Mantener la calma y evaluar la situación"),
        ("immediate", "comunicación", "Llamar a servicios de emergencia"),
        ("immediate", "evaluación", "Verificar lesiones y daños inmediatos"),
        ("short-term", "evacuación", "Trasladarse a zona segura más cercana"),
        ("short-term", "comunicación", "Reportar estado a contactos clave"),
        ("short-term", "logística", "Llevar kit de emergencia"),
        ("long-term", "preparación", "Esperar autorización oficial antes de regresar"),
        ("long-term", "documentación", "Documentar daños y eventos"),
    ],
}


def _build_checklist(crisis_type: str) -> List[Dict[str, Any]]:
    template = _CHECKLIST_TEMPLATES.get(crisis_type, _CHECKLIST_TEMPLATES["other"])
    return [
        {
            "id": _uid("chk"),
            "text": text,
            "checked": False,
            "priority": priority,
            "category": category,
        }
        for priority, category, text in template
    ]


# ---------------------------------------------------------------- resources

# Per-type resource templates. Each entry is (name, category, unit, baseline_have_pct).
_RESOURCE_TEMPLATES: Dict[str, List[Tuple[str, str, str, float]]] = {
    "earthquake": [
        ("Agua potable", "water", "litros", 0.20),
        ("Alimentos no perecibles", "food", "raciones", 0.30),
        ("Botiquines", "medical", "unidades", 0.40),
        ("Carpas / refugios", "shelter", "unidades", 0.15),
        ("Radios portátiles", "communication", "unidades", 0.50),
        ("Vehículos de rescate", "transport", "unidades", 0.25),
        ("Linternas / herramientas", "tools", "unidades", 0.35),
    ],
    "flood": [
        ("Agua potable", "water", "litros", 0.10),
        ("Alimentos no perecibles", "food", "raciones", 0.20),
        ("Medicamentos / botiquines", "medical", "unidades", 0.30),
        ("Refugios elevados", "shelter", "unidades", 0.20),
        ("Botes / lanchas de rescate", "transport", "unidades", 0.15),
        ("Bombas de achique", "tools", "unidades", 0.25),
        ("Radios portátiles", "communication", "unidades", 0.45),
    ],
    "fire": [
        ("Agua / cisternas", "water", "litros", 0.30),
        ("Mascarillas N95", "medical", "unidades", 0.40),
        ("Equipos de oxígeno", "medical", "unidades", 0.20),
        ("Refugios temporales", "shelter", "unidades", 0.15),
        ("Camiones cisterna", "transport", "unidades", 0.25),
        ("Radios bomberiles", "communication", "unidades", 0.55),
        ("Hachas / palas", "tools", "unidades", 0.40),
    ],
    "hurricane": [
        ("Agua potable", "water", "litros", 0.15),
        ("Alimentos no perecibles", "food", "raciones", 0.25),
        ("Botiquines", "medical", "unidades", 0.40),
        ("Refugios temporales", "shelter", "unidades", 0.20),
        ("Generadores eléctricos", "tools", "unidades", 0.20),
        ("Radios con baterías", "communication", "unidades", 0.50),
    ],
    "tornado": [
        ("Botiquines", "medical", "unidades", 0.35),
        ("Refugios temporales", "shelter", "unidades", 0.25),
        ("Radios con baterías", "communication", "unidades", 0.50),
        ("Linternas", "tools", "unidades", 0.40),
    ],
    "tsunami": [
        ("Agua potable", "water", "litros", 0.10),
        ("Alimentos no perecibles", "food", "raciones", 0.15),
        ("Botiquines", "medical", "unidades", 0.25),
        ("Refugios en altura", "shelter", "unidades", 0.20),
        ("Buses de evacuación", "transport", "unidades", 0.30),
        ("Sirenas / megáfonos", "communication", "unidades", 0.45),
    ],
    "chemical": [
        ("Mascarillas químicas", "medical", "unidades", 0.20),
        ("Trajes hazmat", "medical", "unidades", 0.10),
        ("Antídotos / lavados", "medical", "unidades", 0.15),
        ("Refugios sellados", "shelter", "unidades", 0.20),
        ("Vehículos de descontaminación", "transport", "unidades", 0.15),
        ("Radios cifradas", "communication", "unidades", 0.50),
    ],
    "volcanic": [
        ("Mascarillas N95 / antipolvo", "medical", "unidades", 0.30),
        ("Antiparras / protección ocular", "medical", "unidades", 0.20),
        ("Agua potable", "water", "litros", 0.25),
        ("Alimentos no perecibles", "food", "raciones", 0.35),
        ("Refugios sellados", "shelter", "unidades", 0.20),
        ("Buses de evacuación", "transport", "unidades", 0.20),
        ("Radios con baterías", "communication", "unidades", 0.50),
        ("Lonas / cubiertas para techos", "tools", "unidades", 0.25),
    ],
    "blackout": [
        ("Generadores eléctricos", "tools", "unidades", 0.10),
        ("Power banks / baterías", "tools", "unidades", 0.40),
        ("Velas y linternas", "tools", "unidades", 0.55),
        ("Hielo / refrigerantes", "food", "kg", 0.15),
        ("Alimentos no perecibles", "food", "raciones", 0.30),
        ("Radios con baterías", "communication", "unidades", 0.45),
        ("Combustible para generadores", "tools", "litros", 0.20),
    ],
    "other": [
        ("Agua potable", "water", "litros", 0.25),
        ("Alimentos", "food", "raciones", 0.30),
        ("Botiquines", "medical", "unidades", 0.40),
        ("Radios", "communication", "unidades", 0.50),
    ],
}


def _build_resources(crisis_type: str, severity: str) -> List[Dict[str, Any]]:
    template = _RESOURCE_TEMPLATES.get(crisis_type, _RESOURCE_TEMPLATES["other"])
    need_mult = _SEVERITY_NEED_MULT[severity]
    rng = random.Random(f"{crisis_type}-{severity}-resources")
    out: List[Dict[str, Any]] = []
    for name, category, unit, base_have_pct in template:
        # Adjust unit-specific need scale: water needs more litres, vehicles less.
        if unit == "litros":
            need = need_mult * 5
        elif unit == "raciones":
            need = need_mult * 3
        else:
            need = max(5, need_mult // 20)
        # Jitter the have% slightly for realism.
        have_pct = max(0.0, min(1.0, base_have_pct + rng.uniform(-0.10, 0.10)))
        have = int(need * have_pct)
        out.append(
            {
                "id": _uid("res"),
                "name": name,
                "category": category,
                "have": have,
                "need": need,
                "unit": unit,
                "critical": (have / max(need, 1)) < 0.30,
            }
        )
    return out


# -------------------------------------------------------------- service alerts

# Per-type baseline service alerts. Severity nudges several services to
# 'outage' for high/critical events.
_ALERT_BASELINE: Dict[str, List[Tuple[str, str, str]]] = {
    "earthquake": [
        ("electricity", "outage", "Cortes de energía en sectores afectados"),
        ("water", "degraded", "Suministro de agua potable comprometido"),
        ("gas", "outage", "Gas cortado preventivamente"),
        ("communications", "degraded", "Saturación de red móvil — usar SMS"),
        ("internet", "degraded", "Conectividad intermitente"),
        ("transport", "outage", "Metro y trenes detenidos para inspección"),
    ],
    "flood": [
        ("electricity", "outage", "Cortes preventivos en zonas anegadas"),
        ("water", "degraded", "Agua potable contaminada por desbordes"),
        ("gas", "operational", "Suministro normal"),
        ("communications", "degraded", "Antenas afectadas en zonas bajas"),
        ("internet", "degraded", "Conectividad intermitente"),
        ("transport", "outage", "Rutas principales cortadas por agua"),
    ],
    "fire": [
        ("electricity", "degraded", "Cortes en sectores próximos al fuego"),
        ("water", "operational", "Suministro normal"),
        ("gas", "operational", "Suministro normal"),
        ("communications", "operational", "Operativo"),
        ("internet", "operational", "Operativo"),
        ("transport", "degraded", "Rutas de evacuación con tráfico denso"),
    ],
    "hurricane": [
        ("electricity", "outage", "Cortes generalizados por viento"),
        ("water", "degraded", "Posible contaminación por inundación"),
        ("gas", "degraded", "Suministro irregular"),
        ("communications", "degraded", "Antenas dañadas por viento"),
        ("internet", "outage", "Sin servicio en zonas afectadas"),
        ("transport", "outage", "Aeropuertos cerrados, rutas cortadas"),
    ],
    "tornado": [
        ("electricity", "outage", "Cortes en zona de paso"),
        ("water", "operational", "Suministro normal"),
        ("communications", "degraded", "Antenas dañadas"),
        ("transport", "degraded", "Rutas con escombros"),
    ],
    "tsunami": [
        ("electricity", "outage", "Cortes en zona costera"),
        ("water", "degraded", "Contaminación de agua potable"),
        ("communications", "degraded", "Saturación masiva de red"),
        ("transport", "outage", "Rutas costeras cortadas"),
    ],
    "chemical": [
        ("electricity", "operational", "Operativo"),
        ("water", "outage", "Suministro suspendido por contaminación"),
        ("gas", "operational", "Operativo"),
        ("communications", "operational", "Operativo"),
        ("transport", "degraded", "Cordón sanitario en zona afectada"),
    ],
    "volcanic": [
        ("electricity", "degraded", "Cortes esporádicos por ceniza en transformadores"),
        ("water", "degraded", "Posible contaminación por ceniza en estanques"),
        ("communications", "operational", "Operativo"),
        ("internet", "degraded", "Antenas con interferencia por ceniza"),
        ("transport", "outage", "Aeropuertos cerrados — ceniza daña turbinas"),
        ("gas", "operational", "Operativo"),
    ],
    "blackout": [
        ("electricity", "outage", "Corte total de suministro eléctrico"),
        ("water", "degraded", "Bombas sin energía — presión cayendo"),
        ("communications", "degraded", "Antenas en respaldo (~4h de batería)"),
        ("internet", "outage", "Sin servicio en zonas residenciales"),
        ("transport", "outage", "Semáforos apagados — Metro detenido"),
        ("gas", "operational", "Operativo (independiente de la red eléctrica)"),
    ],
    "other": [
        ("electricity", "operational", "Operativo"),
        ("water", "operational", "Operativo"),
        ("communications", "operational", "Operativo"),
        ("transport", "operational", "Operativo"),
    ],
}


def _build_alerts(crisis_type: str, severity: str) -> List[Dict[str, Any]]:
    base = _ALERT_BASELINE.get(crisis_type, _ALERT_BASELINE["other"])
    out: List[Dict[str, Any]] = []
    for service, status, message in base:
        # Bump 'degraded' to 'outage' on critical events for water/electricity/comms.
        if (
            severity == "critical"
            and status == "degraded"
            and service in ("water", "electricity", "communications")
        ):
            status = "outage"
            message = f"{message} — escala crítica"
        out.append(
            {
                "id": _uid("alert"),
                "service": service,
                "status": status,
                "message": message,
                "updatedAt": _now_iso(),
            }
        )
    return out


# ----------------------------------------------------------------- timeline

# Timeline anchors per crisis type. Each entry is (phase, action).
_TIMELINE_TEMPLATES: Dict[str, List[Tuple[str, str]]] = {
    "earthquake": [
        ("first_5_min", "Resguardarse hasta que cese el sismo"),
        ("first_5_min", "Evaluar lesiones inmediatas"),
        ("first_hour", "Evacuar edificios potencialmente dañados"),
        ("first_hour", "Activar puntos de encuentro"),
        ("first_hour", "Establecer comunicación con servicios de emergencia"),
        ("first_day", "Inspección estructural por equipos especializados"),
        ("first_day", "Preparar respuesta a réplicas"),
        ("first_day", "Distribución inicial de agua y alimentos"),
        ("first_week", "Restablecimiento progresivo de servicios"),
        ("first_week", "Reubicación de damnificados en albergues"),
        ("first_week", "Evaluación de daños para gestión con seguros"),
    ],
    "flood": [
        ("first_5_min", "Trasladarse a niveles altos"),
        ("first_5_min", "Cortar electricidad en zonas inundadas"),
        ("first_hour", "Activar rutas de evacuación elevadas"),
        ("first_hour", "Despliegue de botes y bombas de achique"),
        ("first_day", "Distribución de agua potable embotellada"),
        ("first_day", "Atención médica para casos de hipotermia / heridas"),
        ("first_week", "Limpieza y desinfección de zonas anegadas"),
        ("first_week", "Control epidemiológico — leptospirosis, infecciones"),
    ],
    "fire": [
        ("first_5_min", "Llamar a bomberos y evaluar dirección del viento"),
        ("first_5_min", "Iniciar evacuación hacia barlovento"),
        ("first_hour", "Despliegue de carros bomba y aviones cisterna"),
        ("first_hour", "Cordón perimetral preventivo"),
        ("first_day", "Combate sostenido y vigilancia de focos secundarios"),
        ("first_day", "Atención a afectados por inhalación de humo"),
        ("first_week", "Control de daños y reforestación"),
        ("first_week", "Investigación de causas"),
    ],
    "hurricane": [
        ("first_5_min", "Refugiarse en habitación interior segura"),
        ("first_hour", "Monitoreo continuo del trayecto del huracán"),
        ("first_hour", "Cortes preventivos de electricidad en zonas vulnerables"),
        ("first_day", "Evaluación de daños tras paso del fenómeno"),
        ("first_day", "Despeje de rutas principales"),
        ("first_week", "Reconstrucción de techos, vidrios y postes caídos"),
    ],
    "tornado": [
        ("first_5_min", "Refugiarse en sótano o habitación interior"),
        ("first_hour", "Evaluación de daños y rescate de personas atrapadas"),
        ("first_day", "Despeje de escombros"),
        ("first_week", "Reconstrucción y soporte psicológico"),
    ],
    "tsunami": [
        ("first_5_min", "Activar alarmas SHOA y evacuar a altura"),
        ("first_hour", "Mantener evacuación — esperar trenes de olas adicionales"),
        ("first_day", "Búsqueda y rescate en zonas costeras"),
        ("first_day", "Atención médica de heridos y desaparecidos"),
        ("first_week", "Reconstrucción de infraestructura costera"),
    ],
    "chemical": [
        ("first_5_min", "Sellar interiores y apagar ventilación"),
        ("first_hour", "Despliegue de equipos hazmat"),
        ("first_hour", "Cordón sanitario y evacuación dirigida"),
        ("first_day", "Descontaminación profesional del área"),
        ("first_week", "Seguimiento médico de personas expuestas"),
    ],
    "volcanic": [
        ("first_5_min", "Refugiarse en interior y monitorear dirección del viento"),
        ("first_5_min", "Sintonizar SERNAGEOMIN para estado de actividad"),
        ("first_hour", "Activar zona de exclusión según radio de impacto"),
        ("first_hour", "Despliegue de mascarillas N95 a la población"),
        ("first_day", "Limpieza de techos y vías principales (peso de ceniza)"),
        ("first_day", "Inspección sanitaria de aguas de consumo"),
        ("first_week", "Restablecimiento progresivo de aeropuertos"),
        ("first_week", "Vigilancia continua de actividad sísmica volcánica"),
    ],
    "blackout": [
        ("first_5_min", "Confirmar el corte y reportar a la distribuidora"),
        ("first_hour", "Activar generadores en hospitales y servicios críticos"),
        ("first_hour", "Comunicación oficial sobre tiempo estimado de restauración"),
        ("first_day", "Distribución de hielo y agua a barrios afectados"),
        ("first_day", "Atención prioritaria a equipos médicos domiciliarios"),
        ("first_week", "Auditoría del sistema eléctrico para evitar recurrencia"),
    ],
    "other": [
        ("first_5_min", "Evaluación inicial de la situación"),
        ("first_hour", "Activación de equipos de respuesta"),
        ("first_day", "Estabilización y atención a afectados"),
        ("first_week", "Reconstrucción y normalización"),
    ],
}


def _build_timeline(crisis_type: str, severity: str) -> List[Dict[str, Any]]:
    template = _TIMELINE_TEMPLATES.get(crisis_type, _TIMELINE_TEMPLATES["other"])
    return [
        {
            "id": _uid("tl"),
            "phase": phase,
            "action": action,
            "completed": False,
            "order": i,
        }
        for i, (phase, action) in enumerate(template)
    ]


# ------------------------------------------------------------------ weather

def _fetch_weather_blocking(lat: float, lng: float) -> Optional[Dict[str, Any]]:
    """Call the Open-Meteo current-weather endpoint. Best effort, fail silently.

    Returns a `WeatherData` dict on success; `None` on any error (network,
    timeout, parse). The agent path is responsible for falling back to
    ``state.weather = None`` so the canvas just doesn't render the weather
    chip — no error should bubble up.
    """
    try:
        params = urllib.parse.urlencode(
            {
                "latitude": lat,
                "longitude": lng,
                "current": "temperature_2m,wind_speed_10m,relative_humidity_2m,weather_code",
                "timezone": "auto",
            }
        )
        url = f"https://api.open-meteo.com/v1/forecast?{params}"
        with urllib.request.urlopen(url, timeout=4) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        cur = data.get("current") or {}
        # WMO weather codes — short Spanish descriptions for the most common.
        code = int(cur.get("weather_code") or 0)
        desc_map = {
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
        }
        return {
            "temperature": float(cur.get("temperature_2m", 0)),
            "windSpeed": float(cur.get("wind_speed_10m", 0)),
            "humidity": float(cur.get("relative_humidity_2m", 0)),
            "description": desc_map.get(code, f"Código {code}"),
            "alerts": [],
        }
    except Exception:
        return None


# ----------------------------------------------------------------- registered tools


@tool
def generate_crisis(
    description: Annotated[
        str,
        "Free-form crisis description. Examples: 'Terremoto magnitud 7 en Santiago de Chile', "
        "'Inundación severa en Lima', 'Incendio forestal cerca de Valparaíso'.",
    ],
    tool_call_id: Annotated[str, InjectedToolCallId] = "",
) -> Command:
    """Populate the entire Crisis Manager canvas from a description in one shot.

    Parses the description for type / severity / location, then writes all of
    `crisis`, `safeZones`, `checklist`, `resources`, `alerts`, `timeline`,
    `weather`, and `header` on the agent state via Command(update=). The
    frontend's STATE_SNAPSHOT picks the change up so the canvas paints in
    one tick — no follow-up setCrisis / setSafeZones / setChecklist needed.

    Returns a brief one-line summary in the ToolMessage that the agent can
    relay to the user.
    """
    try:
        crisis_type = _detect_type(description)
        location = _detect_location(description)
        severity = _detect_severity(description, crisis_type)
        radius = _SEVERITY_RADIUS_KM[severity]

        crisis_id = _uid("crisis")
        title = description.strip()[:80] if description else f"Crisis {crisis_type}"

        crisis: Dict[str, Any] = {
            "id": crisis_id,
            "type": crisis_type,
            "severity": severity,
            "title": title,
            "description": description.strip(),
            "location": {
                "lat": location["lat"],
                "lng": location["lng"],
                "name": location["name"],
            },
            "affectedRadius": radius,
            "timestamp": _now_iso(),
        }

        safe_zones = _build_safe_zones(crisis_type, severity, location)
        checklist = _build_checklist(crisis_type)
        resources = _build_resources(crisis_type, severity)
        alerts = _build_alerts(crisis_type, severity)
        timeline = _build_timeline(crisis_type, severity)
        weather = _fetch_weather_blocking(location["lat"], location["lng"])

        immediate_count = sum(1 for c in checklist if c["priority"] == "immediate")
        critical_resources = sum(1 for r in resources if r["critical"])

        type_label_es = {
            "earthquake": "Terremoto",
            "flood": "Inundación",
            "fire": "Incendio",
            "hurricane": "Huracán",
            "tornado": "Tornado",
            "tsunami": "Tsunami",
            "chemical": "Incidente químico",
            "volcanic": "Erupción volcánica",
            "blackout": "Apagón masivo",
            "other": "Crisis",
        }[crisis_type]
        severity_label_es = {
            "low": "leve",
            "moderate": "moderada",
            "high": "alta",
            "critical": "crítica",
        }[severity]

        header = {
            "title": f"{type_label_es} · {location['name']}",
            "subtitle": (
                f"Severidad {severity_label_es} · radio {radius} km · "
                f"{len(safe_zones)} zonas seguras · {immediate_count} acciones inmediatas"
            ),
        }

        summary = (
            f"Generada crisis '{type_label_es}' en {location['name']} "
            f"(severidad {severity_label_es}). "
            f"{len(safe_zones)} zonas seguras, {len(checklist)} ítems en checklist, "
            f"{len(resources)} categorías de recursos ({critical_resources} críticos), "
            f"{len(alerts)} alertas de servicios."
        )

        update: Dict[str, Any] = {
            "crisis": crisis,
            "safeZones": safe_zones,
            "checklist": checklist,
            "resources": resources,
            "alerts": alerts,
            "timeline": timeline,
            "header": header,
            "activeModule": "overview",
            "messages": [ToolMessage(content=summary, tool_call_id=tool_call_id)],
        }
        if weather is not None:
            update["weather"] = weather

        return Command(update=update)
    except Exception as e:  # noqa: BLE001 - surface error to the LLM
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content=f"generate_crisis failed: {e}",
                        tool_call_id=tool_call_id,
                    )
                ]
            }
        )


@tool
def fetch_weather(
    lat: Annotated[float, "Latitude of the location to query."],
    lng: Annotated[float, "Longitude of the location to query."],
    tool_call_id: Annotated[str, InjectedToolCallId] = "",
) -> Command:
    """Fetch a current-weather snapshot from Open-Meteo and apply it to the canvas.

    Open-Meteo is free and requires no API key. Returns a Command(update=)
    that writes `state.weather` directly. On network failure, the canvas
    state is left untouched and the ToolMessage carries the error reason.
    """
    weather = _fetch_weather_blocking(lat, lng)
    if weather is None:
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content=(
                            "No fue posible obtener el clima actual desde Open-Meteo. "
                            "Reintentar en unos segundos."
                        ),
                        tool_call_id=tool_call_id,
                    )
                ]
            }
        )

    summary = (
        f"Clima actualizado: {weather['temperature']}°C, "
        f"viento {weather['windSpeed']} km/h, "
        f"humedad {weather['humidity']}%. {weather['description']}."
    )
    return Command(
        update={
            "weather": weather,
            "messages": [ToolMessage(content=summary, tool_call_id=tool_call_id)],
        }
    )


@tool
def generate_timeline(
    crisis_type: Annotated[
        str,
        "Crisis type. One of: earthquake | flood | fire | hurricane | tornado | tsunami | chemical | other.",
    ],
    severity: Annotated[
        str,
        "Severity level. One of: low | moderate | high | critical.",
    ],
    tool_call_id: Annotated[str, InjectedToolCallId] = "",
) -> Command:
    """Regenerate the response timeline for a given (crisis_type, severity).

    Useful when the user wants to swap the timeline depth without
    regenerating the whole crisis (e.g. 'show me the response steps for a
    moderate flood instead'). Writes `state.timeline` directly.
    """
    try:
        crisis_type = (crisis_type or "other").lower()
        severity = (severity or "high").lower()
        if severity not in _SEVERITY_RADIUS_KM:
            severity = "high"
        timeline = _build_timeline(crisis_type, severity)
        return Command(
            update={
                "timeline": timeline,
                "messages": [
                    ToolMessage(
                        content=(
                            f"Timeline regenerada para {crisis_type} (severidad {severity}). "
                            f"{len(timeline)} acciones en 4 fases."
                        ),
                        tool_call_id=tool_call_id,
                    )
                ],
            }
        )
    except Exception as e:  # noqa: BLE001
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content=f"generate_timeline failed: {e}",
                        tool_call_id=tool_call_id,
                    )
                ]
            }
        )


# ------------------------------------------------------------------ loader


def load_crisis_tools() -> List[Any]:
    """Return the Crisis Manager backend tool list for the agent.

    Tools:
    - generate_crisis     (Command(update=) — populates the entire canvas)
    - fetch_weather       (Open-Meteo HTTP fetch — writes state.weather)
    - generate_timeline   (regenerate just the timeline)
    """
    tools: List[Any] = [generate_crisis, fetch_weather, generate_timeline]
    print(f"Crisis tools loaded: {len(tools)} tools", flush=True)
    return tools


# Backwards-compat alias — main.py used to import `load_notion_tools`. Keep it
# so the boot path doesn't break during the rewrite. Safe to delete after
# main.py has migrated.
load_notion_tools = load_crisis_tools


# ----------------------------------- CLI entry (formerly Notion pre-flight)
#
# `scripts/check-env.sh` calls `uv run python -m src.notion_tools --check`
# before booting the rest of the stack. We keep the entry point so the
# script doesn't fail, but the Crisis Manager has no external integration
# to verify — return OK and exit clean.

if __name__ == "__main__":
    import argparse
    import sys

    parser = argparse.ArgumentParser(
        description="Crisis Manager pre-flight check (no external integration to verify)."
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="legacy flag — always returns OK for the Crisis Manager build",
    )
    args = parser.parse_args()
    if args.check:
        print("OK: Crisis Manager has no external integration — preflight skipped.")
        sys.exit(0)
    parser.print_help()
    sys.exit(2)
