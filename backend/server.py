import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
from lib.db import client, db, ensure_indexes
from models.order import Member
from routers import members, orders

DEFAULT_MEMBERS = [
    ("Boss", "Admin"), ("Rahul Sharma", "Sales"), ("Sneha Patel", "Sales"), ("Amit Verma", "Sales"),
    ("Vikram Malhotra", "Packing"), ("Priya Nair", "Billing"), ("Rajesh Gupta", "Procurement"),
    ("Neha Singh", "Sales"), ("Pooja Reddy", "Tracking"), ("Deepak Joshi", "Packing"),
]


async def seed_members():
    # Fresh database (e.g. new MongoDB Atlas cluster): create a starter team once.
    try:
        if await db.members.count_documents({}) == 0:
            await db.members.insert_many([Member(name=n, role=r).model_dump() for n, r in DEFAULT_MEMBERS])
    except Exception as exc:
        logging.getLogger(__name__).error("seed_members failed: %s", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.index_task = asyncio.create_task(ensure_indexes())
    app.state.seed_task = asyncio.create_task(seed_members())
    yield
    client.close()


app = FastAPI(lifespan=lifespan)

api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "Order desk API"}


api_router.include_router(orders.router)
api_router.include_router(members.router)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
