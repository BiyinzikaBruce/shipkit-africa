/**
 * ShipKit · empty-state
 * What a list shows when it has nothing yet: icon, one sentence, the main action.
 *
 *   <EmptyState icon={<Receipt />} title="No sales yet today" action={<Button>New sale</Button>} />
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-10 text-center", className)}>
      {icon && <div className="text-muted-foreground [&_svg]:size-10">{icon}</div>}
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
