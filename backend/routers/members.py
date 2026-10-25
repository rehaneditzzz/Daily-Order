from fastapi import APIRouter, HTTPException

from lib.db import db
from models.order import Member, MemberCreate

router = APIRouter()


@router.get("/members", response_model=list[Member])
async def list_members():
    docs = await db.members.find({}, {"_id": 0}).sort("created_at", 1).to_list(500)
    return [Member(**d) for d in docs]


@router.post("/members", response_model=Member)
async def create_member(body: MemberCreate):
    name = body.name.strip()
    if await db.members.find_one({"name": name}):
        raise HTTPException(status_code=400, detail="Member with this name already exists")
    m = Member(name=name, role=body.role)
    await db.members.insert_one(m.model_dump())
    return m


@router.delete("/members/{member_id}")
async def delete_member(member_id: str):
    res = await db.members.delete_one({"id": member_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"ok": True}
