import uuid
from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, Field

PaymentMethod = Literal["pix", "cartao_credito", "cartao_debito", "dinheiro"]
OrderStatus = Literal["recebido", "preparando", "saiu_entrega", "entregue", "cancelado"]


class Category(BaseModel):
    id: str
    name: str


class Addon(BaseModel):
    id: str
    name: str
    price: float


class MenuItem(BaseModel):
    id: str
    category_id: str
    name: str
    price: float
    description: str
    image: str
    allows_addons: bool
    badge: Optional[str] = None


class Menu(BaseModel):
    categories: list[Category]
    items: list[MenuItem]
    addons: list[Addon]


class OrderItemIn(BaseModel):
    item_id: str
    quantity: int = Field(ge=1, le=50)
    addon_ids: list[str] = []
    note: str = Field(default="", max_length=200)


class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=80)
    phone: str = Field(min_length=8, max_length=20)
    street: str = Field(min_length=2, max_length=120)
    number: str = Field(min_length=1, max_length=20)
    neighborhood: str = Field(min_length=2, max_length=80)
    complement: str = Field(default="", max_length=120)
    payment_method: PaymentMethod
    change_for: Optional[float] = None
    notes: str = Field(default="", max_length=300)
    items: list[OrderItemIn] = Field(min_length=1)


class OrderLine(BaseModel):
    item_id: str
    name: str
    quantity: int
    unit_price: float
    addons: list[Addon]
    note: str
    line_total: float


class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    customer_name: str
    phone: str
    street: str
    number: str
    neighborhood: str
    complement: str
    payment_method: PaymentMethod
    change_for: Optional[float] = None
    notes: str
    items: list[OrderLine]
    total: float
    status: OrderStatus = "recebido"
    date: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusUpdate(BaseModel):
    status: OrderStatus


class AdminLogin(BaseModel):
    pin: str


class AdminMe(BaseModel):
    authenticated: bool


class AdminStats(BaseModel):
    date: str
    orders_today: int
    revenue_today: float
    by_status: dict[str, int]
