import { cn } from "@/lib/utils";

export type Status =
  | "available"
  | "deployed"
  | "offline"
  | "done"
  | "in-progress"
  | "pending"
  | "operational"
  | "degraded"
  | "outage"
  | "unknown";

const STYLES: Record<Status, string> = {
  available:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  done:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  operational:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  deployed:
    "bg-amber-500/20 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  "in-progress":
    "bg-amber-500/20 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  degraded:
    "bg-amber-500/20 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  pending:
    "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  offline:
    "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500",
  outage:
    "bg-red-500/15 text-red-700 dark:text-red-400",
  unknown:
    "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export function StatusChip({
  status,
  label,
  className,
}: {
  status: Status;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-sm font-mono text-[10px] font-semibold tracking-[0.08em] uppercase",
        STYLES[status],
        className,
      )}
    >
      {label ?? status.replace("-", " ")}
    </span>
  );
}
