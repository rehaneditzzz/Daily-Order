"""Idempotent seed: team members + a few sample orders (only if the collections are empty)."""
import asyncio

from lib.db import db, ensure_indexes
from models.order import Activity, Item, Member, Order, Shipment

MEMBERS = [
    ("Boss", "Admin"), ("Rahul Sharma", "Sales"), ("Sneha Patel", "Sales"), ("Amit Verma", "Sales"),
    ("Vikram Malhotra", "Packing"), ("Priya Nair", "Billing"), ("Rajesh Gupta", "Procurement"),
    ("Neha Singh", "Sales"), ("Pooja Reddy", "Tracking"), ("Deepak Joshi", "Packing"),
]


def items(rows):
    return [Item(name=n, qty=q, unit=u, hts_code=h, availability=a) for n, q, u, h, a in rows]


def split(its, n):
    allocs = [dict() for _ in range(n)]
    for it in its:
        base, rem = divmod(int(it.qty), n)
        for k in range(n):
            share = base + (1 if k < rem else 0)
            if share:
                allocs[k][it.id] = share
    return allocs


async def main():
    await ensure_indexes()
    if await db.members.count_documents({}) == 0:
        await db.members.insert_many([Member(name=n, role=r).model_dump() for n, r in MEMBERS])
        print("seeded members")

    if await db.orders.count_documents({}) > 0:
        print("orders exist, skipping")
        return

    jason_items = items([
        ("Tretinoin Cream 0.025%", 10, "Tubes", "3004.90.92", "available"),
        ("Tretinoin Gel 0.025%", 10, "Tubes", "3004.90.92", "available"),
        ("Tretinoin Microsphere Gel 0.1%", 1, "Tube", "3004.90.92", "need_market"),
        ("Tadalafil (Cialis) 10mg", 1, "Box", "3004.90.92", "available"),
        ("Minoxidil + Finasteride 5mg + 1mg", 1, "Box", "3004.90.92", "available"),
        ("Lemborexant 5mg", 4, "Box", "3004.90.92", "unavailable"),
        ("Telmisartan 80mg", 1, "Box", "3004.90.92", "available"),
        ("Empagliflozin 25mg", 2, "Box", "3004.90.92", "available"),
        ("Albuterol Inhaler 100mcg", 1, "Unit", "3004.90.92", "available"),
    ])
    addr = "Jason Plagens\n11690 Akins rd\nNorth Royalton, OH 44133"
    a = split(jason_items, 2)
    jason = Order(
        order_no=1001, client_name="Jason Plagens", country="USA", currency="USD", assigned_to="Rahul Sharma",
        payment_received=True, payment_amount=640, payment_method="PayPal",
        items=jason_items,
        shipments=[
            Shipment(label="Parcel 1", recipient="Jason Plagens", address=addr, country="USA", speed="express", allocations=a[0], bill_ready=True),
            Shipment(label="Parcel 2", recipient="Jason Plagens", address=addr, country="USA", speed="normal", allocations=a[1]),
        ],
        activity=[Activity(actor="Rahul Sharma", text="Created order with 9 item(s) and 2 parcel(s)")],
    )

    uk_items = items([
        ("Modafinil 200mg", 10, "Strips", "3004.90.92", "available"),
        ("Careprost 0.03%", 3, "Bottles", "3004.90.92", "available"),
    ])
    uk = Order(
        order_no=1002, client_name="Emily Clarke", country="UK", currency="GBP", assigned_to="Sneha Patel",
        payment_received=True, payment_amount=210, payment_method="Wise", items=uk_items,
        shipments=[Shipment(label="Parcel 1", recipient="Emily Clarke", address="14 Baker Street\nLondon NW1 6XE",
                            country="UK", speed="normal", allocations={i.id: i.qty for i in uk_items},
                            bill_ready=True, packed=True, tracking_added=True, courier="India Post EMS",
                            tracking_ids=["EM123456789IN"])],
        activity=[Activity(actor="Sneha Patel", text="Created order with 2 item(s) and 1 parcel(s)")],
    )

    au_items = items([
        ("Ivermectin 12mg", 5, "Strips", "3004.90.92", "available"),
        ("Azelaic Acid Gel 15%", 2, "Tubes", "3004.90.92", "available"),
    ])
    au = Order(
        order_no=1003, client_name="Liam Turner", country="Australia", currency="AUD", assigned_to="Amit Verma",
        payment_received=False, payment_amount=150, items=au_items,
        shipments=[Shipment(label="Parcel 1", recipient="Liam Turner", address="22 George St\nSydney NSW 2000",
                            country="Australia", speed="express", allocations={i.id: i.qty for i in au_items})],
        activity=[Activity(actor="Amit Verma", text="Created order with 2 item(s) and 1 parcel(s)")],
    )
    await db.orders.insert_many([o.model_dump() for o in (jason, uk, au)])
    await db.counters.update_one({"_id": "order_no"}, {"$set": {"value": 3}}, upsert=True)
    print("seeded orders")


if __name__ == "__main__":
    asyncio.run(main())
