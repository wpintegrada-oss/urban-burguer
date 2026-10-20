import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Flame, MapPin, Plus } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import CartSheet from "@/components/CartSheet";
import ItemDialog from "@/components/ItemDialog";
import { apiGet } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { brl, WHATSAPP_DISPLAY } from "@/lib/format";
import type { Menu, MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const HERO = "https://images.pexels.com/photos/18987002/pexels-photo-18987002.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1400";

export default function MenuPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["menu"], queryFn: () => apiGet<Menu>("/menu") });
  const [active, setActive] = useState("especiais");
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const { count, total, setOpen } = useCart();
  const menu = isError ? undefined : data;

  const goTo = (id: string) => {
    setActive(id);
    document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen pb-28">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <img src={HERO} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian via-obsidian/85 to-obsidian/30" />
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-[1.3fr_1fr] md:py-20">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-flame/40 bg-flame/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-flame">
              <Flame className="h-3.5 w-3.5" /> Hamburgueria artesanal
            </span>
            <h1 className="mt-5 font-heading text-4xl font-black leading-[0.95] tracking-tight sm:text-6xl">
              Burger de verdade,
              <br />
              <span className="bg-gradient-to-r from-flame to-amber-glow bg-clip-text text-transparent">direto na chapa.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
              Monte seu pedido, escolha os adicionais e mande direto no nosso WhatsApp. Blend 130g, molho da casa e muita atitude.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <button
                onClick={() => goTo("especiais")}
                className="group inline-flex h-12 items-center gap-2 rounded-full bg-flame px-6 font-bold text-white animate-ember transition-transform duration-150 active:scale-95"
                data-testid="hero-order-button"
              >
                Fazer pedido <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
              <span className="inline-flex items-center gap-2 font-mono text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-flame" /> Delivery · {WHATSAPP_DISPLAY}
              </span>
            </div>
          </div>
          <div className="hidden items-center justify-end md:flex">
            <img
              src="/logo.jpg"
              alt="Urban Burguer"
              className="w-72 rotate-[-4deg] rounded-[2rem] border border-line shadow-[0_30px_80px_-20px_rgba(255,107,0,0.45)]"
            />
          </div>
        </div>
      </section>

      {/* Category pills */}
      <nav className="sticky top-16 z-30 border-b border-line bg-obsidian/85 backdrop-blur-xl">
        <div className="no-scrollbar mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3 sm:px-6">
          {(menu?.categories ?? []).map((c) => (
            <button
              key={c.id}
              onClick={() => goTo(c.id)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-[background-color,color] duration-200",
                active === c.id ? "bg-flame text-white" : "bg-[#1F1F2A] text-zinc-300 hover:bg-surface-2",
              )}
              data-testid={`category-pill-${c.id}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-6xl space-y-14 px-4 pt-10 sm:px-6">
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="menu-loading">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl bg-surface" />
            ))}
          </div>
        )}
        {!menu && !isLoading && (
          <p className="rounded-2xl border border-line bg-surface p-6 text-muted-foreground" data-testid="menu-unavailable">
            Cardápio indisponível no momento. Peça pelo WhatsApp {WHATSAPP_DISPLAY}.
          </p>
        )}

        {menu?.categories.map((c, ci) => {
          const items = menu.items.filter((i) => i.category_id === c.id);
          return (
            <section key={c.id} id={`cat-${c.id}`} className="scroll-mt-36" data-testid={`category-section-${c.id}`}>
              <div className="mb-5 flex items-end gap-4">
                <span className="font-mono text-sm text-flame">{String(ci + 1).padStart(2, "0")}</span>
                <h2 className="font-heading text-2xl font-bold uppercase tracking-tight sm:text-3xl">{c.name}</h2>
                <span className="mb-2 h-px flex-1 bg-gradient-to-r from-line to-transparent" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className="group flex gap-4 rounded-2xl border border-line bg-surface p-3 text-left transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-flame/60 hover:shadow-[0_12px_40px_-12px_rgba(255,107,0,0.35)]"
                    data-testid={`menu-item-${item.id}`}
                  >
                    <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl">
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      {item.badge && (
                        <span className="mb-1 w-fit rounded-full bg-flame/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-flame">
                          {item.badge}
                        </span>
                      )}
                      <h3 className="font-heading text-base font-bold leading-tight">{item.name}</h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <span className="font-mono font-semibold text-flame" data-testid={`menu-item-price-${item.id}`}>
                          {brl(item.price)}
                        </span>
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-surface-2 transition-colors duration-200 group-hover:bg-flame">
                          <Plus className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          );
        })}

        <footer className="border-t border-line py-10 text-center text-sm text-muted-foreground">
          <p className="font-heading font-bold text-foreground">URBAN BURGUER</p>
          <p className="mt-1">Delivery {WHATSAPP_DISPLAY} · Taxa de entrega: consulte no ato do pedido</p>
        </footer>
      </main>

      {/* Sticky cart bar */}
      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-4 animate-rise">
          <button
            onClick={() => setOpen(true)}
            className="mx-auto flex h-14 w-full max-w-xl items-center justify-between rounded-full bg-flame px-6 font-bold text-white shadow-[0_10px_40px_-5px_rgba(255,107,0,0.6)] transition-transform duration-150 active:scale-[0.98]"
            data-testid="sticky-cart-bar"
          >
            <span className="grid h-8 min-w-8 place-items-center rounded-full bg-black/25 px-2 font-mono text-sm">{count}</span>
            <span>Ver pedido</span>
            <span className="font-mono" data-testid="sticky-cart-total">{brl(total)}</span>
          </button>
        </div>
      )}

      <ItemDialog item={selected} addons={menu?.addons ?? []} onClose={() => setSelected(null)} />
      <CartSheet />
    </div>
  );
}
