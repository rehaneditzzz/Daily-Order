import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, History, PauseCircle, PlayCircle, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import ItemsTable from "@/components/ItemsTable";
import ShipmentCard from "@/components/ShipmentCard";
import WhatsAppDialog from "@/components/WhatsAppDialog";
import { StageBadge } from "@/components/StageBadge";
import { apiDelete, apiPatch, apiPost } from "@/lib/api";
import { COUNTRIES, errMsg, fmtDate, getActor } from "@/lib/helpers";
import { useMembers, useOrder, useOrderAction } from "@/lib/queries";
import type { Order } from "@/lib/types";

function ClientCard({ order }: { order: Order }) {
  const act = useOrderAction(order.id);
  const { data: members = [] } = useMembers();
  const init = {
    client_name: order.client_name, client_phone: order.client_phone, client_email: order.client_email,
    country: order.country, currency: order.currency, payment_amount: String(order.payment_amount),
    payment_method: order.payment_method, notes: order.notes,
  };
  const [d, setD] = useState(init);
  const dirty = (Object.keys(init) as (keyof typeof init)[]).some((k) => init[k] !== d[k]);
  const patch = (body: Record<string, unknown>, ok?: string) =>
    act.mutate(() => apiPatch<Order>(`/orders/${order.id}`, { ...body, actor: getActor() }), { onSuccess: () => ok && toast.success(ok) });

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-3"><CardTitle className="font-heading text-base">Client & payment</CardTitle></CardHeader>
      <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
        <div className="space-y-1"><Label className="text-xs text-slate-500">Client name</Label>
          <Input value={d.client_name} onChange={(e) => setD({ ...d, client_name: e.target.value })} data-testid="client-name-input" /></div>
        <div className="space-y-1"><Label className="text-xs text-slate-500">Phone / WhatsApp</Label>
          <Input value={d.client_phone} onChange={(e) => setD({ ...d, client_phone: e.target.value })} data-testid="client-phone-input" /></div>
        <div className="space-y-1"><Label className="text-xs text-slate-500">Email</Label>
          <Input value={d.client_email} onChange={(e) => setD({ ...d, client_email: e.target.value })} data-testid="client-email-input" /></div>
        <div className="space-y-1"><Label className="text-xs text-slate-500">Country</Label>
          <Select value={d.country} onValueChange={(v: string) => setD({ ...d, country: v })}>
            <SelectTrigger className="w-full" data-testid="client-country-select"><SelectValue placeholder="Country" /></SelectTrigger>
            <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select></div>
        <div className="space-y-1"><Label className="text-xs text-slate-500">Amount</Label>
          <div className="flex gap-2">
            <Input className="w-20" value={d.currency} onChange={(e) => setD({ ...d, currency: e.target.value })} data-testid="client-currency-input" />
            <Input type="number" value={d.payment_amount} onChange={(e) => setD({ ...d, payment_amount: e.target.value })} data-testid="client-amount-input" />
          </div></div>
        <div className="space-y-1"><Label className="text-xs text-slate-500">Payment method</Label>
          <Input value={d.payment_method} placeholder="PayPal / Wise / Crypto..." onChange={(e) => setD({ ...d, payment_method: e.target.value })} data-testid="client-payment-method-input" /></div>
        <div className="space-y-1 sm:col-span-2"><Label className="text-xs text-slate-500">Notes</Label>
          <Textarea rows={2} value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} data-testid="client-notes-input" /></div>
        <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${order.payment_received ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
          <Checkbox data-testid="payment-received-checkbox" checked={order.payment_received} onCheckedChange={(c) => patch({ payment_received: c === true })} />
          {order.payment_received ? "Payment received" : "Payment pending"}
        </label>
        <div className="space-y-1">
          <Select value={order.assigned_to} onValueChange={(v: string) => patch({ assigned_to: v }, `Assigned to ${v}`)}>
            <SelectTrigger className="w-full" data-testid="assigned-select"><SelectValue placeholder="Assign to">{(v) => (v ? `Assigned: ${v as string}` : "Assign to")}</SelectValue></SelectTrigger>
            <SelectContent>{members.map((m) => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {dirty && (
          <Button className="sm:col-span-2" data-testid="client-save-btn" onClick={() => patch({ ...d, payment_amount: Number(d.payment_amount) || 0 }, "Client details saved")}>
            <Save className="size-4" /> Save client details
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function OrderDetail() {
  const { id = "" } = useParams();
  const { data, isError, isLoading } = useOrder(id);
  const act = useOrderAction(id);
  const qc = useQueryClient();
  const nav = useNavigate();
  const order = isError ? undefined : data;

  if (!order)
    return (
      <div className="space-y-4">
        <Link to="/orders" className="inline-flex items-center gap-1 text-sm text-sky-700"><ArrowLeft className="size-4" /> Orders</Link>
        <div className="rounded-xl border bg-white p-10 text-center text-muted-foreground" data-testid="order-not-found">
          {isLoading ? "Loading order..." : "Order not available."}
        </div>
      </div>
    );

  const toggleHold = () => {
    if (order.on_hold) return act.mutate(() => apiPatch<Order>(`/orders/${id}`, { on_hold: false, actor: getActor() }));
    const reason = prompt("Why is this order on hold? (e.g. waiting for Lemborexant)") ?? "";
    act.mutate(() => apiPatch<Order>(`/orders/${id}`, { on_hold: true, hold_reason: reason, actor: getActor() }));
  };
  const remove = async () => {
    if (!confirm(`Delete order #${order.order_no} permanently?`)) return;
    try {
      await apiDelete(`/orders/${id}`);
      qc.invalidateQueries();
      toast.success("Order deleted");
      nav("/orders");
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/orders" className="inline-flex items-center gap-1 text-sm text-sky-700 hover:underline"><ArrowLeft className="size-4" /> Orders</Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="font-mono text-sm text-slate-500">#{order.order_no}</span>
            <h1 className="text-3xl font-bold" data-testid="order-client-name">{order.client_name}</h1>
            <StageBadge stage={order.stage} className="text-sm" />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {order.country} · {order.items.length} items · {order.shipments.length} parcel(s) · created {fmtDate(order.created_at)}
          </p>
          {order.on_hold && (
            <div className="mt-2 rounded-lg border border-orange-300 bg-orange-50 px-3 py-2 text-sm text-orange-900" data-testid="hold-banner">
              On hold: {order.hold_reason || "no reason given"}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <WhatsAppDialog order={order} />
          <Button variant="outline" onClick={toggleHold} data-testid="hold-toggle-btn">
            {order.on_hold ? <PlayCircle className="size-4" /> : <PauseCircle className="size-4" />}
            {order.on_hold ? "Release hold" : "Put on hold"}
          </Button>
          <Button variant="outline" className="text-red-600" onClick={remove} data-testid="delete-order-btn"><Trash2 className="size-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <ItemsTable order={order} />
          <ClientCard key={order.updated_at} order={order} />
          <Card className="gap-0 py-0">
            <CardHeader className="border-b py-3">
              <CardTitle className="flex items-center gap-2 font-heading text-base"><History className="size-4" /> Activity log</CardTitle>
            </CardHeader>
            <CardContent className="max-h-80 overflow-y-auto p-0" data-testid="activity-log">
              {order.activity.map((a, i) => (
                <div key={i} className="flex gap-3 border-b px-4 py-2 text-sm last:border-b-0">
                  <span className="w-28 shrink-0 font-mono text-[11px] text-slate-400">{fmtDate(a.at)}</span>
                  <span><span className="font-semibold text-slate-800">{a.actor}</span> <span className="text-slate-600">{a.text}</span></span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Parcels / shipments</h2>
            <Button
              size="sm"
              data-testid="add-shipment-btn"
              onClick={() =>
                act.mutate(() => apiPost<Order>(`/orders/${id}/shipments`, { address: "", actor: getActor() }), {
                  onSuccess: () => toast.success("Parcel added"),
                })
              }
            >
              <Plus className="size-4" /> Add parcel
            </Button>
          </div>
          {order.shipments.map((s, i) => (
            <ShipmentCard key={s.id} order={order} s={s} idx={i} />
          ))}
          {order.shipments.length === 0 && (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No parcels yet. Add one per address.</div>
          )}
        </div>
      </div>
    </div>
  );
}
