from fastapi import HTTPException, Request

from lib.db import db

COOKIE = "ub_admin"


async def is_admin(request: Request) -> bool:
    token = request.cookies.get(COOKIE)
    return bool(token and await db.admin_sessions.find_one({"token": token}))


async def require_admin(request: Request):
    if not await is_admin(request):
        raise HTTPException(401, "Não autorizado")
