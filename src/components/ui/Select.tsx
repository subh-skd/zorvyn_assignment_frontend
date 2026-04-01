import { cn } from "@/lib/utils";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none bg-white",
        "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
