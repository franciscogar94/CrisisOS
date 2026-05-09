"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { Crisis, SafeZone } from "@/lib/leads/types";

export interface CrisisMapProps {
  crisis: Crisis | null;
  safeZones: SafeZone[];
  highlightedZoneIds?: string[];
  selectedZoneId?: string | null;
  onSelectZone?: (zoneId: string | null) => void;
}

const CRISIS_ICON = L.divIcon({
  className: "crisisos-marker",
  html: `<div style="
    width: 28px; height: 28px; border-radius: 50%;
    background: rgba(244,63,94,0.95);
    border: 3px solid white;
    box-shadow: 0 0 0 2px rgba(244,63,94,0.45);
    display:flex;align-items:center;justify-content:center;
    color:white;font-size:14px;font-weight:700;
  ">!</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function zoneIcon(type: SafeZone["type"], status: SafeZone["status"], highlighted: boolean) {
  const colorByType: Record<SafeZone["type"], string> = {
    shelter: "#10b981",
    hospital: "#f43f5e",
    fire_station: "#f97316",
    police: "#3b82f6",
    assembly_point: "#8b5cf6",
  };
  const fill =
    status === "closed"
      ? "#94a3b8"
      : status === "full"
        ? "#f59e0b"
        : colorByType[type];
  const ring = highlighted ? "3px solid #facc15" : "2px solid white";
  return L.divIcon({
    className: "crisisos-zone-marker",
    html: `<div style="
      width:22px;height:22px;border-radius:50%;
      background:${fill};border:${ring};
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
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
      map.flyTo([selectedZone.location.lat, selectedZone.location.lng], 14, {
        duration: 0.6,
      });
    } else {
      map.flyTo(center, zoom, { duration: 0.6 });
    }
  }, [map, center, zoom, selectedZone]);
  return null;
}

export function CrisisMap({
  crisis,
  safeZones,
  highlightedZoneIds = [],
  selectedZoneId = null,
  onSelectZone,
}: CrisisMapProps) {
  const center = useMemo<[number, number]>(() => {
    if (crisis) return [crisis.location.lat, crisis.location.lng];
    if (safeZones.length > 0) {
      return [safeZones[0].location.lat, safeZones[0].location.lng];
    }
    return [-33.4489, -70.6693];
  }, [crisis, safeZones]);

  const selectedZone = useMemo(
    () => safeZones.find((z) => z.id === selectedZoneId) ?? null,
    [safeZones, selectedZoneId],
  );

  const highlights = useMemo(() => new Set(highlightedZoneIds), [highlightedZoneIds]);

  return (
    <div className="h-full w-full overflow-hidden rounded-xl border border-border">
      <MapContainer
        center={center}
        zoom={crisis ? 12 : 6}
        style={{ height: "100%", width: "100%", minHeight: 360 }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyTo center={center} zoom={crisis ? 12 : 6} selectedZone={selectedZone} />
        {crisis ? (
          <>
            <Marker
              position={[crisis.location.lat, crisis.location.lng]}
              icon={CRISIS_ICON}
            >
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
                color: "#f43f5e",
                fillColor: "#f43f5e",
                fillOpacity: 0.08,
                weight: 1,
              }}
            />
          </>
        ) : null}
        {safeZones.map((z) => (
          <Marker
            key={z.id}
            position={[z.location.lat, z.location.lng]}
            icon={zoneIcon(z.type, z.status, highlights.has(z.id))}
            eventHandlers={{
              click: () => onSelectZone?.(z.id),
            }}
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
    </div>
  );
}
