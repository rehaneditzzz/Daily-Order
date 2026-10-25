import { useSyncExternalStore } from "react";
import { ApiError } from "@/lib/api";
import type { Availability, ItemIn, Order, Stage } from "@/lib/types";

// ---- "Acting as" team member (no login; used for the activity log) ----
const ACTOR_KEY = "orderdesk_actor";
export const getActor = () => localStorage.getItem(ACTOR_KEY) ?? "";
export function setActor(v: string) {
  localStorage.setItem(ACTOR_KEY, v);
  window.dispatchEvent(new Event("actor-change"));
}
function subscribe(cb: () => void) {
  window.addEventListener("actor-change", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("actor-change", cb);
    window.removeEventListener("storage", cb);
  };
}
export const useActor = () => useSyncExternalStore(subscribe, getActor, () => "");

// ---- Stage / availability meta ----
export const STAGES: { key: Stage; label: string; cls: string }[] = [
  { key: "payment_pending", label: "Payment Pending", cls: "bg-red-50 text-red-800 border-red-200" },
  { key: "procurement", label: "Procurement", cls: "bg-amber-50 text-amber-800 border-amber-200" },
  { key: "billing", label: "Billing", cls: "bg-blue-50 text-blue-800 border-blue-200" },
  { key: "packing", label: "Packing", cls: "bg-purple-50 text-purple-800 border-purple-200" },
  { key: "tracking", label: "Tracking", cls: "bg-cyan-50 text-cyan-800 border-cyan-200" },
  { key: "shipped", label: "Shipped", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { key: "delivered", label: "Delivered", cls: "bg-slate-100 text-slate-700 border-slate-300" },
  { key: "on_hold", label: "On Hold", cls: "bg-orange-100 text-orange-900 border-orange-300" },
];
export const stageMeta = (s: Stage) => STAGES.find((x) => x.key === s) ?? STAGES[0];

export const AVAIL: Record<Availability, { label: string; cls: string }> = {
  available: { label: "Available", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  need_market: { label: "Need from market", cls: "bg-amber-50 text-amber-800 border-amber-200" },
  unavailable: { label: "Unavailable", cls: "bg-red-50 text-red-800 border-red-200" },
};

export const COUNTRIES = [
  "USA", "UK", "Canada", "Australia", "Germany", "France", "UAE", "Netherlands", "Ireland",
  "New Zealand", "Singapore", "Japan", "Italy", "Spain", "Sweden", "Other",
];
export const COURIERS = ["India Post EMS", "DHL", "FedEx", "UPS", "Aramex", "USPS", "Royal Mail", "Other"];

export const fmtQty = (q: number) => (Number.isInteger(q) ? String(q) : String(q));
export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export function errMsg(e: unknown): string {
  if (e instanceof ApiError) {
    const b = e.body as { detail?: unknown } | null;
    if (b && typeof b.detail === "string") return b.detail;
    return `Request failed (${e.status})`;
  }
  return "Something went wrong";
}

export const trackUrl = (id: string) => `https://t.17track.net/en#nums=${encodeURIComponent(id)}`;

// Parses lines like "Tretinoin Cream 0.025%\t10 Tubes" into items.
export function parseItems(text: string): ItemIn[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(.*?)[\t ]+(\d+(?:\.\d+)?)\s*([A-Za-z]+)?\s*$/);
      if (m && m[1].trim()) return { name: m[1].trim(), qty: Number(m[2]), unit: m[3] ?? "" };
      return { name: line, qty: 1, unit: "" };
    });
}

export function whatsappText(o: Order): string {
  const L: string[] = [];
  L.push(`*Order #${o.order_no} — ${o.client_name}*`);
  L.push(`Country: ${o.country || "-"} | Status: ${stageMeta(o.stage).label}`);
  if (o.assigned_to) L.push(`Handled by: ${o.assigned_to}`);
  L.push(`Payment: ${o.payment_received ? "Received" : "Pending"}${o.payment_amount ? ` (${o.currency} ${o.payment_amount})` : ""}`);
  if (o.on_hold) L.push(`⚠️ ON HOLD: ${o.hold_reason || "-"}`);
  L.push("");
  L.push("*Items:*");
  for (const i of o.items) {
    const flag = i.availability === "available" ? "" : ` _(${AVAIL[i.availability].label})_`;
    const hts = o.show_hts && i.hts_code ? ` [HTS ${i.hts_code}]` : "";
    L.push(`• ${i.name} — ${fmtQty(i.qty)} ${i.unit}${hts}${flag}`);
  }
  const names = Object.fromEntries(o.items.map((i) => [i.id, i]));
  o.shipments.forEach((s) => {
    L.push("");
    L.push(`*${s.label}* (${s.speed === "express" ? "Express" : "Normal"})`);
    if (s.address) L.push(s.address);
    const inParcel = Object.entries(s.allocations)
      .filter(([id]) => names[id])
      .map(([id, q]) => `${names[id].name} x${fmtQty(q)}`);
    if (inParcel.length) L.push(`Items: ${inParcel.join(", ")}`);
    if (s.tracking_ids.length) L.push(`Tracking: ${s.tracking_ids.join(", ")}${s.courier ? ` (${s.courier})` : ""}`);
    L.push(`Bill: ${s.bill_ready ? "✅" : "❌"}  Packed: ${s.packed ? "✅" : "❌"}  Tracking: ${s.tracking_added ? "✅" : "❌"}`);
  });
  return L.join("\n");
}
