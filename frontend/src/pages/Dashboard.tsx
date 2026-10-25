import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, FileSpreadsheet, Package, Receipt, Truck, Wallet, Zap, Boxes } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import NewOrderDialog from "@/components/NewOrderDialog";
import { PipelinePills, StageBadge } from "@/components/StageBadge";
import { STAGES, fmtQty } from "@/lib/helpers";
import { useDashboard, useProcurement } from "@/lib/queries";

export default function Dashboard() {
  const { data, isError } = useDashboard();
  const { data: proc = [] } = useProcurement();
  const nav = useNavigate();
  const d = isError ? undefined : data;

  const tiles = [
    { label: "Open orders", value: d?.open_orders, icon: Boxes, to: "/orders?stage=open", tone: "text-slate-900" },
    { label: "Payment pending", value: d?.by_stage.payment_pending, icon: Wallet, to: "/orders?stage=payment_pending", tone: "text-red-700" },
    { label: "Items missing", value: d?.pending_items, icon: AlertTriangle, to: "/procurement", tone: "text-amber-700" },
    { label: "Bills pending", value: d?.bill_pending, icon: Receipt, to: "/orders?stage=billing", tone: "text-blue-700" },
    { label: "Parcels to pack", value: d?.packing_due, icon: Package, to: "/orders?stage=packing", tone: "text-purple-700" },
    { label: "Tracking needed", value: d?.tracking_needed, icon: Truck, to: "/orders?stage=tracking", tone: "text-cyan-700" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-sky-700">Command center</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Today's pipeline</h1>
          <p className="mt-1 text-slate-600">Every order, parcel and checklist in one place — no more scrolling WhatsApp.</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/export/excel" data-testid="export-excel-btn" className={buttonVariants({ variant: "outline" })}>
            <FileSpreadsheet className="size-4 text-emerald-600" /> Export Excel
          </a>
          <NewOrderDialog />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {tiles.map((t, i) => (
          <Link
            key={t.label}
            to={t.to}
            data-testid={`stat-${t.label.toLowerCase().replace(/ /g, "-")}`}
            style={{ animationDelay: `${i * 40}ms` }}
            className="animate-rise rounded-xl border bg-white p-4 shadow-sm transition-shadow duration-150 hover:shadow-md"
          >
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t.label}
              <t.icon className="size-4" />
            </div>
            <div className={`mt-2 font-heading text-3xl font-bold ${t.tone}`}>{t.value ?? "—"}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="space-y-3 lg:col-span-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recently updated</h2>
            <Link to="/orders" className="flex items-center gap-1 text-sm font-medium text-sky-700 hover:underline">
              All orders <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border bg-white">
            {(d?.recent ?? []).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => nav(`/orders/${o.id}`)}
                data-testid={`recent-order-${o.order_no}`}
                className="flex w-full flex-wrap items-center justify-between gap-3 border-b px-4 py-3 text-left transition-colors duration-150 last:border-b-0 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-500">#{o.order_no}</span>
                    <span className="font-semibold text-slate-900">{o.client_name}</span>
                    <span className="text-xs text-slate-500">· {o.country}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {o.items.length} items · {o.shipments.length} parcel(s) · {o.assigned_to || "Unassigned"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <PipelinePills order={o} />
                  <StageBadge stage={o.stage} />
                </div>
              </button>
            ))}
            {!d && <div className="p-6 text-sm text-muted-foreground">Orders will appear here.</div>}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STAGES.map((s) => (
              <Link
                key={s.key}
                to={`/orders?stage=${s.key}`}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium transition-shadow duration-150 hover:shadow-sm ${s.cls}`}
              >
                {s.label}
                <span className="font-mono font-bold">{d?.by_stage[s.key] ?? 0}</span>
              </Link>
            ))}
          </div>
        </section>

        <aside className="space-y-3 lg:col-span-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Bring from market</h2>
            <Link to="/procurement" className="text-sm font-medium text-sky-700 hover:underline">Open</Link>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-2" data-testid="dashboard-procurement-list">
            {proc.slice(0, 8).map((g) => (
              <div key={g.name} className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm hover:bg-amber-100/60">
                <span className="font-medium text-amber-950">{g.name}</span>
                <span className="whitespace-nowrap font-mono text-xs font-semibold text-amber-800">
                  {fmtQty(g.total_qty)} {g.unit} · {g.entries.length} order(s)
                </span>
              </div>
            ))}
            {proc.length === 0 && <div className="px-3 py-4 text-sm text-amber-900">Nothing pending. All medicines available.</div>}
          </div>
          <div className="rounded-xl border bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Zap className="size-4 text-red-600" /> Express parcels open: {d?.express_open ?? 0}</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Open orders by country</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(d?.by_country ?? {}).map(([c, n]) => (
                <Link key={c} to={`/orders?country=${encodeURIComponent(c)}`} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium hover:bg-slate-200">
                  {c} <span className="font-mono">{n}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
