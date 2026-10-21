import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { StoreStatus } from "@/lib/types";

export const DAY_LABELS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

// Server decides open/closed (America/Fortaleza). On fetch failure we report "unknown" (undefined).
export function useStoreStatus() {
  const q = useQuery({
    queryKey: ["store", "status"],
    queryFn: () => apiGet<StoreStatus>("/store/status"),
    refetchInterval: 60000,
  });
  return q.isError ? undefined : q.data;
}
