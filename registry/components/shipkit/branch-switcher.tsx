"use client";
/**
 * ShipKit · branch-switcher
 * Lets owners and managers switch the branch a page shows, via a `?branch=` search param.
 * The SERVER decides which branches the user may see: pass only those in `branches`,
 * and re-check the param server-side before using it.
 *
 *   <BranchSwitcher branches={[{ id: "b1", name: "Kampala Road" }]} allowAll />
 */
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const ALL_BRANCHES = "all";

export function BranchSwitcher({
  branches,
  allowAll = false,
  param = "branch",
}: {
  branches: { id: string; name: string }[];
  allowAll?: boolean;
  param?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const current = searchParams.get(param) ?? (allowAll ? ALL_BRANCHES : branches[0]?.id ?? "");

  function onChange(value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value === ALL_BRANCHES) next.delete(param);
    else next.set(param, value);
    next.delete("page");
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  return (
    <Select value={current} onValueChange={onChange} disabled={isPending}>
      <SelectTrigger className="w-[200px]" aria-label="Branch">
        <SelectValue placeholder="Select branch" />
      </SelectTrigger>
      <SelectContent>
        {allowAll && <SelectItem value={ALL_BRANCHES}>All branches</SelectItem>}
        {branches.map((b) => (
          <SelectItem key={b.id} value={b.id}>
            {b.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
