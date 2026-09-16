import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-md border border-border bg-surface-card px-3 py-2 text-sm text-foreground",
          "placeholder:text-muted-foreground",
          "focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export default Input;
