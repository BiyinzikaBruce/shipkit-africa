/**
 * ShipKit · status-badge
 * Consistent colours for payment / order / sync statuses. Always shows text,
 * never colour alone.
 *
 *   <StatusBadge status="PENDING" />
 *   <StatusBadge status="SUCCESSFUL" label="Paid" />
 */
import { cn } from "@/lib/utils";

const TONES = {
  success: "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400",
  warning: "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400",
  danger: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400",
  neutral: "bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-500/10 dark:text-zinc-300",
  info: "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400",
} as const;

export type StatusTone = keyof typeof TONES;

/** Default mapping. Extend it for your own statuses. */
export const STATUS_TONES: Record<string, StatusTone> = {
  SUCCESSFUL: "success", PAID: "success", COMPLETED: "success", ACTIVE: "success", SYNCED: "success",
  PENDING: "warning", PROCESSING: "warning", PARTIAL: "warning", QUEUED: "warning",
  FAILED: "danger", CANCELLED: "danger", VOIDED: "danger", EXPIRED: "danger", OVERDUE: "danger",
  DRAFT: "neutral", INACTIVE: "neutral",
  REFUNDED: "info",
};

function humanise(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
}

export function StatusBadge({
  status,
  label,
  tone,
  className,
}: {
  status: string;
  label?: string;
  tone?: StatusTone;
  className?: string;
}) {
  const t = tone ?? STATUS_TONES[status.toUpperCase()] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONES[t],
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {label ?? humanise(status)}
    </span>
  );
}
