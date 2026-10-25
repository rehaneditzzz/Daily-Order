import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiDelete, apiPost } from "@/lib/api";
import { errMsg } from "@/lib/helpers";
import { useMembers, useOrders } from "@/lib/queries";
import type { Member } from "@/lib/types";

export default function Team() {
  const { data: members = [] } = useMembers();
  const { data: orders = [] } = useOrders();
  const qc = useQueryClient();
  const [n, setN] = useState({ name: "", role: "" });

  const add = useMutation({
    mutationFn: () => apiPost<Member>("/members", { name: n.name.trim(), role: n.role || "Staff" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      setN({ name: "", role: "" });
      toast.success("Member added");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  const del = useMutation({
    mutationFn: (id: string) => apiDelete(`/members/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
    onError: (e) => toast.error(errMsg(e)),
  });

  const stats = (name: string) => {
    const mine = orders.filter((o) => o.assigned_to === name && o.stage !== "delivered");
    const parcels = mine.flatMap((o) => o.shipments.filter((s) => !s.delivered));
    return {
      open: mine.length,
      payment: mine.filter((o) => !o.payment_received).length,
      bill: parcels.filter((s) => !s.bill_ready).length,
      pack: parcels.filter((s) => !s.packed).length,
      track: parcels.filter((s) => !s.tracking_added).length,
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team</h1>
        <p className="text-slate-600">Workload per member. Click a member to see their queue.</p>
      </div>
      <div className="flex flex-wrap gap-2 rounded-xl border bg-white p-3">
        <Input className="max-w-xs" placeholder="Name" value={n.name} onChange={(e) => setN({ ...n, name: e.target.value })} data-testid="member-name-input" />
        <Input className="max-w-xs" placeholder="Role (Sales, Packing...)" value={n.role} onChange={(e) => setN({ ...n, role: e.target.value })} data-testid="member-role-input" />
        <Button disabled={!n.name.trim() || add.isPending} onClick={() => add.mutate()} data-testid="member-add-btn">
          <UserPlus className="size-4" /> Add member
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {members.map((m, i) => {
          const s = stats(m.name);
          return (
            <div key={m.id} className="rounded-xl border bg-white p-4 shadow-sm transition-shadow duration-150 hover:shadow-md" data-testid={`member-card-${i}`}>
              <div className="flex items-start justify-between">
                <Link to={`/orders?assigned=${encodeURIComponent(m.name)}`} className="group">
                  <div className="font-heading text-lg font-semibold group-hover:text-sky-700">{m.name}</div>
                  <div className="text-xs text-slate-500">{m.role}</div>
                </Link>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="text-slate-400 hover:text-red-600"
                  data-testid={`member-delete-${i}`}
                  onClick={() => confirm(`Remove ${m.name}?`) && del.mutate(m.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="mt-3 grid grid-cols-5 gap-1 text-center">
                {([["Open", s.open], ["Pay", s.payment], ["Bill", s.bill], ["Pack", s.pack], ["Track", s.track]] as const).map(([l, v]) => (
                  <div key={l} className="rounded-md bg-slate-50 py-1.5">
                    <div className="font-heading text-lg font-bold">{v}</div>
                    <div className="text-[10px] font-semibold uppercase text-slate-500">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
