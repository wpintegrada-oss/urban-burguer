import type { Order, OrderStatus, PaymentMethod } from "@/lib/types";

export const WHATSAPP_NUMBER = "5586998166138";
export const WHATSAPP_DISPLAY = "(86) 99816-6138";

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: "PIX",
  cartao_credito: "Cartão de Crédito",
  cartao_debito: "Cartão de Débito",
  dinheiro: "Dinheiro",
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  recebido: "Recebido",
  preparando: "Na chapa",
  saiu_entrega: "Saiu p/ entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export const STATUS_STYLES: Record<OrderStatus, string> = {
  recebido: "bg-yellow-500/15 text-yellow-300 border-yellow-500/40",
  preparando: "bg-orange-500/15 text-orange-300 border-orange-500/40",
  saiu_entrega: "bg-blue-500/15 text-blue-300 border-blue-500/40",
  entregue: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  cancelado: "bg-red-500/15 text-red-300 border-red-500/40",
};

export const STATUS_FLOW: OrderStatus[] = ["recebido", "preparando", "saiu_entrega", "entregue"];

export function whatsappMessage(o: Order): string {
  const lines = [
    `*NOVO PEDIDO ${o.code}* — Urban Burguer`,
    "",
    ...o.items.map((l) => {
      const add = l.addons.length ? `\n   + ${l.addons.map((a) => a.name).join(", ")}` : "";
      const note = l.note ? `\n   Obs: ${l.note}` : "";
      return `${l.quantity}x ${l.name} — ${brl(l.line_total)}${add}${note}`;
    }),
    "",
    `*Total: ${brl(o.total)}* (+ taxa de entrega)`,
    "",
    `*Cliente:* ${o.customer_name}`,
    `*Telefone:* ${o.phone}`,
    `*Endereço:* ${o.street}, ${o.number} — ${o.neighborhood}${o.complement ? ` (${o.complement})` : ""}`,
    `*Pagamento:* ${PAYMENT_LABELS[o.payment_method]}${
      o.payment_method === "dinheiro" && o.change_for ? ` (troco para ${brl(o.change_for)})` : ""
    }`,
    ...(o.notes ? [`*Obs:* ${o.notes}`] : []),
    "",
    `Acompanhe: ${window.location.origin}/pedido/${o.id}`,
  ];
  return lines.join("\n");
}

export const whatsappLink = (o: Order) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage(o))}`;
