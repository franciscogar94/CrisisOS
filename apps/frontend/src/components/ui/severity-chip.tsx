import { cn } from "@/lib/utils";

export type Severity = "critical" | "high" | "info" | "safe";

const STYLES: Record<Severity, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/40",
  high: "bg-amber-500/15 text-amber-400 border-amber-500/40",
  info: "bg-sky-500/15 text-sky-400 border-sky-500/40",
  safe: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
};

const LABEL: Record<Severity, string> = {
  critical: "CRITICAL",
  high: "HIGH",
  info: "INFO",
  safe: "SAFE",
};

export function SeverityChip({
  severity,
  label,
  className,
}: {
  severity: Severity;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border font-mono text-[10px] font-semibold tracking-[0.08em] uppercase",
        STYLES[severity],
        className,
      )}
    >
      {label ?? LABEL[severity]}
    </span>
  );
}
