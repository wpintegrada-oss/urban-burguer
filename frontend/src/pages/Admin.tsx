import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, LogOut, MapPin, Phone, RefreshCw, Volume2, VolumeX } from "lucide-react";
import AdminMenu from "@/components/admin/AdminMenu";
import AdminHours from "@/components/admin/AdminHours";
import { useNewOrderAlert } from "@/components/admin/useNewOrderAlert";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { brl, PAYMENT_LABELS, STATUS_LABELS, STATUS_STYLES } from "@/lib/format";
import type { AdminMe, AdminStats, Order, OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const FILTERS: ("todos" | OrderStatus)[] = ["todos", "recebido", "preparando", "saiu_entrega", "entregue", "cancelado"];
const ALL_STATUS: OrderStatus[] = ["recebido", "preparando", "saiu_entrega", "entregue", "cancelado"];

export default function AdminPage() {
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ["admin", "me"], queryFn: () => apiGet<AdminMe>("/admin/me") });
  const authed = !me.isError && me.data?.authenticated === true;

  const logout = async () => {
    await apiPost<AdminMe>("/admin/logout");
    qc.removeQueries({ queryKey: ["admin"] });
    await qc.invalidateQueries({ queryKey: ["admin", "me"] });
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line bg-obsidian/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3" data-testid="admin-logo-link">
            <img src="/logo.jpg" alt="" className="h-10 w-10 rounded-full object-cover" />
            <p className="font-heading font-black tracking-tight">
              URBAN <span className="text-flame">PAINEL</span>
            </p>
          </Link>
          {authed && (
            <Button variant="ghost" size="sm" onClick={logout} data-testid="admin-logout-button">
              <LogOut className="mr-1 h-4 w-4" /> Sair
            </Button>
          )}
        </div>
      </header>
      {me.isLoading ? null : authed ? <AdminArea /> : <PinGate />}
    </div>
  );
}

const TABS = [
  { id: "pedidos", label: "Pedidos" },
  { id: "cardapio", label: "Cardápio" },
  { id: "horarios", label: "Horários" },
] as const;

