import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiGet, apiPatch, apiUpload, ApiError } from "@/lib/api";
import { brl } from "@/lib/format";
import type { ImageUploaded, Menu, MenuItem, MenuItemUpdate } from "@/lib/types";
import { cn } from "@/lib/utils";

function errMsg(err: unknown, fallback: string) {
  if (err instanceof ApiError && err.body && typeof err.body === "object" && "detail" in err.body) {
    const d = (err.body as { detail: unknown }).detail;
    if (typeof d === "string") return d;
  }
  return fallback;
}

export default function AdminMenu() {
  const qc = useQueryClient();
  const menu = useQuery({ queryKey: ["menu"], queryFn: () => apiGet<Menu>("/menu") });
  const [editing, setEditing] = useState<MenuItem | null>(null);

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: MenuItemUpdate }) => apiPatch<MenuItem>(`/admin/menu/items/${id}`, body),
    onSuccess: (item) => {
      qc.invalidateQueries({ queryKey: ["menu"] });
      toast.success(`${item.name} atualizado`);
    },
    onError: (e) => toast.error(errMsg(e, "Falha ao salvar")),
  });

  const data = menu.isError ? undefined : menu.data;

  return (
    <div className="space-y-8">
      {!data && !menu.isLoading && (
        <p className="rounded-2xl border border-line bg-surface p-6 text-muted-foreground" data-testid="admin-menu-unavailable">
          Não foi possível carregar o cardápio.
        </p>
      )}
      {data?.categories.map((c) => (
        <section key={c.id}>
          <h3 className="mb-3 font-heading text-lg font-bold uppercase tracking-tight">{c.name}</h3>
          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {data.items
              .filter((i) => i.category_id === c.id)
              .map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 sm:gap-4" data-testid={`admin-menu-row-${item.id}`}>
                  <img src={item.image} alt="" className={cn("h-14 w-14 shrink-0 rounded-lg object-cover", !item.available && "opacity-40 grayscale")} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{item.name}</p>
                    <p className="font-mono text-sm text-flame" data-testid={`admin-menu-price-${item.id}`}>{brl(item.price)}</p>
                  </div>
                  <button
                    onClick={() => update.mutate({ id: item.id, body: { available: !item.available } })}
                    disabled={update.isPending}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-[background-color,border-color] duration-200",
                      item.available ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-red-500/40 bg-red-500/10 text-red-300",
                    )}
                    data-testid={`admin-menu-toggle-${item.id}`}
                    data-available={item.available}
                  >
                    <span className={cn("h-2 w-2 rounded-full", item.available ? "bg-emerald-400" : "bg-red-400")} />
                    {item.available ? "Disponível" : "Esgotado"}
                  </button>
                  <Button variant="outline" size="icon-sm" onClick={() => setEditing(item)} data-testid={`admin-menu-edit-${item.id}`} aria-label="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              ))}
          </div>
        </section>
      ))}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto border-line bg-surface sm:max-w-lg" data-testid="admin-edit-dialog">
          {editing && (
            <EditForm
              key={editing.id}
              item={editing}
              saving={update.isPending}
              onSave={(body) => update.mutate({ id: editing.id, body }, { onSuccess: () => setEditing(null) })}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditForm({ item, saving, onSave }: { item: MenuItem; saving: boolean; onSave: (b: MenuItemUpdate) => void }) {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(item.price.toFixed(2).replace(".", ","));
  const [description, setDescription] = useState(item.description);
  const [badge, setBadge] = useState(item.badge ?? "");
  const [image, setImage] = useState(item.image);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return apiUpload<ImageUploaded>("/admin/images", form);
    },
    onSuccess: (r) => {
      setImage(r.url);
      toast.success("Foto enviada — clique em Salvar");
    },
    onError: (e) => toast.error(errMsg(e, "Falha ao enviar a foto")),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = Number(price.replace(",", "."));
    if (!Number.isFinite(p) || p <= 0) {
      toast.error("Preço inválido");
      return;
    }
    onSave({ name: name.trim(), price: p, description: description.trim(), badge: badge.trim(), image: image.trim() });
  };

  return (
    <form onSubmit={submit} className="space-y-4" data-testid="admin-edit-form">
      <DialogHeader>
        <DialogTitle className="font-heading text-xl font-bold">Editar item</DialogTitle>
      </DialogHeader>

      <div className="flex items-center gap-4">
        <img src={image} alt="" className="h-24 w-24 rounded-xl border border-line object-cover" data-testid="admin-edit-image-preview" />
        <div className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload.mutate(f);
              e.target.value = "";
            }}
            data-testid="admin-edit-image-file"
          />
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={upload.isPending} data-testid="admin-edit-image-upload">
            <ImagePlus className="mr-1 h-4 w-4" /> {upload.isPending ? "Enviando..." : "Trocar foto"}
          </Button>
          <p className="text-xs text-muted-foreground">JPG ou PNG, até 4 MB</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ed-name">Nome</Label>
        <Input id="ed-name" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} data-testid="admin-edit-name" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ed-price">Preço (R$)</Label>
          <Input id="ed-price" required inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} data-testid="admin-edit-price" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ed-badge">Selo (opcional)</Label>
          <Input id="ed-badge" maxLength={30} placeholder="Ex.: Novidade" value={badge} onChange={(e) => setBadge(e.target.value)} data-testid="admin-edit-badge" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ed-desc">Descrição</Label>
        <Textarea id="ed-desc" maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)} data-testid="admin-edit-description" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ed-img">Endereço da foto (ou use "Trocar foto")</Label>
        <Input id="ed-img" required value={image} onChange={(e) => setImage(e.target.value)} data-testid="admin-edit-image-url" />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={saving || upload.isPending} className="rounded-full font-bold" data-testid="admin-edit-save">
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
