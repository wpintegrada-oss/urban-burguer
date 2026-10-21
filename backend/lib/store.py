"""Opening hours (America/Fortaleza) — the server decides whether the store is open."""

from datetime import datetime
from zoneinfo import ZoneInfo

from lib.db import db
from lib.menu import ITEMS

TZ = "America/Fortaleza"
DAY_NAMES = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"]
DEFAULT_SETTINGS = {
    "force_closed": False,
    "hours": [{"day": d, "enabled": True, "open": "10:00", "close": "23:59"} for d in range(7)],
}


def _min(hhmm: str) -> int:
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)


async def get_settings() -> dict:
    doc = await db.settings.find_one({"id": "store"}, {"_id": 0, "id": 0})
    return doc or DEFAULT_SETTINGS


def compute_status(settings: dict, now: datetime | None = None) -> tuple[bool, str]:
    now = now or datetime.now(ZoneInfo(TZ))
    hours = {h["day"]: h for h in settings["hours"]}
    if settings.get("force_closed"):
        return False, "Fechado temporariamente. Voltamos em breve!"
    wd, cur = now.weekday(), now.hour * 60 + now.minute
    today, yday = hours[wd], hours[(wd - 1) % 7]

    # overnight shift from yesterday still running
    if yday["enabled"] and _min(yday["close"]) <= _min(yday["open"]) and cur < _min(yday["close"]):
        return True, f"Aberto agora · fecha às {yday['close']}"
    if today["enabled"]:
        o, c = _min(today["open"]), _min(today["close"])
        if (o < c and o <= cur < c) or (c <= o and cur >= o):
            return True, f"Aberto agora · fecha às {today['close']}"
        if cur < o:
            return False, f"Fechado agora · abrimos hoje às {today['open']}"
    for i in range(1, 8):
        d = hours[(wd + i) % 7]
        if d["enabled"]:
            when = "amanhã" if i == 1 else DAY_NAMES[(wd + i) % 7]
            return False, f"Fechado agora · abrimos {when} às {d['open']}"
    return False, "Fechado no momento."


async def seed_menu() -> None:
    """Insert the catalogue once; afterwards the admin edits it in Mongo."""
    if await db.menu_items.count_documents({}) == 0:
        docs = [{**item, "available": True, "position": i} for i, item in enumerate(ITEMS)]
        await db.menu_items.insert_many(docs)
