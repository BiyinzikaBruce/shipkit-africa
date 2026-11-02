"use client";
/**
 * ShipKit · data-table
 * A table for server-paginated lists. Page and search live in the URL
 * (`?page=2&q=milk`), so the SERVER fetches only one page (never load everything).
 *
 *   // page.tsx (server)
 *   const page = Number((await searchParams).page ?? 1);
 *   const [rows, total] = await Promise.all([
 *     prisma.sale.findMany({ where, take: 25, skip: (page - 1) * 25, orderBy: { createdAt: "desc" } }),
 *     prisma.sale.count({ where }),
 *   ]);
 *   return <DataTable columns={columns} data={rows} total={total} page={page} pageSize={25} searchable />;
 */
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Props<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  empty?: React.ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  total,
  page,
  pageSize,
  searchable = false,
  searchPlaceholder = "Search…",
  empty = "No results.",
}: Props<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel(), manualPagination: true, pageCount });

  function go(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  // Debounced search → resets to page 1
  useEffect(() => {
    if (!searchable) return;
    const current = searchParams.get("q") ?? "";
    if (query === current) return;
    const t = setTimeout(() => go({ q: query.trim() || null, page: null }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, searchable]);

  return (
    <div className="space-y-3">
      {searchable && (
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="max-w-xs"
          aria-label="Search"
        />
      )}
      <div className={isPending ? "rounded-xl border opacity-60 transition-opacity" : "rounded-xl border"}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {empty}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span className="tabular-nums">
          {total === 0 ? "0 results" : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1 || isPending} onClick={() => go({ page: String(page - 1) })}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={page >= pageCount || isPending} onClick={() => go({ page: String(page + 1) })}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
