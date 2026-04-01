import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none",
        "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all",
        className,
      )}
      {...props}
    />
  );
}
