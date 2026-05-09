"use client";

import { ArrowRight, MapPin } from "lucide-react";
import type { CrisisSeverity, CrisisType } from "@/lib/leads/types";
import { crisisTypeIcon, severityClass } from "@/lib/leads/derive";

export interface CrisisMiniCardProps {
  title: string;
  type: CrisisType;
  severity: CrisisSeverity;
  locationName?: string;
  affectedRadius?: number;
  onOpenCanvas?: () => void;
}

export function LeadMiniCard({
  title,
  type,
  severity,
  locationName,
  affectedRadius,
  onOpenCanvas,
}: CrisisMiniCardProps) {
  return (
    <div className="my-2 rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-2xl"
          aria-hidden
        >
          {crisisTypeIcon(type)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">
              {title}
            </span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ring-inset ${severityClass(severity)}`}
            >
              {severity}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="capitalize">{type}</span>
            {locationName ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" />
                {locationName}
              </span>
            ) : null}
            {affectedRadius ? (
              <span className="font-mono">{affectedRadius} km radius</span>
            ) : null}
          </div>
          {onOpenCanvas ? (
            <button
              type="button"
              onClick={onOpenCanvas}
              className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Open in canvas
              <ArrowRight className="size-3" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
