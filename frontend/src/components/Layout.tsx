import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, Users, FileSpreadsheet, UserCircle2 } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { setActor, useActor } from "@/lib/helpers";
import { useMembers } from "@/lib/queries";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/orders", label: "Orders", icon: ShoppingCart, end: false },
  { to: "/procurement", label: "Procurement", icon: Package, end: false },
  { to: "/team", label: "Team", icon: Users, end: false },
];

function ActorPicker({ dark }: { dark?: boolean }) {
  const actor = useActor();
  const { data: members = [] } = useMembers();
  return (
    <Select value={actor} onValueChange={(v: string) => setActor(v)}>
      <SelectTrigger
        data-testid="actor-select"
        className={cn("w-full", dark && "border-slate-700 bg-slate-800 text-slate-100")}
      >
        <UserCircle2 className="size-4 opacity-70" />
        <SelectValue placeholder="Who are you?">{(v) => (v as string) || "Who are you?"}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {members.map((m) => (
          <SelectItem key={m.id} value={m.name}>
            {m.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function Layout() {
  return (
    <div className="min-h-screen lg:pl-60">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="px-5 pb-6 pt-6">
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-lg bg-sky-500 text-white">
              <Package className="size-5" />
            </div>
            <div>
              <div className="font-heading text-lg font-bold leading-none">Order Desk</div>
              <div className="mt-1 text-xs text-slate-400">Pharma export ops</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              data-testid={`nav-${n.label.toLowerCase()}`}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                  isActive ? "bg-slate-800 text-sky-400" : "text-slate-300 hover:bg-slate-800/60 hover:text-white",
                )
              }
            >
              <n.icon className="size-4" />
              {n.label}
            </NavLink>
          ))}
          <a
            href="/api/export/excel"
            data-testid="nav-export-excel"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-emerald-300 transition-colors duration-150 hover:bg-slate-800/60"
          >
            <FileSpreadsheet className="size-4" />
            Excel backup
          </a>
        </nav>
        <div className="space-y-2 border-t border-slate-800 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Acting as</div>
          <ActorPicker dark />
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="font-heading text-lg font-bold">Order Desk</div>
          <div className="w-44">
            <ActorPicker />
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium",
                  isActive ? "bg-sky-50 text-sky-700" : "text-slate-600",
                )
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
      <Toaster richColors />
    </div>
  );
}
