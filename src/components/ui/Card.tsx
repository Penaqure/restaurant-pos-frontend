import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      // min-w-0 matters as soon as a Card sits in a grid/flex row (which is
      // almost always): without it, a grid/flex item's default min-width is
      // its content's natural size, so a wide table or chart inside pushes
      // the Card past its assigned track instead of letting the table's own
      // overflow-x-auto handle the overflow -- widening the whole page.
      className={cn(
        "min-w-0 rounded-xl border border-border bg-surface-card shadow-card",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-between gap-3 border-b border-border px-5 py-4", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-sm font-semibold text-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}
