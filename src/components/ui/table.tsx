import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Th({
  children,
  align = "left",
  className,
}: {
  children?: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function TableEmpty({
  colSpan,
  loading,
  emptyText = "No records found.",
}: {
  colSpan: number;
  loading: boolean;
  emptyText?: string;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-5 py-10 text-sm text-center text-gray-400"
      >
        {loading ? "Loading..." : emptyText}
      </td>
    </tr>
  );
}
