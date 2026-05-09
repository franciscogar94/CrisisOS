import { cn } from "@/lib/utils";

export type Priority = "urgent" | "high" | "med" | "low";

const STYLES: Record<Priority, string> = {
  urgent: "bg-amber-500/15 text-amber-400",
  high: "bg-zinc-800 text-zinc-300",
  med: "bg-zinc-800 text-zinc-400",
  low: "bg-zinc-800/60 text-zinc-500",
};

const LABEL: Record<Priority, string> = {
  urgent: "URGENT",
  high: "HIGH",
  med: "MED",
  low: "LOW",
};

export function PriorityChip({
  priority,
  label,
  className,
}: {
  priority: Priority;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-sm font-mono text-[10px] font-semibold tracking-[0.08em] uppercase",
        STYLES[priority],
        className,
      )}
    >
      {label ?? LABEL[priority]}
    </span>
  );
}
