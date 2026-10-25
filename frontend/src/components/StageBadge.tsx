import { cn } from "@/lib/utils";
import { stageMeta } from "@/lib/helpers";
import type { Order, Stage } from "@/lib/types";

export function StageBadge({ stage, className }: { stage: Stage; className?: string }) {
  const m = stageMeta(stage);
  return (
    <span
      data-testid="stage-badge"
      className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold", m.cls, className)}
    >
      {m.label}
    </span>
  );
}

// Compact pipeline pills: Pay / Items / Bill / Pack / Track
export function PipelinePills({ order }: { order: Order }) {
  const sh = order.shipments;
  const all = (k: "bill_ready" | "packed" | "tracking_added") => sh.length > 0 && sh.every((s) => s[k]);
  const pills: [string, boolean][] = [
    ["Pay", order.payment_received],
    ["Items", order.items.every((i) => i.availability === "available")],
    ["Bill", all("bill_ready")],
    ["Pack", all("packed")],
    ["Track", all("tracking_added")],
  ];
  return (
    <div className="flex flex-wrap gap-1">
      {pills.map(([l, ok]) => (
        <span
          key={l}
          className={cn(
            "rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase",
            ok ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-400",
          )}
        >
          {l}
        </span>
      ))}
    </div>
  );
}
