import type { ComponentProps } from "react";
export const Table = (p: ComponentProps<"table">) => <table {...p} />;
export const TableHeader = (p: ComponentProps<"thead">) => <thead {...p} />;
export const TableBody = (p: ComponentProps<"tbody">) => <tbody {...p} />;
export const TableRow = (p: ComponentProps<"tr">) => <tr {...p} />;
export const TableHead = (p: ComponentProps<"th">) => <th {...p} />;
export const TableCell = (p: ComponentProps<"td">) => <td {...p} />;
