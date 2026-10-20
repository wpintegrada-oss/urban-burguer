import os
import random
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response

from lib.dates import today_iso
from lib.db import db
from lib.menu import ADDONS, ADDONS_BY_ID, CATEGORIES, ITEMS, ITEMS_BY_ID
from models.shop import (
    AdminLogin, AdminMe, AdminStats, Menu, Order, OrderCreate, OrderLine, StatusUpdate, Addon,
)

router = APIRouter()
TZ = "America/Fortaleza"
COOKIE = "ub_admin"


def _utc(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _order(doc: dict) -> Order:
    doc["created_at"] = _utc(doc["created_at"])
    doc["updated_at"] = _utc(doc["updated_at"])
    return Order(**doc)


@router.get("/menu", response_model=Menu)
async def get_menu():
    return Menu(categories=CATEGORIES, items=ITEMS, addons=ADDONS)


@router.post("/orders", response_model=Order)
async def create_order(body: OrderCreate):
    lines: list[OrderLine] = []
    for it in body.items:
        item = ITEMS_BY_ID.get(it.item_id)
        if not item:
            raise HTTPException(400, f"Item inválido: {it.item_id}")
        addons = []
        if it.addon_ids:
            if not item["allows_addons"]:
                raise HTTPException(400, f"{item['name']} não aceita adicionais")
            for aid in dict.fromkeys(it.addon_ids):
                if aid not in ADDONS_BY_ID:
                    raise HTTPException(400, f"Adicional inválido: {aid}")
                addons.append(Addon(**ADDONS_BY_ID[aid]))
        unit = item["price"] + sum(a.price for a in addons)
        lines.append(OrderLine(item_id=item["id"], name=item["name"], quantity=it.quantity, unit_price=unit,
                               addons=addons, note=it.note.strip(), line_total=round(unit * it.quantity, 2)))
    total = round(sum(l.line_total for l in lines), 2)
    if body.payment_method == "dinheiro" and body.change_for is not None and body.change_for < total:
        raise HTTPException(400, "Valor do troco menor que o total")
    data = body.model_dump(exclude={"items"})
    order = Order(**data, code=f"UB-{random.randint(1000, 9999)}", items=lines, total=total, date=today_iso(TZ))
    await db.orders.insert_one(order.model_dump())
    return order


@router.get("/orders/{id}", response_model=Order)
async def get_order(id: str):
    doc = await db.orders.find_one({"id": id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Pedido não encontrado")
    return _order(doc)


# ---------------- admin ----------------
async def require_admin(request: Request):
    token = request.cookies.get(COOKIE)
    if not token or not await db.admin_sessions.find_one({"token": token}):
        raise HTTPException(401, "Não autorizado")


@router.post("/admin/login", response_model=AdminMe)
async def admin_login(body: AdminLogin, response: Response):
    if not secrets.compare_digest(body.pin, os.environ.get("ADMIN_PIN", "1234")):
        raise HTTPException(401, "PIN incorreto")
    token = secrets.token_urlsafe(32)
    await db.admin_sessions.insert_one({"token": token, "created_at": datetime.now(timezone.utc)})
    response.set_cookie(COOKIE, token, httponly=True, samesite="lax", secure=True, max_age=60 * 60 * 24 * 7)
    return AdminMe(authenticated=True)


@router.post("/admin/logout", response_model=AdminMe)
async def admin_logout(request: Request, response: Response):
    token = request.cookies.get(COOKIE)
    if token:
        await db.admin_sessions.delete_one({"token": token})
    response.delete_cookie(COOKIE)
    return AdminMe(authenticated=False)


@router.get("/admin/me", response_model=AdminMe)
async def admin_me(request: Request):
    token = request.cookies.get(COOKIE)
    ok = bool(token and await db.admin_sessions.find_one({"token": token}))
    return AdminMe(authenticated=ok)


@router.get("/admin/orders", response_model=list[Order], dependencies=[Depends(require_admin)])
async def admin_orders(status: str | None = None):
    q = {"status": status} if status else {}
    docs = await db.orders.find(q, {"_id": 0}).sort("created_at", -1).to_list(300)
    return [_order(d) for d in docs]


@router.patch("/admin/orders/{id}/status", response_model=Order, dependencies=[Depends(require_admin)])
async def admin_update_status(id: str, body: StatusUpdate):
    res = await db.orders.find_one_and_update(
        {"id": id}, {"$set": {"status": body.status, "updated_at": datetime.now(timezone.utc)}},
        projection={"_id": 0}, return_document=True,
    )
    if not res:
        raise HTTPException(404, "Pedido não encontrado")
    return _order(res)


@router.get("/admin/stats", response_model=AdminStats, dependencies=[Depends(require_admin)])
async def admin_stats():
    today = today_iso(TZ)
    docs = await db.orders.find({"date": today}, {"_id": 0, "status": 1, "total": 1}).to_list(5000)
    by_status: dict[str, int] = {}
    for d in docs:
        by_status[d["status"]] = by_status.get(d["status"], 0) + 1
    revenue = round(sum(d["total"] for d in docs if d["status"] != "cancelado"), 2)
    return AdminStats(date=today, orders_today=len(docs), revenue_today=revenue, by_status=by_status)
