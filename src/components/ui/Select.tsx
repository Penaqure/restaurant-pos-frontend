import { SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "w-full appearance-none rounded-md border border-border bg-surface-card px-3 py-2 pr-8 text-sm text-foreground",
            "focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100",
            "disabled:cursor-not-allowed disabled:opacity-60",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    );
  },
);
Select.displayName = "Select";

export default Select;
