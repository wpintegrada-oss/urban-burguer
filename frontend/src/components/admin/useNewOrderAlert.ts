import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet } from "@/lib/api";
import { brl } from "@/lib/format";
import type { Order } from "@/lib/types";

let ctx: AudioContext | null = null;

// Short "ding-ding-ding" via WebAudio — no asset file. Needs one user gesture first (the toggle / login click).
export function playAlert() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const t0 = ctx.currentTime;
    [0, 0.22, 0.44].forEach((offset, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = "triangle";
      osc.frequency.value = i === 2 ? 1320 : 880;
      gain.gain.setValueAtTime(0.0001, t0 + offset);
      gain.gain.exponentialRampToValueAtTime(0.4, t0 + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + offset + 0.2);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(t0 + offset);
      osc.stop(t0 + offset + 0.22);
    });
  } catch {
    /* audio unavailable — the toast still shows */
  }
}

const KEY = "urban-admin-sound";

export function useNewOrderAlert() {
  const qc = useQueryClient();
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem(KEY) !== "off");
  const seen = useRef<Set<string> | null>(null);

  const incoming = useQuery({
    queryKey: ["admin", "incoming"],
    queryFn: () => apiGet<Order[]>("/admin/orders?status=recebido"),
    refetchInterval: 8000,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (incoming.isError || !incoming.data) return;
    const ids = incoming.data.map((o) => o.id);
    if (seen.current === null) {
      seen.current = new Set(ids); // first load: don't ring for existing orders
      return;
    }
    const fresh = incoming.data.filter((o) => !seen.current!.has(o.id));
    ids.forEach((id) => seen.current!.add(id));
    if (fresh.length === 0) return;
    if (soundOn) playAlert();
    fresh.forEach((o) => toast.success(`Novo pedido ${o.code} · ${brl(o.total)}`, { duration: 8000 }));
    qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    qc.invalidateQueries({ queryKey: ["admin", "stats"] });
  }, [incoming.data, incoming.isError, soundOn, qc]);

  const toggle = () => {
    const next = !soundOn;
    setSoundOn(next);
    localStorage.setItem(KEY, next ? "on" : "off");
    if (next) playAlert();
  };

  return { soundOn, toggle };
}
