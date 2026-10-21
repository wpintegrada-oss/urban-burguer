import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { apiPut } from "@/lib/api";
import { DAY_LABELS, useStoreStatus } from "@/lib/store";
import type { DayHours, StoreSettings, StoreStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function AdminHours() {
  const store = useStoreStatus();
  if (!store) return <div className="h-64 animate-pulse rounded-2xl bg-surface" />;
  return <HoursForm key={JSON.stringify(store.hours) + store.force_closed} store={store} />;
}

function HoursForm({ store }: { store: StoreStatus }) {
  const qc = useQueryClient();
  const [hours, setHours] = useState<DayHours[]>(store.hours);
  const [forceClosed, setForceClosed] = useState(store.force_closed);

  const save = useMutation({
    mutationFn: (body: StoreSettings) => apiPut<StoreStatus>("/admin/store/settings", body),
    onSuccess: (s) => {
      qc.setQueryData(["store", "status"], s);
      toast.success("Horários salvos");
    },
    onError: () => toast.error("Confira os horários (formato HH:MM)"),
  });

  const patch = (day: number, p: Partial<DayHours>) => setHours((hs) => hs.map((h) => (h.day === day ? { ...h, ...p } : h)));

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "rounded-2xl border p-4 text-sm font-semibold",
          store.is_open ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-red-500/40 bg-red-500/10 text-red-300",
        )}
        data-testid="admin-store-status"
      >
        Agora: {store.message}
      </div>

      <button
        type="button"
        onClick={() => setForceClosed((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-[background-color,border-color] duration-200",
          forceClosed ? "border-red-500/50 bg-red-500/10" : "border-line bg-surface hover:border-muted-foreground/40",
        )}
        data-testid="admin-force-closed-toggle"
        data-active={forceClosed}
      >
        <div>
          <p className="font-semibold">Fechar loja agora</p>
          <p className="text-xs text-muted-foreground">Pausa os pedidos imediatamente, independente do horário.</p>
        </div>
        <span className={cn("relative h-6 w-11 rounded-full transition-colors duration-200", forceClosed ? "bg-red-500" : "bg-surface-2")}>
          <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-[left] duration-200", forceClosed ? "left-[22px]" : "left-0.5")} />
        </span>
      </button>

      <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {hours.map((h) => (
          <div key={h.day} className="flex flex-wrap items-center gap-3 p-4" data-testid={`admin-hours-row-${h.day}`}>
            <label className="flex w-32 cursor-pointer items-center gap-2">
              <Checkbox checked={h.enabled} onCheckedChange={(c) => patch(h.day, { enabled: !!c })} data-testid={`admin-hours-enabled-${h.day}`} />
              <span className="font-semibold">{DAY_LABELS[h.day]}</span>
            </label>
            {h.enabled ? (
              <div className="flex items-center gap-2">
                <Input type="time" value={h.open} onChange={(e) => patch(h.day, { open: e.target.value })} className="w-28 font-mono" data-testid={`admin-hours-open-${h.day}`} />
                <span className="text-muted-foreground">às</span>
                <Input type="time" value={h.close} onChange={(e) => patch(h.day, { close: e.target.value })} className="w-28 font-mono" data-testid={`admin-hours-close-${h.day}`} />
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Fechado</span>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Horário de Teresina (UTC−3). Se o fechamento for menor que a abertura (ex.: 18:00 às 02:00), o expediente vai até a madrugada seguinte.
      </p>

      <Button
        onClick={() => save.mutate({ force_closed: forceClosed, hours })}
        disabled={save.isPending}
        className="h-11 rounded-full px-8 font-bold"
        data-testid="admin-hours-save"
      >
        {save.isPending ? "Salvando..." : "Salvar horários"}
      </Button>
    </div>
  );
}
