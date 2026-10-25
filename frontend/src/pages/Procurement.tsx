import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/lib/api";
import { AVAIL, errMsg, fmtQty, getActor } from "@/lib/helpers";
import { useProcurement } from "@/lib/queries";
import type { ProcurementGroup } from "@/lib/types";

export default function Procurement() {
  const { data, isError } = useProcurement();
  const groups = isError ? [] : (data ?? []);
  const qc = useQueryClient();
  const mark = useMutation({
    mutationFn: (name: string) => apiPost<ProcurementGroup[]>("/procurement/mark-available", { name, actor: getActor() }),
    onSuccess: (_d, name) => {
      qc.invalidateQueries();
      toast.success(`${name} marked available in all orders`);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-amber-700">Procurement radar</p>
        <h1 className="text-3xl font-bold">Medicines to bring from market</h1>
        <p className="text-slate-600">All items marked “Need from market” or “Unavailable”, grouped across every order.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((g, i) => (
          <div key={g.name} className="animate-rise rounded-xl border bg-white shadow-sm" data-testid={`procurement-group-${i}`}>
            <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
              <div>
                <div className="font-heading font-semibold text-slate-900">{g.name}</div>
                <div className="mt-1 flex gap-1.5 text-[11px] font-semibold">
                  {g.need_market > 0 && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">{g.need_market} need market</span>}
                  {g.unavailable > 0 && <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-800">{g.unavailable} unavailable</span>}
                </div>
              </div>
              <div className="text-right">
                <div className="font-heading text-2xl font-bold text-amber-700">{fmtQty(g.total_qty)}</div>
                <div className="text-xs text-slate-500">{g.unit}</div>
              </div>
            </div>
            <div className="divide-y">
              {g.entries.map((e) => (
                <Link key={e.item_id} to={`/orders/${e.order_id}`} className="flex items-center justify-between gap-2 px-4 py-2 text-sm transition-colors duration-150 hover:bg-slate-50">
                  <span>
                    <span className="font-mono text-xs text-slate-500">#{e.order_no}</span> {e.client_name}
                    {e.assigned_to && <span className="text-xs text-slate-400"> · {e.assigned_to}</span>}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-xs">{fmtQty(e.qty)} {e.unit}</span>
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${AVAIL[e.availability].cls}`}>{AVAIL[e.availability].label}</span>
                  </span>
                </Link>
              ))}
            </div>
            <div className="p-3">
              <Button
                variant="outline"
                className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                disabled={mark.isPending}
                onClick={() => mark.mutate(g.name)}
                data-testid={`procurement-mark-available-${i}`}
              >
                <CheckCircle2 className="size-4" /> Procured — mark available everywhere
              </Button>
            </div>
          </div>
        ))}
      </div>
      {groups.length === 0 && (
        <div className="rounded-xl border border-dashed bg-white p-12 text-center text-muted-foreground" data-testid="procurement-empty">
          <ShoppingBag className="mx-auto mb-2 size-8 text-slate-300" />
          Nothing to bring from the market right now.
        </div>
      )}
    </div>
  );
}
