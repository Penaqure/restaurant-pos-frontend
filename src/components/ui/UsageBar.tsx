export default function UsageBar({ used, max, label }: { used: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, (used / max) * 100) : 0;
  const over = used > max;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={over ? "font-medium text-danger" : "font-medium text-foreground"}>
          {used} / {max}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-foreground/5">
        <div className={`h-full rounded-full ${over ? "bg-danger" : "bg-brand-600"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
