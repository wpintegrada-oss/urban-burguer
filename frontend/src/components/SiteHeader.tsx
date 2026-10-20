import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from "@/lib/format";

export default function SiteHeader() {
  const { count, setOpen } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-obsidian/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3" data-testid="header-logo-link">
          <img src="/logo.jpg" alt="Urban Burguer" className="h-11 w-11 rounded-full object-cover ring-1 ring-flame/40" />
          <div className="leading-tight">
            <p className="font-heading text-lg font-black tracking-tight">
              URBAN <span className="text-flame">BURGUER</span>
            </p>
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Sabor · Atitude · Qualidade</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noreferrer"
            className="hidden font-mono text-xs text-muted-foreground transition-colors hover:text-flame sm:block"
            data-testid="header-whatsapp-link"
          >
            {WHATSAPP_DISPLAY}
          </a>
          <button
            onClick={() => setOpen(true)}
            className="relative grid h-11 w-11 place-items-center rounded-full border border-line bg-surface transition-[border-color,transform] duration-200 hover:border-flame active:scale-95"
            data-testid="header-cart-button"
            aria-label="Abrir carrinho"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span
                key={count}
                className="absolute -right-1 -top-1 grid h-5 min-w-5 animate-bump place-items-center rounded-full bg-flame px-1 font-mono text-[11px] font-bold text-white"
                data-testid="header-cart-count"
              >
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
