/**
 * ShipKit · kpi-card
 * Dashboard number card. Money is formatted with ShipKit money helpers,
 * showing the short form with the full value on hover.
 *
 *   <KpiCard label="Sales today" amount={1250000} currency="UGX" change={12.5} />
 *   <KpiCard label="Items sold" value={342} />
 */
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatMoney, formatMoneyShort, type MoneyInput } from "@/lib/shipkit/money";

interface Props {
  label: string;
  /** Money value (formatted with currency). */
  amount?: MoneyInput;
  currency?: string;
  /** Plain number value (counts). */
  value?: number;
  /** % change vs previous period. */
  change?: number;
  hint?: string;
  icon?: ReactNode;
  className?: string;
}

export function KpiCard({ label, amount, currency = "UGX", value, change, hint, icon, className }: Props) {
  const isMoney = amount !== undefined;
  const display = isMoney ? formatMoneyShort(amount, currency) : new Intl.NumberFormat().format(value ?? 0);
  const full = isMoney ? formatMoney(amount, currency) : undefined;

  return (
    <Card className={cn("gap-0", className)}>
      <CardContent className="space-y-2 p-5">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{label}</span>
          {icon}
        </div>
        <div className="text-3xl font-bold tabular-nums tracking-tight" title={full}>
          {display}
        </div>
        {(change !== undefined || hint) && (
          <div className="flex items-center gap-2 text-xs">
            {change !== undefined && (
              <span className={cn("font-medium", change >= 0 ? "text-green-600" : "text-red-600")}>
                {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%
              </span>
            )}
            {hint && <span className="text-muted-foreground">{hint}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
