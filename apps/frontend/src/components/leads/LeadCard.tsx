"use client";

import { motion } from "motion/react";
import { Phone, Users, MapPin } from "lucide-react";
import type { SafeZone } from "@/lib/leads/types";
import {
  formatDistance,
  safeZoneClass,
  safeZoneStatusClass,
} from "@/lib/leads/derive";

export interface SafeZoneCardProps {
  zone: SafeZone;
  selected?: boolean;
  highlighted?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export function LeadCard({
  zone,
  selected,
  highlighted,
  onClick,
  compact,
}: SafeZoneCardProps) {
  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      onClick={onClick}
      className={`group cursor-pointer rounded-xl border bg-card p-3 shadow-sm transition ${
        selected
          ? "border-primary ring-2 ring-primary/30"
          : highlighted
            ? "border-amber-400 ring-2 ring-amber-300/50"
            : "border-border hover:border-foreground/20"
      } ${compact ? "p-2.5" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">
            {zone.name}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="size-3" />
            {formatDistance(zone.distance)}
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ring-1 ring-inset ${safeZoneStatusClass(zone.status)}`}
        >
          {zone.status}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${safeZoneClass(zone.type)}`}
        >
          {zone.type.replace("_", " ")}
        </span>
        {zone.capacity ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            <Users className="size-3" />
            {zone.capacity}
          </span>
        ) : null}
        {zone.phone ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            <Phone className="size-3" />
            {zone.phone}
          </span>
        ) : null}
      </div>
      {zone.notes ? (
        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
          {zone.notes}
        </p>
      ) : null}
    </motion.div>
  );
}
