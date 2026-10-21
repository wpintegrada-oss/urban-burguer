import uuid

from bson import Binary
from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile

from lib.auth import require_admin
from lib.db import db
from lib.menu import ADDONS, CATEGORIES
from lib.store import compute_status, get_settings
from models.shop import ImageUploaded, Menu, MenuItem, MenuItemUpdate, StoreSettings, StoreStatus

router = APIRouter()
MAX_IMAGE = 4 * 1024 * 1024


async def all_items() -> list[MenuItem]:
    docs = await db.menu_items.find({}, {"_id": 0}).sort("position", 1).to_list(500)
    return [MenuItem(**d) for d in docs]


@router.get("/menu", response_model=Menu)
async def get_menu():
    return Menu(categories=CATEGORIES, items=await all_items(), addons=ADDONS)


@router.patch("/admin/menu/items/{id}", response_model=MenuItem, dependencies=[Depends(require_admin)])
async def update_item(id: str, body: MenuItemUpdate):
    changes = body.model_dump(exclude_unset=True)
    if "badge" in changes:
        changes["badge"] = (changes["badge"] or "").strip() or None
    for k in ("name", "description", "image"):
        if changes.get(k) is not None:
            changes[k] = changes[k].strip()
    changes = {k: v for k, v in changes.items() if v is not None or k == "badge"}
    if not changes:
        raise HTTPException(400, "Nada para atualizar")
    doc = await db.menu_items.find_one_and_update(
        {"id": id}, {"$set": changes}, projection={"_id": 0}, return_document=True
    )
    if not doc:
        raise HTTPException(404, "Item não encontrado")
    return MenuItem(**doc)


@router.post("/admin/images", response_model=ImageUploaded, dependencies=[Depends(require_admin)])
async def upload_image(file: UploadFile = File(...)):
    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(400, "Envie um arquivo de imagem")
    data = await file.read()
    if len(data) > MAX_IMAGE:
        raise HTTPException(400, "Imagem maior que 4 MB")
    image_id = str(uuid.uuid4())
    await db.images.insert_one({"id": image_id, "content_type": file.content_type, "data": Binary(data)})
    return ImageUploaded(url=f"/api/images/{image_id}")


@router.get("/images/{id}")
async def get_image(id: str):
    doc = await db.images.find_one({"id": id})
    if not doc:
        raise HTTPException(404, "Imagem não encontrada")
    return Response(bytes(doc["data"]), media_type=doc["content_type"],
                    headers={"Cache-Control": "public, max-age=31536000, immutable"})


# ---------------- store hours ----------------
@router.get("/store/status", response_model=StoreStatus)
async def store_status():
    s = await get_settings()
    is_open, msg = compute_status(s)
    return StoreStatus(is_open=is_open, message=msg, force_closed=s.get("force_closed", False), hours=s["hours"])


@router.put("/admin/store/settings", response_model=StoreStatus, dependencies=[Depends(require_admin)])
async def save_settings(body: StoreSettings):
    if sorted(h.day for h in body.hours) != list(range(7)):
        raise HTTPException(400, "Informe os 7 dias da semana")
    data = body.model_dump()
    data["hours"] = sorted(data["hours"], key=lambda h: h["day"])
    await db.settings.update_one({"id": "store"}, {"$set": data}, upsert=True)
    is_open, msg = compute_status(data)
    return StoreStatus(is_open=is_open, message=msg, force_closed=data["force_closed"], hours=data["hours"])
