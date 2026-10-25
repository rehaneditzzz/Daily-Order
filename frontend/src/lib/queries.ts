import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet } from "@/lib/api";
import { errMsg } from "@/lib/helpers";
import type { DashboardStats, Member, Order, ProcurementGroup } from "@/lib/types";

export interface OrderFilters {
  q?: string;
  stage?: string;
  assigned?: string;
  country?: string;
  speed?: string;
}

export function useOrders(f: OrderFilters = {}) {
  const qs = new URLSearchParams(
    Object.entries(f).filter(([, v]) => v) as [string, string][],
  ).toString();
  return useQuery({
    queryKey: ["orders", qs],
    queryFn: () => apiGet<Order[]>(`/orders${qs ? `?${qs}` : ""}`),
  });
}

export const useOrder = (id: string) =>
  useQuery({ queryKey: ["order", id], queryFn: () => apiGet<Order>(`/orders/${id}`) });

export const useMembers = () =>
  useQuery({ queryKey: ["members"], queryFn: () => apiGet<Member[]>("/members") });

export const useDashboard = () =>
  useQuery({ queryKey: ["dashboard"], queryFn: () => apiGet<DashboardStats>("/dashboard") });

export const useProcurement = () =>
  useQuery({ queryKey: ["procurement"], queryFn: () => apiGet<ProcurementGroup[]>("/procurement") });

// One mutation hook for every order-scoped write: pass a thunk returning the updated Order.
export function useOrderAction(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fn: () => Promise<Order>) => fn(),
    onSuccess: (o) => {
      qc.setQueryData(["order", orderId], o);
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== "order" });
    },
    onError: (e) => toast.error(errMsg(e)),
  });
}
