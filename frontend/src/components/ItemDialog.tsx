import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/format";
import { useCart } from "@/lib/cart";
import type { Addon, MenuItem } from "@/lib/types";

interface Props {
  item: MenuItem | null;
  addons: Addon[];
  onClose: () => void;
}

export default function ItemDialog({ item, addons, onClose }: Props) {
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-h-[92vh] overflow-y-auto border-line bg-surface p-0 sm:max-w-lg"
        data-testid="item-dialog"
      >
        {item && <ItemForm key={item.id} item={item} addons={addons} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function ItemForm({ item, addons, onClose }: { item: MenuItem; addons: Addon[]; onClose: () => void }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const chosen = addons.filter((a) => selected.includes(a.id));
  const unit = item.price + chosen.reduce((s, a) => s + a.price, 0);

  const toggle = (id: string, on: boolean) =>
    setSelected((prev) => (on ? [...prev, id] : prev.filter((x) => x !== id)));

  const submit = () => {
    add({
      item_id: item.id,
      name: item.name,
      image: item.image,
      unit_price: unit,
      quantity: qty,
      addon_ids: chosen.map((a) => a.id),
      addon_names: chosen.map((a) => a.name),
      note: note.trim(),
    });
    toast.success(`${qty}x ${item.name} adicionado ao pedido`);
    onClose();
  };

  return (
    <>
      <div className="relative h-52 w-full overflow-hidden sm:h-60">
        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent" />
      </div>
      <div className="-mt-10 space-y-5 px-5 pb-5 relative">
        <div>
          <DialogTitle className="font-heading text-2xl font-bold tracking-tight" data-testid="item-dialog-title">
            {item.name}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {item.description}
          </DialogDescription>
          <p className="mt-2 font-mono text-lg font-semibold text-flame">{brl(item.price)}</p>
        </div>

        {item.allows_addons && (
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <h4 className="font-heading text-sm font-bold uppercase tracking-[0.18em] text-amber-glow">Adicionais</h4>
              <span className="text-xs text-muted-foreground">opcional</span>
            </div>
            <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-obsidian/60">
              {addons.map((a) => {
                const on = selected.includes(a.id);
                return (
                  <label
                    key={a.id}
                    className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors duration-200 hover:bg-surface-2"
                  >
                    <Checkbox
                      checked={on}
                      onCheckedChange={(c) => toggle(a.id, !!c)}
                      data-testid={`addon-checkbox-${a.id}`}
                    />
                    <span className="flex-1 text-sm">{a.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">+ {brl(a.price)}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <h4 className="mb-2 font-heading text-sm font-bold uppercase tracking-[0.18em] text-amber-glow">Observação</h4>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            placeholder="Ex.: sem cebola, ponto da carne..."
            className="border-line bg-obsidian/60"
            data-testid="item-note-input"
          />
        </div>

        <div className="sticky bottom-0 -mx-5 flex items-center gap-3 border-t border-line bg-surface/95 px-5 pt-4 backdrop-blur">
          <div className="flex items-center rounded-full border border-line bg-obsidian">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="grid h-10 w-10 place-items-center rounded-full transition-colors duration-150 hover:bg-surface-2"
              data-testid="item-qty-decrease"
              aria-label="Diminuir"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center font-mono font-semibold" data-testid="item-qty-value">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(50, q + 1))}
              className="grid h-10 w-10 place-items-center rounded-full transition-colors duration-150 hover:bg-surface-2"
              data-testid="item-qty-increase"
              aria-label="Aumentar"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <Button
            onClick={submit}
            className="h-11 flex-1 rounded-full text-sm font-bold shadow-[0_0_24px_rgba(255,107,0,0.35)] transition-transform duration-150 active:scale-[0.97]"
            data-testid="add-to-cart-button"
          >
            Adicionar · {brl(unit * qty)}
          </Button>
        </div>
      </div>
    </>
  );
}
