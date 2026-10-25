import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NewOrderDialog from "@/components/NewOrderDialog";
import WhatsAppDialog from "@/components/WhatsAppDialog";
import { PipelinePills, StageBadge } from "@/components/StageBadge";
import { COUNTRIES, STAGES, fmtDate } from "@/lib/helpers";
import { useMembers, useOrders } from "@/lib/queries";

const ALL = "__all";

export default function Orders() {
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const f = {
    q: sp.get("q") ?? "",
    stage: sp.get("stage") ?? "",
    assigned: sp.get("assigned") ?? "",
    country: sp.get("country") ?? "",
    speed: sp.get("speed") ?? "",
  };
  const setF = (k: keyof typeof f, v: string) => {
    const n = new URLSearchParams(sp);
    if (v && v !== ALL) n.set(k, v);
    else n.delete(k);
    setSp(n, { replace: true });
  };
  const { data, isError, isLoading } = useOrders(f);
  const orders = isError ? [] : (data ?? []);
  const { data: members = [] } = useMembers();
  const stageLabel = (v: string) => (v === "open" ? "All open" : STAGES.find((s) => s.key === v)?.label ?? "All stages");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-slate-600">Search by client, medicine, address, tracking ID or order number.</p>
        </div>
        <NewOrderDialog />
      </div>

      <div className="grid gap-2 rounded-xl border bg-white p-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-2.5 top-2.5 size-4 text-slate-400" />
          <Input className="pl-8" placeholder="Search..." value={f.q} onChange={(e) => setF("q", e.target.value)} data-testid="orders-search-input" />
        </div>
        <Select value={f.stage || ALL} onValueChange={(v: string) => setF("stage", v)}>
          <SelectTrigger className="w-full" data-testid="orders-stage-filter"><SelectValue>{(v) => (v === ALL ? "All stages" : stageLabel(v as string))}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All stages</SelectItem>
            <SelectItem value="open">All open</SelectItem>
            {STAGES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={f.assigned || ALL} onValueChange={(v: string) => setF("assigned", v)}>
          <SelectTrigger className="w-full" data-testid="orders-member-filter"><SelectValue>{(v) => (v === ALL ? "All team" : (v as string))}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All team</SelectItem>
            {members.map((m) => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={f.country || ALL} onValueChange={(v: string) => setF("country", v)}>
          <SelectTrigger className="w-full" data-testid="orders-country-filter"><SelectValue>{(v) => (v === ALL ? "All countries" : (v as string))}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All countries</SelectItem>
            {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={f.speed || ALL} onValueChange={(v: string) => setF("speed", v)}>
          <SelectTrigger className="w-full" data-testid="orders-speed-filter"><SelectValue>{(v) => (v === ALL ? "Any speed" : v === "express" ? "Express" : "Normal")}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any speed</SelectItem>
            <SelectItem value="express">Express</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm" data-testid="orders-table">
          <thead>
            <tr className="border-b bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="p-3">Order</th>
              <th className="p-3">Client</th>
              <th className="p-3">Assigned</th>
              <th className="p-3">Items</th>
              <th className="p-3">Parcels</th>
              <th className="p-3">Checklist</th>
              <th className="p-3">Stage</th>
              <th className="p-3">Updated</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const missing = o.items.filter((i) => i.availability !== "available").length;
              const express = o.shipments.some((s) => s.speed === "express");
              return (
                <tr
                  key={o.id}
                  onClick={() => nav(`/orders/${o.id}`)}
                  data-testid={`order-row-${o.order_no}`}
                  className="cursor-pointer border-b transition-colors duration-150 last:border-b-0 hover:bg-slate-50/80"
                >
                  <td className="p-3 font-mono text-xs font-semibold text-slate-600">#{o.order_no}</td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-900">{o.client_name}</div>
                    <div className="text-xs text-slate-500">{o.country}</div>
                  </td>
                  <td className="p-3 text-slate-700">{o.assigned_to || "—"}</td>
                  <td className="p-3">
                    {o.items.length}
                    {missing > 0 && <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">{missing} missing</span>}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {o.shipments.length}
                    {express && <Zap className="ml-1 inline size-3.5 text-red-600" />}
                  </td>
                  <td className="p-3"><PipelinePills order={o} /></td>
                  <td className="p-3"><StageBadge stage={o.stage} /></td>
                  <td className="p-3 whitespace-nowrap text-xs text-slate-500">{fmtDate(o.updated_at)}</td>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}><WhatsAppDialog order={o} compact /></td>
                </tr>
              );
            })}
            {!isLoading && orders.length === 0 && (
              <tr><td colSpan={9} className="p-10 text-center text-muted-foreground" data-testid="orders-empty">No orders match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
