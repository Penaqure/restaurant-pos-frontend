import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

// secondary/outline/ghost hovers use opacity-based tints of the existing
// tokens (brand-500/foreground) rather than literal pale swatches like
// brand-50 or black/5 -- those are tuned to sit on a white card and read as
// a washed-out or near-invisible patch on a dark one, since the app's brand
// ramp itself doesn't have a dark-mode variant (see globals.css). An
// opacity tint of a color that's already correct in both themes adapts for
// free. primary/danger stay literal: solid, fully-opaque brand colors read
// fine against either background, same as any filled button.
const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300",
  secondary:
    "bg-surface-card text-foreground border border-border shadow-soft hover:bg-brand-500/10 hover:border-brand-500/40",
  outline:
    "border border-border text-foreground hover:bg-brand-500/10 hover:border-brand-500/40",
  ghost: "text-foreground hover:bg-foreground/5",
  danger: "bg-danger text-white shadow-sm hover:bg-red-600 active:bg-red-700",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9.5 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors",
          "disabled:cursor-not-allowed disabled:opacity-60",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export default Button;
