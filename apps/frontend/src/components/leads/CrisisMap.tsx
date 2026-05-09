"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { Crisis, SafeZone } from "@/lib/leads/types";

export interface CrisisMapProps {
  crisis: Crisis | null;
  safeZones: SafeZone[];
  highlightedZoneIds?: string[];
  selectedZoneId?: string | null;
  onSelectZone?: (zoneId: string | null) => void;
  affectedCount?: number | null;
  evacuatedCount?: number | null;
  shelteredCount?: number | null;
  etaStable?: string | null;
}

const CRISIS_ICON = L.divIcon({
  className: "crisisos-marker",
  html: `<div style="
    width: 14px; height: 14px;
    background: #ef4444;
    transform: rotate(45deg);
    box-shadow: 0 0 0 0 rgba(239,68,68,.45);
    animation: pulse-crit 1.4s ease-in-out infinite;
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function zoneIcon(type: SafeZone["type"], status: SafeZone["status"], highlighted: boolean) {
  const colorByType: Record<SafeZone["type"], string> = {
    shelter: "#10b981",
    hospital: "#ef4444",
    fire_station: "#f59e0b",
    police: "#38bdf8",
    assembly_point: "#9caa90",
  };
  const fill =
    status === "closed" ? "#6f7468" : status === "full" ? "#f59e0b" : colorByType[type];
  const ring = highlighted ? "2px solid #9caa90" : "1px solid rgba(255,255,255,0.6)";
  return L.divIcon({
    className: "crisisos-zone-marker",
    html: `<div style="
      width:14px;height:14px;
      background:${fill};border:${ring};
      box-shadow: 0 1px 4px rgba(0,0,0,0.5);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function FlyTo({
  center,
  zoom,
  selectedZone,
}: {
  center: [number, number];
  zoom: number;
  selectedZone: SafeZone | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (selectedZone) {
      map.flyTo([selectedZone.location.lat, selectedZone.location.lng], 14, { duration: 0.6 });
    } else {
      map.flyTo(center, zoom, { duration: 0.6 });
    }
  }, [map, center, zoom, selectedZone]);
  return null;
}

function MapBinder({ onMap }: { onMap: (m: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    onMap(map);
  }, [map, onMap]);
  return null;
}

export function CrisisMap({
  crisis,
  safeZones,
  highlightedZoneIds = [],
  selectedZoneId = null,
  onSelectZone,
  affectedCount,
  evacuatedCount,
  shelteredCount,
  etaStable,
}: CrisisMapProps) {
  const center = useMemo<[number, number]>(() => {
    if (crisis) return [crisis.location.lat, crisis.location.lng];
    if (safeZones.length > 0) {
      return [safeZones[0].location.lat, safeZones[0].location.lng];
    }
    return [-33.4489, -70.6693];
  }, [crisis, safeZones]);

  const zoom = crisis ? 12 : 6;
  const selectedZone = useMemo(
    () => safeZones.find((z) => z.id === selectedZoneId) ?? null,
    [safeZones, selectedZoneId],
  );

  const highlights = useMemo(() => new Set(highlightedZoneIds), [highlightedZoneIds]);
  const mapRef = useRef<L.Map | null>(null);
  const [search, setSearch] = useState("");

  const handleRecenter = () => {
    mapRef.current?.flyTo(center, zoom, { duration: 0.5 });
  };

  return (
    <div className="relative h-full w-full overflow-hidden border border-line bg-bg">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%", minHeight: 360, background: "#0a0d0a" }}
        scrollWheelZoom
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
        />
        <MapBinder onMap={(m) => (mapRef.current = m)} />
        <FlyTo center={center} zoom={zoom} selectedZone={selectedZone} />
        {crisis ? (
          <>
            <Marker position={[crisis.location.lat, crisis.location.lng]} icon={CRISIS_ICON}>
              <Popup>
                <strong>{crisis.title}</strong>
                <br />
                Severity: {crisis.severity}
                <br />
                Radius: {crisis.affectedRadius} km
              </Popup>
            </Marker>
            <Circle
              center={[crisis.location.lat, crisis.location.lng]}
              radius={crisis.affectedRadius * 1000}
              pathOptions={{
                color: "#ef4444",
                fillColor: "#ef4444",
                fillOpacity: 0.08,
                weight: 1.5,
              }}
            />
          </>
        ) : null}
        {safeZones.map((z) => (
          <Marker
            key={z.id}
            position={[z.location.lat, z.location.lng]}
            icon={zoneIcon(z.type, z.status, highlights.has(z.id))}
            eventHandlers={{ click: () => onSelectZone?.(z.id) }}
          >
            <Popup>
              <strong>{z.name}</strong>
              <br />
              {z.type.replace("_", " ")} · {z.status}
              {z.distance !== undefined ? (
                <>
                  <br />
                  {z.distance.toFixed(1)} km away
                </>
              ) : null}
              {z.phone ? (
                <>
                  <br />
                  📞 {z.phone}
                </>
              ) : null}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend (top-left) */}
      <div className="pointer-events-auto absolute left-4 top-4 z-[400] space-y-1.5 border border-line bg-bg-2/90 p-3 font-mono text-xs backdrop-blur-sm">
        <div className="mb-2 tracking-[0.2em] text-txt-low">LEGEND</div>
        <LegendRow color="bg-red-500" label="Danger" />
        <LegendRow color="bg-amber-500" label="Evac" />
        <LegendRow color="bg-emerald-500" label="Safe / shelter" />
        <LegendRow color="bg-sky-500" label="Resource" />
      </div>

      {/* Search (top-right) */}
      <div className="pointer-events-auto absolute right-4 top-4 z-[400] flex w-72 items-center gap-2 border border-line bg-bg-2/90 px-3 py-2 text-xs backdrop-blur-sm">
        <span className="text-txt-low">⌕</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-txt-mid outline-none placeholder:text-txt-low"
          placeholder="Search address, zone, resource…"
        />
        <span className="rounded-sm border border-line border-b-2 px-1.5 font-mono text-[10px] text-txt-low">
          /
        </span>
      </div>

      {/* Mini stats (bottom-left) */}
      {crisis ? (
        <div className="pointer-events-auto absolute bottom-4 left-4 z-[400] grid grid-cols-4 divide-x divide-line border border-line bg-bg-2/95 backdrop-blur-sm">
          <Stat label="AFFECTED" value={fmt(affectedCount)} tone="text-red-400" />
          <Stat label="EVACUATED" value={fmt(evacuatedCount)} tone="text-amber-400" />
          <Stat label="SHELTERED" value={fmt(shelteredCount)} tone="text-emerald-400" />
          <Stat label="ETA STABLE" value={etaStable ?? "—"} tone="text-sky-400" />
        </div>
      ) : null}

      {/* Recenter (bottom-right) */}
      <button
        type="button"
        onClick={handleRecenter}
        className="pointer-events-auto absolute bottom-4 right-4 z-[400] border border-line-strong bg-bg-2 px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] text-txt-mid transition hover:border-brand hover:text-txt-hi"
      >
        ⊕ RECENTER
      </button>
    </div>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-txt-mid">
      <span className={`inline-block size-1.5 rounded-full ${color}`} />
      {label}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="px-3 py-2 font-mono">
      <div className="text-[10px] tracking-[0.2em] text-txt-low">{label}</div>
      <div className={`text-xl font-bold ${tone}`}>{value}</div>
    </div>
  );
}

function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString();
}
