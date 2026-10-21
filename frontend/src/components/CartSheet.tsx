import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Banknote, CreditCard, Minus, Plus, QrCode, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiPost, ApiError } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { brl, whatsappLink } from "@/lib/format";
import type { Order, OrderCreate, PaymentMethod } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useStoreStatus } from "@/lib/store";

const PAYMENTS: { id: PaymentMethod; label: string; desc: string; Icon: typeof QrCode }[] = [
  { id: "pix", label: "PIX", desc: "Chave enviada no WhatsApp", Icon: QrCode },
  { id: "cartao_credito", label: "Crédito", desc: "Maquininha na entrega", Icon: CreditCard },
  { id: "cartao_debito", label: "Débito", desc: "Maquininha na entrega", Icon: CreditCard },
  { id: "dinheiro", label: "Dinheiro", desc: "Informe o troco", Icon: Banknote },
];

const EMPTY = {
  customer_name: "",
  phone: "",
  street: "",
  number: "",
  neighborhood: "",
  complement: "",
  notes: "",
  change_for: "",
};

export default function CartSheet() {
  const { lines, total, setQty, clear, open, setOpen } = useCart();
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [form, setForm] = useState(EMPTY);
  const [payment, setPayment] = useState<PaymentMethod>("pix");
  const navigate = useNavigate();
  const store = useStoreStatus();
  const qc = useQueryClient();

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const mutation = useMutation({
    mutationFn: (body: OrderCreate) => apiPost<Order>("/orders", body),
    onSuccess: (order) => {
      clear();
      setOpen(false);
      setStep("cart");
      setForm(EMPTY);
      toast.success(`Pedido ${order.code} recebido!`);
      window.open(whatsappLink(order), "_blank", "noopener");
      navigate(`/pedido/${order.id}`);
    },
    onError: (err) => {
      qc.invalidateQueries({ queryKey: ["store"] });
      qc.invalidateQueries({ queryKey: ["menu"] });
      const detail = err instanceof ApiError && err.body && typeof err.body === "object" && "detail" in err.body
        ? (err.body as { detail: unknown }).detail
        : null;
      toast.error(typeof detail === "string" ? detail : "Não foi possível enviar o pedido. Confira os dados.");
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const change = form.change_for.trim() ? Number(form.change_for.replace(",", ".")) : null;
    mutation.mutate({
      customer_name: form.customer_name.trim(),
      phone: form.phone.trim(),
      street: form.street.trim(),
      number: form.number.trim(),
      neighborhood: form.neighborhood.trim(),
      complement: form.complement.trim(),
      notes: form.notes.trim(),
      payment_method: payment,
      change_for: payment === "dinheiro" && change !== null && !Number.isNaN(change) ? change : null,
      items: lines.map((l) => ({ item_id: l.item_id, quantity: l.quantity, addon_ids: l.addon_ids, note: l.note })),
    });
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) setStep("cart"); }}>
      <SheetContent className="flex w-full flex-col gap-0 border-line bg-surface p-0 sm:max-w-md" data-testid="cart-sheet">
        <SheetHeader className="border-b border-line px-5 py-4">
          <div className="flex items-center gap-2">
            {step === "checkout" && (
              <button
                onClick={() => setStep("cart")}
                className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-surface-2"
                data-testid="checkout-back-button"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <SheetTitle className="font-heading text-xl font-bold">
              {step === "cart" ? "Seu pedido" : "Finalizar pedido"}
            </SheetTitle>
          </div>
          <SheetDescription className="text-xs">Taxa de entrega: consulte no ato do pedido.</SheetDescription>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center" data-testid="cart-empty">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Seu carrinho está vazio.</p>
            <Button variant="outline" onClick={() => setOpen(false)} data-testid="cart-empty-continue">
              Ver cardápio
            </Button>
          </div>
        ) : step === "cart" ? (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {lines.map((l) => (
                <div key={l.key} className="flex gap-3 rounded-xl border border-line bg-obsidian/50 p-3" data-testid="cart-line">
                  <img src={l.image} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold" data-testid="cart-line-name">{l.name}</p>
                    {l.addon_names.length > 0 && (
                      <p className="text-xs text-amber-glow">+ {l.addon_names.join(", ")}</p>
                    )}
                    {l.note && <p className="text-xs italic text-muted-foreground">“{l.note}”</p>}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-full border border-line">
                        <button
                          onClick={() => setQty(l.key, l.quantity - 1)}
                          className="grid h-7 w-7 place-items-center rounded-full transition-colors hover:bg-surface-2"
                          data-testid="cart-line-decrease"
                          aria-label="Diminuir"
                        >
                          {l.quantity === 1 ? <Trash2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                        </button>
                        <span className="w-6 text-center font-mono text-sm">{l.quantity}</span>
                        <button
                          onClick={() => setQty(l.key, l.quantity + 1)}
                          className="grid h-7 w-7 place-items-center rounded-full transition-colors hover:bg-surface-2"
                          data-testid="cart-line-increase"
                          aria-label="Aumentar"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="font-mono text-sm font-semibold">{brl(l.unit_price * l.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3 border-t border-line p-5">
              <div className="flex items-baseline justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono text-2xl font-bold text-flame" data-testid="cart-total">{brl(total)}</span>
              </div>
              <Button
                onClick={() => setStep("checkout")}
                className="h-12 w-full rounded-full font-bold transition-transform duration-150 active:scale-[0.98]"
                data-testid="cart-checkout-button"
              >
                Continuar
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={submit} className="flex flex-1 flex-col overflow-hidden" data-testid="checkout-form">
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <Field label="Nome" id="name">
                <Input id="name" required minLength={2} value={form.customer_name} onChange={set("customer_name")} data-testid="checkout-name-input" />
              </Field>
              <Field label="Telefone / WhatsApp" id="phone">
                <Input id="phone" required minLength={8} inputMode="tel" placeholder="(86) 9...." value={form.phone} onChange={set("phone")} data-testid="checkout-phone-input" />
              </Field>
              <div className="grid grid-cols-[1fr_90px] gap-3">
                <Field label="Rua" id="street">
                  <Input id="street" required minLength={2} value={form.street} onChange={set("street")} data-testid="checkout-street-input" />
                </Field>
                <Field label="Número" id="number">
                  <Input id="number" required value={form.number} onChange={set("number")} data-testid="checkout-number-input" />
                </Field>
              </div>
              <Field label="Bairro" id="neighborhood">
                <Input id="neighborhood" required minLength={2} value={form.neighborhood} onChange={set("neighborhood")} data-testid="checkout-neighborhood-input" />
              </Field>
              <Field label="Complemento / Referência" id="complement">
                <Input id="complement" value={form.complement} onChange={set("complement")} data-testid="checkout-complement-input" />
              </Field>

              <div>
                <Label className="mb-2 block text-xs uppercase tracking-[0.16em] text-muted-foreground">Pagamento</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENTS.map(({ id, label, desc, Icon }) => (
                    <button
                      type="button"
                      key={id}
                      onClick={() => setPayment(id)}
                      className={cn(
                        "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-[border-color,background-color] duration-200",
                        payment === id ? "border-flame bg-flame/10" : "border-line bg-obsidian/50 hover:border-muted-foreground/50",
                      )}
                      data-testid={`payment-option-${id}`}
                    >
                      <Icon className={cn("h-4 w-4", payment === id ? "text-flame" : "text-muted-foreground")} />
                      <span className="text-sm font-semibold">{label}</span>
                      <span className="text-[11px] text-muted-foreground">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {payment === "dinheiro" && (
                <Field label="Troco para quanto? (opcional)" id="change">
                  <Input id="change" inputMode="decimal" placeholder="Ex.: 100" value={form.change_for} onChange={set("change_for")} data-testid="checkout-change-input" />
                </Field>
              )}

              <Field label="Observações" id="notes">
                <Textarea id="notes" value={form.notes} onChange={set("notes")} maxLength={300} placeholder="Algo que devemos saber?" data-testid="checkout-notes-input" />
              </Field>
            </div>
            <div className="space-y-3 border-t border-line p-5">
              <div className="flex items-baseline justify-between">
                <span className="text-muted-foreground">Total (sem entrega)</span>
                <span className="font-mono text-2xl font-bold text-flame" data-testid="checkout-total">{brl(total)}</span>
              </div>
              <Button
                type="submit"
                disabled={mutation.isPending || store?.is_open === false}
                className="h-12 w-full rounded-full font-bold animate-ember"
                data-testid="checkout-submit-button"
              >
                {mutation.isPending ? "Enviando..." : store?.is_open === false ? "Loja fechada no momento" : "Enviar pedido pelo WhatsApp"}
              </Button>
              {store?.is_open === false && (
                <p className="text-center text-xs text-red-300" data-testid="checkout-closed-message">{store.message}</p>
              )}
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
