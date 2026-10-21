# Urban Burguer — SPEC

Ordering web app for the "Urban Burguer" hamburgueria (pt-BR), built from the user's menu image.

## Flows
- `/` — digital menu (8 categories, 25 items, static catalogue in `backend/lib/menu.py`). Click item → dialog with quantity, adicionais (only for burgers/combos, `allows_addons`), observation → cart (localStorage `urban-cart-v1`). Sticky cart bar → Sheet: cart → checkout (nome, telefone, rua, número, bairro, complemento, pagamento pix/crédito/débito/dinheiro + troco, observações) → POST /api/orders → opens WhatsApp wa.me/5586998166138 with formatted message and navigates to `/pedido/:id`.
- `/pedido/:id` — order tracking (polls every 10s), WhatsApp resend button.
- `/admin` — PIN gate (ADMIN_PIN in backend/.env, default 1234). httpOnly cookie `ub_admin` (sessions in `admin_sessions`). Tabs:
  - Pedidos: list with status filter, 1-click status change, today stats (America/Fortaleza tz). Sound alert (WebAudio) + toast when a new `recebido` order appears (polls 8s; toggle "Som ligado/desligado" in localStorage `urban-admin-sound`).
  - Cardápio: toggle Disponível/Esgotado per item; edit dialog (name, price, badge, description, photo URL or upload → stored in `images` collection, served at /api/images/{id}).
  - Horários: per-weekday enabled/open/close (HH:MM, overnight if close<=open) + "Fechar loja agora" (force_closed). Stored in `settings` {id:"store"}; default every day 10:00–23:59.
- Menu page shows open/closed banner (GET /api/store/status); sold-out items greyed and unclickable; checkout disabled when closed. POST /orders returns 403 when closed, 400 when an item is esgotado.
- Menu items live in Mongo `menu_items` (seeded from `lib/menu.py` at startup only if empty). Addons remain static in lib/menu.py.

## API (all under /api)
- GET /menu → {categories, items, addons}
- POST /orders (OrderCreate) → Order (server prices items + addons; code `UB-XXXX`; 400 on invalid item/addon)
- GET /orders/{id} → Order | 404
- POST /admin/login {pin} → sets cookie | 401; POST /admin/logout; GET /admin/me
- GET /admin/orders?status=; PATCH /admin/orders/{id}/status {status}; GET /admin/stats (all 401 without cookie)
- PATCH /admin/menu/items/{id} (MenuItemUpdate); POST /admin/images (multipart `file`) → {url}; GET /images/{id}
- GET /store/status; PUT /admin/store/settings (StoreSettings)

## Data
- `orders`: Order model (models/shop.py), status ∈ recebido|preparando|saiu_entrega|entregue|cancelado, `date` = local YYYY-MM-DD.
- Delivery fee not computed ("consulte no ato do pedido").
