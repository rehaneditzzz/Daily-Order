import uuid
from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, Field

Availability = Literal["available", "need_market", "unavailable"]
Speed = Literal["express", "normal"]


def new_id() -> str:
    return str(uuid.uuid4())


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class Item(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str
    qty: float = 1
    unit: str = ""
    price: float = 0
    hts_code: str = ""
    availability: Availability = "available"
    note: str = ""


class Shipment(BaseModel):
    id: str = Field(default_factory=new_id)
    label: str = "Parcel"
    recipient: str = ""
    address: str = ""
    country: str = ""
    speed: Speed = "normal"
    courier: str = ""
    tracking_ids: list[str] = []
    tracking_notes: str = ""
    photos: list[str] = []
    allocations: dict[str, float] = {}
    bill_ready: bool = False
    packed: bool = False
    tracking_added: bool = False
    delivered: bool = False
    created_at: str = Field(default_factory=now_iso)


class Activity(BaseModel):
    at: str = Field(default_factory=now_iso)
    actor: str = "Team"
    text: str


class Order(BaseModel):
    id: str = Field(default_factory=new_id)
    order_no: int
    client_name: str
    client_phone: str = ""
    client_email: str = ""
    country: str = ""
    currency: str = "USD"
    assigned_to: str = ""
    notes: str = ""
    payment_received: bool = False
    payment_amount: float = 0
    payment_method: str = ""
    on_hold: bool = False
    hold_reason: str = ""
    show_hts: bool = False
    items: list[Item] = []
    shipments: list[Shipment] = []
    activity: list[Activity] = []
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)
    stage: str = ""  # computed on every response, never trusted from storage


class ItemIn(BaseModel):
    name: str = Field(min_length=1)
    qty: float = 1
    unit: str = ""
    price: float = 0
    hts_code: str = ""
    availability: Availability = "available"
    note: str = ""
    actor: str = ""


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    qty: Optional[float] = None
    unit: Optional[str] = None
    price: Optional[float] = None
    hts_code: Optional[str] = None
    availability: Optional[Availability] = None
    note: Optional[str] = None
    actor: str = ""


class OrderCreate(BaseModel):
    client_name: str = Field(min_length=1)
    client_phone: str = ""
    client_email: str = ""
    country: str = ""
    currency: str = "USD"
    assigned_to: str = ""
    notes: str = ""
    payment_received: bool = False
    payment_amount: float = 0
    payment_method: str = ""
    address: str = ""
    shipment_count: int = Field(default=1, ge=1, le=10)
    speed: Speed = "normal"
    items: list[ItemIn] = []
    actor: str = ""


class OrderUpdate(BaseModel):
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    client_email: Optional[str] = None
    country: Optional[str] = None
    currency: Optional[str] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    payment_received: Optional[bool] = None
    payment_amount: Optional[float] = None
    payment_method: Optional[str] = None
    on_hold: Optional[bool] = None
    hold_reason: Optional[str] = None
    show_hts: Optional[bool] = None
    actor: str = ""


class ShipmentCreate(BaseModel):
    recipient: str = ""
    address: str = ""
    country: str = ""
    speed: Speed = "normal"
    actor: str = ""


class ShipmentUpdate(BaseModel):
    label: Optional[str] = None
    recipient: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    speed: Optional[Speed] = None
    courier: Optional[str] = None
    tracking_ids: Optional[list[str]] = None
    tracking_notes: Optional[str] = None
    allocations: Optional[dict[str, float]] = None
    bill_ready: Optional[bool] = None
    packed: Optional[bool] = None
    tracking_added: Optional[bool] = None
    delivered: Optional[bool] = None
    actor: str = ""


class DashboardStats(BaseModel):
    total_orders: int
    open_orders: int
    by_stage: dict[str, int]
    pending_items: int
    bill_pending: int
    packing_due: int
    tracking_needed: int
    express_open: int
    by_country: dict[str, int]
    recent: list[Order]


class ProcurementEntry(BaseModel):
    order_id: str
    order_no: int
    client_name: str
    assigned_to: str
    item_id: str
    qty: float
    unit: str
    availability: Availability
    note: str


class ProcurementGroup(BaseModel):
    name: str
    unit: str
    total_qty: float
    need_market: int
    unavailable: int
    entries: list[ProcurementEntry]


class MarkAvailable(BaseModel):
    name: str
    actor: str = ""


class Member(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str
    role: str = "Staff"
    created_at: str = Field(default_factory=now_iso)


class MemberCreate(BaseModel):
    name: str = Field(min_length=1)
    role: str = "Staff"
