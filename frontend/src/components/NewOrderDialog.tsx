import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiPost } from "@/lib/api";
import { COUNTRIES, errMsg, getActor, parseItems } from "@/lib/helpers";
import { useMembers } from "@/lib/queries";
import type { Order, OrderCreate, Speed } from "@/lib/types";

const SAMPLE = `Tretinoin Cream 0.025%\t10 Tubes\nTadalafil (Cialis) 10mg\t1 Box`;

export default function NewOrderDialog() {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: members = [] } = useMembers();
  const [f, setF] = useState({
    client_name: "", client_phone: "", client_email: "", country: "USA", currency: "USD",
    assigned_to: "", notes: "", payment_received: false, payment_amount: "", payment_method: "",
    address: "", shipment_count: "1", speed: "normal" as Speed, itemsText: "",
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const parsed = parseItems(f.itemsText);

  const create = useMutation({
    mutationFn: () => {
      const body: OrderCreate = {
        client_name: f.client_name.trim(), client_phone: f.client_phone, client_email: f.client_email,
        country: f.country, currency: f.currency, assigned_to: f.assigned_to || getActor(), notes: f.notes,
        payment_received: f.payment_received, payment_amount: Number(f.payment_amount) || 0,
        payment_method: f.payment_method, address: f.address,
        shipment_count: Math.max(1, Number(f.shipment_count) || 1), speed: f.speed,
        items: parsed, actor: getActor(),
      };
      return apiPost<Order>("/orders", body);
    },
    onSuccess: (o) => {
      qc.invalidateQueries();
      toast.success(`Order #${o.order_no} created`);
      setOpen(false);
      nav(`/orders/${o.id}`);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button data-testid="create-order-btn" />}>
        <Plus className="size-4" /> New order
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">New client order</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Client name *</Label>
            <Input data-testid="new-order-client-name" value={f.client_name} onChange={(e) => set("client_name", e.target.value)} placeholder="Jason Plagens" />
          </div>
          <div className="space-y-1.5">
            <Label>Phone / WhatsApp</Label>
            <Input data-testid="new-order-phone" value={f.client_phone} onChange={(e) => set("client_phone", e.target.value)} placeholder="+1 555 123 4567" />
          </div>
          <div className="space-y-1.5">
            <Label>Country</Label>
            <Select value={f.country} onValueChange={(v: string) => set("country", v)}>
              <SelectTrigger data-testid="new-order-country" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Assigned to</Label>
            <Select value={f.assigned_to} onValueChange={(v: string) => set("assigned_to", v)}>
              <SelectTrigger data-testid="new-order-assigned" className="w-full">
                <SelectValue placeholder="Me (acting user)">{(v) => (v as string) || "Me (acting user)"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Shipping address</Label>
            <Textarea data-testid="new-order-address" rows={3} value={f.address} onChange={(e) => set("address", e.target.value)} placeholder={"11690 Akins rd\nNorth Royalton, OH 44133"} />
          </div>
          <div className="space-y-1.5">
            <Label>Number of parcels (shipments)</Label>
            <Input data-testid="new-order-shipment-count" type="number" min={1} max={10} value={f.shipment_count} onChange={(e) => set("shipment_count", e.target.value)} />
            <p className="text-xs text-muted-foreground">Quantities are split evenly — edit per parcel later.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Shipping speed</Label>
            <Select value={f.speed} onValueChange={(v: string) => set("speed", v as Speed)}>
              <SelectTrigger data-testid="new-order-speed" className="w-full">
                <SelectValue>{(v) => (v === "express" ? "Express" : "Normal")}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="express">Express</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Payment amount</Label>
            <div className="flex gap-2">
              <Input className="w-24" value={f.currency} onChange={(e) => set("currency", e.target.value)} data-testid="new-order-currency" />
              <Input data-testid="new-order-amount" type="number" value={f.payment_amount} onChange={(e) => set("payment_amount", e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="flex items-end gap-2 pb-2">
            <Checkbox data-testid="new-order-paid" checked={f.payment_received} onCheckedChange={(c) => set("payment_received", c === true)} />
            <Label>Payment received</Label>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Items — paste one per line (name, quantity, unit)</Label>
            <Textarea data-testid="new-order-items" rows={6} className="font-mono text-xs" value={f.itemsText} onChange={(e) => set("itemsText", e.target.value)} placeholder={SAMPLE} />
            {parsed.length > 0 && (
              <div data-testid="new-order-items-preview" className="rounded-lg border bg-slate-50 p-3 text-sm">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">{parsed.length} item(s) detected</div>
                <ul className="space-y-0.5">
                  {parsed.map((p, i) => (
                    <li key={i} className="flex justify-between gap-4">
                      <span>{p.name}</span>
                      <span className="font-mono text-slate-600">{p.qty} {p.unit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Notes</Label>
            <Input data-testid="new-order-notes" value={f.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button
            data-testid="new-order-submit"
            disabled={!f.client_name.trim() || create.isPending}
            onClick={() => create.mutate()}
          >
            {create.isPending ? "Creating..." : "Create order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
