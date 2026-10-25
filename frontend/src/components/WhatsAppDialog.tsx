import { useState } from "react";
import { toast } from "sonner";
import { Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { whatsappText } from "@/lib/helpers";
import type { Order } from "@/lib/types";

export default function WhatsAppDialog({ order, compact }: { order: Order; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const phone = order.client_phone.replace(/[^\d]/g, "");
  const onOpen = (o: boolean) => {
    if (o) setText(whatsappText(order));
    setOpen(o);
  };
  const copy = async () => {
    await navigator.clipboard.writeText(text).catch(() => undefined);
    toast.success("Copied to clipboard");
  };
  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size={compact ? "icon-sm" : "default"}
            data-testid="whatsapp-share-btn"
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            onClick={(e) => e.stopPropagation()}
          />
        }
      >
        <Share2 className="size-4" />
        {!compact && "WhatsApp"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Share on WhatsApp</DialogTitle>
        </DialogHeader>
        <Textarea data-testid="whatsapp-text" rows={14} className="font-mono text-xs" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={copy} data-testid="whatsapp-copy-btn">
            <Copy className="size-4" /> Copy
          </Button>
          <a
            data-testid="whatsapp-open-team-btn"
            href={`https://wa.me/?text=${encodeURIComponent(text)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Share2 className="size-4" /> Send to group / contact
          </a>
          {phone && (
            <a
              data-testid="whatsapp-open-client-btn"
              href={`https://wa.me/${phone}?text=${encodeURIComponent(text)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-600 px-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
            >
              Send to client
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
