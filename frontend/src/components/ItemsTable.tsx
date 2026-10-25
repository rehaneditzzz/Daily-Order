import { useState } from "react";
import { Check, Eye, EyeOff, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiDelete, apiPatch, apiPost } from "@/lib/api";
import { AVAIL, fmtQty, getActor } from "@/lib/helpers";
import { useOrderAction } from "@/lib/queries";
import { cn } from "@/lib/utils";
import type { Availability, Item, Order } from "@/lib/types";

type Act = ReturnType<typeof useOrderAction>;

function AvailSelect({ value, onChange, testid }: { value: Availability; onChange: (v: Availability) => void; testid: string }) {
  return (
    <Select value={value} onValueChange={(v: string) => onChange(v as Availability)}>
      <SelectTrigger size="sm" data-testid={testid} className={cn("h-7 border text-xs font-semibold", AVAIL[value].cls)}>
        <SelectValue>{(v) => AVAIL[v as Availability].label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(AVAIL) as Availability[]).map((k) => (
          <SelectItem key={k} value={k}>{AVAIL[k].label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ItemRow({ order, item, act, allocated, idx }: { order: Order; item: Item; act: Act; allocated: number; idx: number }) {
  const [edit, setEdit] = useState(false);
  const [d, setD] = useState({ name: item.name, qty: String(item.qty), unit: item.unit, hts_code: item.hts_code, price: String(item.price), note: item.note });
  const base = `/orders/${order.id}/items/${item.id}`;
  const save = () =>
    act.mutate(() => apiPatch<Order>(base, { ...d, qty: Number(d.qty) || 0, price: Number(d.price) || 0, actor: getActor() }), {
      onSuccess: () => setEdit(false),
    });
  const mismatch = order.shipments.length > 0 && allocated !== item.qty;

  if (edit)
    return (
      <tr className="border-b bg-sky-50/40">
        <td className="p-2" colSpan={order.show_hts ? 6 : 5}>
          <div className="grid gap-2 sm:grid-cols-6">
            <Input className="sm:col-span-2" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} data-testid={`item-edit-name-${idx}`} />
            <Input type="number" value={d.qty} onChange={(e) => setD({ ...d, qty: e.target.value })} data-testid={`item-edit-qty-${idx}`} />
            <Input value={d.unit} placeholder="Unit" onChange={(e) => setD({ ...d, unit: e.target.value })} data-testid={`item-edit-unit-${idx}`} />
            <Input value={d.hts_code} placeholder="HTS code" onChange={(e) => setD({ ...d, hts_code: e.target.value })} data-testid={`item-edit-hts-${idx}`} />
            <Input value={d.note} placeholder="Note" onChange={(e) => setD({ ...d, note: e.target.value })} data-testid={`item-edit-note-${idx}`} />
          </div>
        </td>
        <td className="p-2 text-right whitespace-nowrap">
          <Button size="icon-sm" onClick={save} data-testid={`item-save-${idx}`}><Check className="size-4" /></Button>
          <Button size="icon-sm" variant="ghost" onClick={() => setEdit(false)}><X className="size-4" /></Button>
        </td>
      </tr>
    );

  return (
    <tr className="border-b transition-colors duration-150 hover:bg-slate-50/80" data-testid={`item-row-${idx}`}>
      <td className="p-2 pl-4">
        <div className="font-medium text-slate-900">{item.name}</div>
        {item.note && <div className="text-xs text-amber-700">{item.note}</div>}
      </td>
      {order.show_hts && (
        <td className="p-2 font-mono text-xs text-slate-600" data-testid={`item-hts-${idx}`}>{item.hts_code || "—"}</td>
      )}
      <td className="p-2 font-mono text-sm whitespace-nowrap">{fmtQty(item.qty)} <span className="text-slate-500">{item.unit}</span></td>
      <td className="p-2">
        <AvailSelect
          testid={`item-availability-${idx}`}
          value={item.availability}
          onChange={(v) => act.mutate(() => apiPatch<Order>(base, { availability: v, actor: getActor() }))}
        />
      </td>
      <td className="p-2 text-xs whitespace-nowrap">
        {order.shipments.length > 0 && (
          <span className={cn("font-mono", mismatch ? "font-semibold text-red-600" : "text-slate-500")} data-testid={`item-allocated-${idx}`}>
            {fmtQty(allocated)}/{fmtQty(item.qty)} split
          </span>
        )}
      </td>
      <td className="p-2 text-right whitespace-nowrap" colSpan={1}>
        <Button size="icon-sm" variant="ghost" onClick={() => setEdit(true)} data-testid={`item-edit-btn-${idx}`}><Pencil className="size-3.5" /></Button>
        <Button
          size="icon-sm"
          variant="ghost"
          className="text-red-600"
          data-testid={`item-delete-btn-${idx}`}
          onClick={() => {
            if (confirm(`Remove ${item.name}?`)) act.mutate(() => apiDelete<Order>(`${base}?actor=${encodeURIComponent(getActor())}`));
          }}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </td>
    </tr>
  );
}

export default function ItemsTable({ order }: { order: Order }) {
  const act = useOrderAction(order.id);
  const [n, setN] = useState({ name: "", qty: "1", unit: "", hts_code: "" });
  const allocated = (id: string) => order.shipments.reduce((s, sh) => s + (sh.allocations[id] ?? 0), 0);
  const add = () =>
    act.mutate(
      () => apiPost<Order>(`/orders/${order.id}/items`, { ...n, qty: Number(n.qty) || 1, actor: getActor() }),
      { onSuccess: () => setN({ name: "", qty: "1", unit: "", hts_code: "" }) },
    );
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-row items-center justify-between border-b py-3">
        <CardTitle className="font-heading text-base">Medicines ({order.items.length})</CardTitle>
        <Button
          variant="outline"
          size="sm"
          data-testid="hts-toggle-btn"
          onClick={() => act.mutate(() => apiPatch<Order>(`/orders/${order.id}`, { show_hts: !order.show_hts, actor: getActor() }))}
        >
          {order.show_hts ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          {order.show_hts ? "Hide HTS code" : "Show HTS code"}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="items-table">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="p-2 pl-4">Product</th>
                {order.show_hts && <th className="p-2">HTS code</th>}
                <th className="p-2">Qty</th>
                <th className="p-2">Status</th>
                <th className="p-2">Parcels</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {order.items.map((it, i) => (
                <ItemRow key={it.id} idx={i} order={order} item={it} act={act} allocated={allocated(it.id)} />
              ))}
              {order.items.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">No items yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="grid gap-2 border-t bg-slate-50/60 p-3 sm:grid-cols-12">
          <Input className="sm:col-span-5" placeholder="Add item (client added later?)" value={n.name} onChange={(e) => setN({ ...n, name: e.target.value })} data-testid="add-item-name" />
          <Input className="sm:col-span-2" type="number" value={n.qty} onChange={(e) => setN({ ...n, qty: e.target.value })} data-testid="add-item-qty" />
          <Input className="sm:col-span-2" placeholder="Unit" value={n.unit} onChange={(e) => setN({ ...n, unit: e.target.value })} data-testid="add-item-unit" />
          {order.show_hts ? (
            <Input className="sm:col-span-2" placeholder="HTS" value={n.hts_code} onChange={(e) => setN({ ...n, hts_code: e.target.value })} data-testid="add-item-hts" />
          ) : (
            <div className="hidden sm:col-span-2 sm:block" />
          )}
          <Button className="sm:col-span-1" disabled={!n.name.trim()} onClick={add} data-testid="add-item-btn"><Plus className="size-4" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}
