import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, ImagePlus, MapPin, Plus, Save, Trash2, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiDelete, apiPatch, apiUpload } from "@/lib/api";
import { COURIERS, getActor, trackUrl } from "@/lib/helpers";
import { useOrderAction } from "@/lib/queries";
import { cn } from "@/lib/utils";
import type { Order, Shipment, Speed } from "@/lib/types";

// Shrinks phone photos (often 3-8MB) to ~200-400KB so the free database tier lasts for years.
async function compressImage(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.8));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

const CHECKS: { key: "bill_ready" | "packed" | "tracking_added" | "delivered"; label: string }[] = [
  { key: "bill_ready", label: "Bill ready" },
  { key: "packed", label: "Packed" },
  { key: "tracking_added", label: "Tracking added" },
  { key: "delivered", label: "Delivered" },
];

export default function ShipmentCard({ order, s, idx }: { order: Order; s: Shipment; idx: number }) {
  const act = useOrderAction(order.id);
  const base = `/orders/${order.id}/shipments/${s.id}`;
  const patch = (body: Record<string, unknown>, ok?: string) =>
    act.mutate(() => apiPatch<Order>(base, { ...body, actor: getActor() }), {
      onSuccess: () => ok && toast.success(ok),
    });

  const [d, setD] = useState({ recipient: s.recipient, address: s.address, country: s.country, courier: s.courier, tracking_notes: s.tracking_notes });
  const dirty = d.recipient !== s.recipient || d.address !== s.address || d.country !== s.country || d.courier !== s.courier || d.tracking_notes !== s.tracking_notes;
  const [track, setTrack] = useState("");
  const [alloc, setAlloc] = useState<Record<string, string>>(() =>
    Object.fromEntries(order.items.map((i) => [i.id, String(s.allocations[i.id] ?? 0)])),
  );
  const allocDirty = order.items.some((i) => Number(alloc[i.id] ?? 0) !== (s.allocations[i.id] ?? 0));
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    for (const f of Array.from(files)) {
      const fd = new FormData();
      const small = await compressImage(f);
      fd.append("file", small, small === f ? f.name : f.name.replace(/\.\w+$/, "") + ".jpg");
      fd.append("actor", getActor());
      await act.mutateAsync(() => apiUpload<Order>(`${base}/photos`, fd)).catch(() => undefined);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    toast.success("Photo uploaded");
  };

  const addTracking = () => {
    const t = track.trim();
    if (!t) return;
    patch({ tracking_ids: [...s.tracking_ids, t] }, "Tracking ID added");
    setTrack("");
  };

  return (
    <div className="animate-rise rounded-xl border bg-white shadow-sm transition-shadow duration-150 hover:shadow-md" data-testid={`shipment-card-${idx}`}>
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Truck className="size-4 text-sky-600" />
          <span className="font-heading font-semibold">{s.label}</span>
          <Select value={s.speed} onValueChange={(v: string) => patch({ speed: v as Speed })}>
            <SelectTrigger
              size="sm"
              data-testid={`shipment-speed-${idx}`}
              className={cn("h-6 border-0 px-2 font-mono text-[11px] font-bold uppercase", s.speed === "express" ? "bg-red-100 text-red-800" : "bg-indigo-100 text-indigo-800")}
            >
              <SelectValue>{(v) => (v === "express" ? "Express" : "Normal")}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="express">Express</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          size="icon-sm"
          variant="ghost"
          className="text-red-600"
          data-testid={`shipment-delete-${idx}`}
          onClick={() => {
            if (confirm(`Delete ${s.label}?`)) act.mutate(() => apiDelete<Order>(`${base}?actor=${encodeURIComponent(getActor())}`));
          }}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-2 gap-2 border-b bg-slate-50/70 px-4 py-3 sm:grid-cols-4">
        {CHECKS.map((c) => (
          <label
            key={c.key}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors duration-150 active:scale-95",
              s[c.key] ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600",
            )}
          >
            <Checkbox
              data-testid={`shipment-${c.key}-${idx}`}
              checked={s[c.key]}
              onCheckedChange={(v) => patch({ [c.key]: v === true })}
            />
            {c.label}
          </label>
        ))}
      </div>

      <div className="space-y-4 p-4">
        {/* Address */}
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Recipient</Label>
            <Input value={d.recipient} onChange={(e) => setD({ ...d, recipient: e.target.value })} data-testid={`shipment-recipient-${idx}`} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Country</Label>
            <Input value={d.country} onChange={(e) => setD({ ...d, country: e.target.value })} data-testid={`shipment-country-${idx}`} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="size-3" /> Address</Label>
            <Textarea rows={3} value={d.address} onChange={(e) => setD({ ...d, address: e.target.value })} data-testid={`shipment-address-${idx}`} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Courier</Label>
            <Select value={d.courier} onValueChange={(v: string) => setD({ ...d, courier: v })}>
              <SelectTrigger className="w-full" data-testid={`shipment-courier-${idx}`}>
                <SelectValue placeholder="Select courier">{(v) => (v as string) || "Select courier"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {COURIERS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Tracking notes</Label>
            <Input value={d.tracking_notes} onChange={(e) => setD({ ...d, tracking_notes: e.target.value })} placeholder="e.g. booked 12 Mar" data-testid={`shipment-tracking-notes-${idx}`} />
          </div>
          {dirty && (
            <Button size="sm" className="sm:col-span-2" onClick={() => patch(d, "Parcel details saved")} data-testid={`shipment-save-${idx}`}>
              <Save className="size-4" /> Save parcel details
            </Button>
          )}
        </div>

        {/* Tracking IDs */}
        <div className="space-y-2">
          <Label className="text-xs text-slate-500">Tracking IDs</Label>
          <div className="flex flex-wrap gap-1.5">
            {s.tracking_ids.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-md border border-cyan-200 bg-cyan-50 px-2 py-1 font-mono text-xs font-medium text-cyan-900" data-testid={`shipment-tracking-chip-${idx}`}>
                {t}
                <a href={trackUrl(t)} target="_blank" rel="noreferrer" title="Track"><ExternalLink className="size-3" /></a>
                <button type="button" onClick={() => patch({ tracking_ids: s.tracking_ids.filter((x) => x !== t) })} title="Remove">
                  <X className="size-3" />
                </button>
              </span>
            ))}
            {s.tracking_ids.length === 0 && <span className="text-xs text-slate-400">No tracking yet</span>}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add tracking ID"
              className="font-mono"
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTracking()}
              data-testid={`shipment-tracking-input-${idx}`}
            />
            <Button variant="outline" onClick={addTracking} data-testid={`shipment-tracking-add-${idx}`}><Plus className="size-4" /></Button>
          </div>
        </div>

        {/* Items split */}
        {order.items.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-slate-500">Items in this parcel</Label>
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border bg-slate-50/60 p-2">
              {order.items.map((i, k) => (
                <div key={i.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className={cn("truncate", Number(alloc[i.id] ?? 0) === 0 && "text-slate-400")}>{i.name}</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      className="h-7 w-16 px-2 text-right font-mono text-xs"
                      value={alloc[i.id] ?? "0"}
                      onChange={(e) => setAlloc({ ...alloc, [i.id]: e.target.value })}
                      data-testid={`shipment-alloc-${idx}-${k}`}
                    />
                    <span className="w-10 text-slate-500">{i.unit}</span>
                  </div>
                </div>
              ))}
            </div>
            {allocDirty && (
              <Button
                size="sm"
                variant="outline"
                data-testid={`shipment-alloc-save-${idx}`}
                onClick={() =>
                  patch({ allocations: Object.fromEntries(Object.entries(alloc).map(([k, v]) => [k, Number(v) || 0])) }, "Parcel items saved")
                }
              >
                <Save className="size-4" /> Save item split
              </Button>
            )}
          </div>
        )}

        {/* Photos */}
        <div className="space-y-2">
          <Label className="text-xs text-slate-500">Parcel photos</Label>
          <div className="flex flex-wrap gap-2">
            {s.photos.map((p) => (
              <div key={p} className="group relative">
                <button type="button" onClick={() => setLightbox(p)} data-testid={`shipment-photo-${idx}`}>
                  <img src={p} alt="parcel" className="size-20 rounded-lg border object-cover" />
                </button>
                <button
                  type="button"
                  className="absolute -right-1.5 -top-1.5 hidden rounded-full bg-red-600 p-0.5 text-white group-hover:block"
                  onClick={() => {
                    if (confirm("Remove photo?"))
                      act.mutate(() => apiDelete<Order>(`${base}/photos?url=${encodeURIComponent(p)}&actor=${encodeURIComponent(getActor())}`));
                  }}
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              data-testid={`shipment-photo-upload-${idx}`}
              className="grid size-20 place-items-center rounded-lg border-2 border-dashed border-slate-300 text-slate-500 transition-colors duration-150 hover:border-sky-400 hover:text-sky-600"
            >
              <div className="flex flex-col items-center text-[10px] font-semibold">
                <ImagePlus className="size-5" />
                {uploading ? "Uploading" : "Add photo"}
              </div>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              data-testid={`shipment-photo-input-${idx}`}
              onChange={(e) => upload(e.target.files)}
            />
          </div>
        </div>
      </div>

      <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogTitle>{s.label} photo</DialogTitle>
          {lightbox && <img src={lightbox} alt="parcel" className="max-h-[75vh] w-full rounded-lg object-contain" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
