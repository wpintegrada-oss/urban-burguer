# Urban Burguer — SPEC

Ordering web app for the "Urban Burguer" hamburgueria (pt-BR), built from the user's menu image.

## Flows
- `/` — digital menu (8 categories, 25 items, static catalogue in `backend/lib/menu.py`). Click item → dialog with quantity, adicionais (only for burgers/combos, `allows_addons`), observation → cart (localStorage `urban-cart-v1`). Sticky cart bar → Sheet: cart → checkout (nome, telefone, rua, número, bairro, complemento, pagamento pix/crédito/débito/dinheiro + troco, observações) → POST /api/orders → opens WhatsApp wa.me/5586998166138 with formatted message and navigates to `/pedido/:id`.
- `/pedido/:id` — order tracking (polls every 10s), WhatsApp resend button.
- `/admin` — PIN gate (ADMIN_PIN in backend/.env, default 1234). httpOnly cookie `ub_admin` (sessions in `admin_sessions`). Lists orders with status filter, 1-click status change, today stats (America/Fortaleza tz).

## API (all under /api)
- GET /menu → {categories, items, addons}
- POST /orders (OrderCreate) → Order (server prices items + addons; code `UB-XXXX`; 400 on invalid item/addon)
- GET /orders/{id} → Order | 404
- POST /admin/login {pin} → sets cookie | 401; POST /admin/logout; GET /admin/me
- GET /admin/orders?status=; PATCH /admin/orders/{id}/status {status}; GET /admin/stats (all 401 without cookie)

## Data
- `orders`: Order model (models/shop.py), status ∈ recebido|preparando|saiu_entrega|entregue|cancelado, `date` = local YYYY-MM-DD.
- Delivery fee not computed ("consulte no ato do pedido").