function AdminArea() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("pedidos");
  const { soundOn, toggle } = useNewOrderAlert();
  return (
    <>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pt-6 sm:px-6">
        <div className="flex gap-1 rounded-full border border-line bg-surface p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-[background-color,color] duration-200",
                tab === t.id ? "bg-flame text-white" : "text-muted-foreground hover:text-foreground",
              )}
              data-testid={`admin-tab-${t.id}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={toggle}
          className={cn(
            "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-[background-color,border-color] duration-200",
            soundOn ? "border-flame/50 bg-flame/10 text-flame" : "border-line text-muted-foreground",
          )}
          data-testid="admin-sound-toggle"
          data-on={soundOn}
        >
          {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          {soundOn ? "Som ligado" : "Som desligado"}
        </button>
      </div>
      {tab === "pedidos" && <Dashboard />}
      {tab === "cardapio" && (
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <h1 className="mb-6 font-heading text-3xl font-black tracking-tight">Cardápio</h1>
          <AdminMenu />
        </main>
      )}
      {tab === "horarios" && (
        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <h1 className="mb-6 font-heading text-3xl font-black tracking-tight">Horário de funcionamento</h1>
          <AdminHours />
        </main>
      )}
    </>
  );
}

function PinGate() {
  const qc = useQueryClient();
  const [pin, setPin] = useState("");
  const login = useMutation({
    mutationFn: () => apiPost<AdminMe>("/admin/login", { pin }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "me"] }),
    onError: () => {
      toast.error("PIN incorreto");
      setPin("");
    },
  });
  return (
    <main className="mx-auto flex max-w-sm flex-col items-center px-4 py-20 text-center animate-rise">
      <span className="grid h-14 w-14 place-items-center rounded-full border border-flame/40 bg-flame/10 text-flame">
        <Lock className="h-6 w-6" />
      </span>
      <h1 className="mt-5 font-heading text-3xl font-black">Acesso restrito</h1>
      <p className="mt-2 text-sm text-muted-foreground">Digite o PIN para gerenciar os pedidos.</p>
      <form
        className="mt-6 w-full space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          login.mutate();
        }}
      >
        <Input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="••••"
          className="h-12 text-center font-mono text-xl tracking-[0.5em]"
          data-testid="admin-pin-input"
        />
        <Button type="submit" className="h-12 w-full rounded-full font-bold" disabled={!pin || login.isPending} data-testid="admin-pin-submit">
          Entrar
        </Button>
      </form>
    </main>
  );
}

function Dashboard() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("todos");
  const orders = useQuery({
    queryKey: ["admin", "orders", filter],
    queryFn: () => apiGet<Order[]>(filter === "todos" ? "/admin/orders" : `/admin/orders?status=${filter}`),
    refetchInterval: 8000,
  });
  const stats = useQuery({ queryKey: ["admin", "stats"], queryFn: () => apiGet<AdminStats>("/admin/stats"), refetchInterval: 8000 });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => apiPatch<Order>(`/admin/orders/${id}/status`, { status }),
    onSuccess: (o) => {
      toast.success(`${o.code} → ${STATUS_LABELS[o.status]}`);
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
    onError: () => toast.error("Falha ao atualizar status"),
  });

  const s = stats.isError ? undefined : stats.data;
  const list = orders.isError ? [] : (orders.data ?? []);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Hoje</p>
          <h1 className="font-heading text-3xl font-black tracking-tight">Pedidos</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["admin"] })} data-testid="admin-refresh-button">
          <RefreshCw className="mr-1 h-4 w-4" /> Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Pedidos hoje" value={String(s?.orders_today ?? 0)} testid="admin-stat-orders" />
        <Stat label="Faturamento" value={brl(s?.revenue_today ?? 0)} testid="admin-stat-revenue" accent />
        <Stat label="Na fila" value={String(s?.by_status.recebido ?? 0)} testid="admin-stat-received" />
        <Stat label="Na chapa" value={String(s?.by_status.preparando ?? 0)} testid="admin-stat-preparing" />
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-[background-color,color] duration-200",
              filter === f ? "bg-flame text-white" : "bg-[#1F1F2A] text-zinc-300 hover:bg-surface-2",
            )}
            data-testid={`admin-filter-${f}`}
          >
            {f === "todos" ? "Todos" : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {list.length === 0 && !orders.isLoading && (
        <p className="rounded-2xl border border-line bg-surface p-8 text-center text-muted-foreground" data-testid="admin-orders-empty">
          Nenhum pedido aqui ainda.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {list.map((o) => (
          <article key={o.id} className="rounded-2xl border border-line bg-surface p-5 transition-[border-color] duration-200 hover:border-flame/40" data-testid={`admin-order-${o.code}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-heading text-xl font-black text-flame">{o.code}</p>
                <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-BR")}</p>
              </div>
              <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", STATUS_STYLES[o.status])} data-testid="admin-order-status-badge">
                {STATUS_LABELS[o.status]}
              </span>
            </div>
            <div className="mt-3 space-y-1 text-sm">
              <p className="font-semibold">{o.customer_name}</p>
              <p className="flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3.5 w-3.5" /> {o.phone}</p>
              <p className="flex items-start gap-1.5 text-muted-foreground">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {o.street}, {o.number} — {o.neighborhood}
                {o.complement && ` (${o.complement})`}
              </p>
            </div>
            <ul className="mt-3 space-y-1 rounded-xl bg-obsidian/60 p-3 text-sm">
              {o.items.map((l, i) => (
                <li key={i}>
                  <span className="font-semibold">{l.quantity}x {l.name}</span>
                  {l.addons.length > 0 && <span className="text-amber-glow"> + {l.addons.map((a) => a.name).join(", ")}</span>}
                  {l.note && <span className="italic text-muted-foreground"> — “{l.note}”</span>}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">
                {PAYMENT_LABELS[o.payment_method]}
                {o.change_for ? ` · troco p/ ${brl(o.change_for)}` : ""}
              </span>
              <span className="font-mono text-lg font-bold">{brl(o.total)}</span>
            </div>
            {o.notes && <p className="mt-1 text-xs text-muted-foreground">Obs: {o.notes}</p>}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {ALL_STATUS.map((st) => (
                <button
                  key={st}
                  disabled={o.status === st || update.isPending}
                  onClick={() => update.mutate({ id: o.id, status: st })}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-[background-color,border-color,opacity] duration-200",
                    o.status === st ? STATUS_STYLES[st] : "border-line text-muted-foreground hover:border-flame hover:text-foreground",
                    "disabled:cursor-default",
                  )}
                  data-testid={`admin-order-${o.code}-set-${st}`}
                >
                  {STATUS_LABELS[st]}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

function Stat({ label, value, testid, accent }: { label: string; value: string; testid: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-2xl border p-4", accent ? "border-flame/40 bg-flame/10" : "border-line bg-surface")}>
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-mono text-2xl font-bold", accent && "text-flame")} data-testid={testid}>{value}</p>
    </div>
  );
}
