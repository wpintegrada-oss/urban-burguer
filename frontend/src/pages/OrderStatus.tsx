import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, Flame, MessageCircle, Truck, XCircle } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import CartSheet from "@/components/CartSheet";
import { buttonVariants } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import { brl, PAYMENT_LABELS, STATUS_FLOW, STATUS_LABELS, whatsappLink } from "@/lib/format";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS = { recebido: Clock, preparando: Flame, saiu_entrega: Truck, entregue: CheckCircle2 } as const;

export default function OrderStatusPage() {
  const { id = "" } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["order", id],
    queryFn: () => apiGet<Order>(`/orders/${id}`),
    refetchInterval: 10000,
  });
  const order = isError ? undefined : data;
  const idx = order ? STATUS_FLOW.indexOf(order.status) : -1;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {isLoading && <div className="h-64 animate-pulse rounded-2xl bg-surface" />}
        {!order && !isLoading && (
          <div className="rounded-2xl border border-line bg-surface p-8 text-center" data-testid="order-not-found">
            <p className="text-muted-foreground">Pedido não encontrado.</p>
            <Link to="/" className={cn(buttonVariants({ variant: "outline" }), "mt-4")} data-testid="order-back-menu">
              Voltar ao cardápio
            </Link>
          </div>
        )}
        {order && (
          <div className="animate-rise space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Acompanhe seu pedido</p>
              <h1 className="mt-1 font-heading text-4xl font-black tracking-tight">
                Pedido <span className="text-flame" data-testid="order-code">{order.code}</span>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(order.created_at).toLocaleString("pt-BR")} · atualiza automaticamente
              </p>
            </div>

            {order.status === "cancelado" ? (
              <div className="flex items-center gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-5 text-red-300" data-testid="order-status">
                <XCircle className="h-6 w-6" /> Este pedido foi cancelado.
              </div>
            ) : (
              <ol className="grid grid-cols-4 gap-2" data-testid="order-status" data-status={order.status}>
                {STATUS_FLOW.map((s, i) => {
                  const Icon = ICONS[s as keyof typeof ICONS];
                  const done = i <= idx;
                  return (
                    <li key={s} className="flex flex-col items-center gap-2 text-center">
                      <span
                        className={cn(
                          "grid h-12 w-12 place-items-center rounded-full border transition-colors duration-300",
                          done ? "border-flame bg-flame text-white" : "border-line bg-surface text-muted-foreground",
                          i === idx && "animate-ember",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className={cn("text-[11px] font-semibold sm:text-xs", done ? "text-foreground" : "text-muted-foreground")}>
                        {STATUS_LABELS[s]}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}

            <a
              href={whatsappLink(order)}
              target="_blank"
              rel="noreferrer"
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] font-bold text-black transition-transform duration-150 active:scale-[0.98]"
              data-testid="order-whatsapp-button"
            >
              <MessageCircle className="h-5 w-5" /> Enviar / reenviar no WhatsApp
            </a>

            <div className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="mb-3 font-heading text-lg font-bold">Itens</h2>
              <ul className="divide-y divide-line">
                {order.items.map((l, i) => (
                  <li key={i} className="flex justify-between gap-4 py-3" data-testid="order-line">
                    <div>
                      <p className="font-semibold">{l.quantity}x {l.name}</p>
                      {l.addons.length > 0 && <p className="text-xs text-amber-glow">+ {l.addons.map((a) => a.name).join(", ")}</p>}
                      {l.note && <p className="text-xs italic text-muted-foreground">“{l.note}”</p>}
                    </div>
                    <span className="font-mono text-sm">{brl(l.line_total)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
                <span className="text-muted-foreground">Total (+ entrega)</span>
                <span className="font-mono text-2xl font-bold text-flame" data-testid="order-total">{brl(order.total)}</span>
              </div>
            </div>

            <div className="grid gap-4 rounded-2xl border border-line bg-surface p-5 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Entrega</p>
                <p className="mt-1">{order.customer_name} · {order.phone}</p>
                <p className="text-muted-foreground">
                  {order.street}, {order.number} — {order.neighborhood}
                  {order.complement && ` (${order.complement})`}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Pagamento</p>
                <p className="mt-1">
                  {PAYMENT_LABELS[order.payment_method]}
                  {order.change_for ? ` · troco p/ ${brl(order.change_for)}` : ""}
                </p>
                {order.notes && <p className="text-muted-foreground">Obs: {order.notes}</p>}
              </div>
            </div>

            <Link to="/" className={cn(buttonVariants({ variant: "outline" }), "w-full rounded-full")} data-testid="order-new-button">
              Fazer outro pedido
            </Link>
          </div>
        )}
      </main>
      <CartSheet />
    </div>
  );
}
