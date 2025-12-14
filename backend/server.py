from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Header
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
import aiohttp
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Ad categories with subcategories
AD_CATEGORIES = {
    "jobs": {
        "name": "Jobs",
        "subcategories": ["Full-time", "Part-time", "Freelance", "Internships", "Temporary", "Other"]
    },
    "real_estate_renting": {
        "name": "Real Estate Renting",
        "subcategories": ["Rooms", "Flats", "Houses", "Holiday Rentals", "Offices", "Parking Places", "Garages", "Other"]
    },
    "real_estate_selling": {
        "name": "Real Estate Selling",
        "subcategories": ["Flats", "Houses", "Offices", "Parking Places", "Garages", "Land", "Commercial", "Other"]
    },
    "vehicles": {
        "name": "Vehicles",
        "subcategories": ["Cars", "Trucks", "Boats", "Jet Ski", "Motorcycles", "Bicycles", "Accessories", "Caravans", "Other"]
    },
    "sales_of_products": {
        "name": "Sales of Products",
        "subcategories": ["Electronics", "Furniture", "Clothing", "Books", "Home & Garden", "Sports & Outdoors", "Toys & Games", "Other"]
    },
    "services": {
        "name": "Services",
        "subcategories": ["Home Services", "Professional Services", "Tutoring", "Beauty & Wellness", "Event Services", "Repair Services", "Other"]
    }
}

# Helper function to get user from session
async def get_current_user(request: Request, authorization: Optional[str] = Header(None)):
    session_token = None
    
    # Try cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token and authorization:
        if authorization.startswith("Bearer "):
            session_token = authorization.replace("Bearer ", "")
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session in database
    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user_doc

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime

class UserRegistration(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class Ad(BaseModel):
    model_config = ConfigDict(extra="ignore")
    ad_id: str
    user_id: str
    title: str
    description: str
    category: str
    subcategory: Optional[str] = None
    price: float
    images: List[str]
    is_paid: bool
    status: str
    created_at: datetime
    expires_at: datetime

class AdCreate(BaseModel):
    title: str
    description: str
    category: str
    subcategory: Optional[str] = None
    price: float
    images: List[str]
    is_paid: bool = False

class AdUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    price: Optional[float] = None
    images: Optional[List[str]] = None

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    transaction_id: str
    user_id: str
    ad_id: Optional[str] = None
    session_id: str
    amount: float
    currency: str
    payment_status: str
    created_at: datetime

# Auth endpoints
@api_router.post("/auth/register")
async def register(user_data: UserRegistration):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    password_hash = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt())
    
    # Create user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": password_hash.decode('utf-8'),
        "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.user_sessions.insert_one(session_doc)
    
    return {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "session_token": session_token
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    # Find user
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check password
    if not bcrypt.checkpw(credentials.password.encode('utf-8'), user_doc["password_hash"].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session_doc = {
        "user_id": user_doc["user_id"],
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.user_sessions.insert_one(session_doc)
    
    return {
        "user_id": user_doc["user_id"],
        "email": user_doc["email"],
        "name": user_doc["name"],
        "picture": user_doc.get("picture"),
        "session_token": session_token
    }

@api_router.post("/auth/google/session")
async def google_session(request: Request):
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Call Emergent Auth API
    async with aiohttp.ClientSession() as session:
        async with session.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        ) as response:
            if response.status != 200:
                raise HTTPException(status_code=400, detail="Invalid session")
            
            data = await response.json()
    
    # Check if user exists
    user_doc = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    
    if not user_doc:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": data["email"],
            "name": data["name"],
            "picture": data.get("picture"),
            "password_hash": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    else:
        user_id = user_doc["user_id"]
        # Update user info if needed
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": data["name"], "picture": data.get("picture")}}
        )
    
    # Store session
    session_token = data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    # Delete old sessions for this user
    await db.user_sessions.delete_many({"user_id": user_id})
    
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.user_sessions.insert_one(session_doc)
    
    # Return user data
    user_response = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {
        "user_id": user_response["user_id"],
        "email": user_response["email"],
        "name": user_response["name"],
        "picture": user_response.get("picture"),
        "session_token": session_token
    }

@api_router.get("/auth/me")
async def get_me(request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, authorization: Optional[str] = Header(None)):
    session_token = request.cookies.get("session_token")
    
    if not session_token and authorization:
        if authorization.startswith("Bearer "):
            session_token = authorization.replace("Bearer ", "")
    
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    return {"message": "Logged out successfully"}

# Ad endpoints
@api_router.get("/ads")
async def get_ads(category: Optional[str] = None, subcategory: Optional[str] = None, search: Optional[str] = None, limit: int = 20):
    query = {"status": "active"}
    
    if category and category in AD_CATEGORIES:
        query["category"] = category
    
    if subcategory:
        query["subcategory"] = subcategory
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    ads = await db.ads.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Convert datetime strings
    for ad in ads:
        if isinstance(ad.get("created_at"), str):
            ad["created_at"] = datetime.fromisoformat(ad["created_at"])
        if isinstance(ad.get("expires_at"), str):
            ad["expires_at"] = datetime.fromisoformat(ad["expires_at"])
    
    return ads

@api_router.get("/ads/{ad_id}")
async def get_ad(ad_id: str):
    ad = await db.ads.find_one({"ad_id": ad_id}, {"_id": 0})
    
    if not ad:
        raise HTTPException(status_code=404, detail="Ad not found")
    
    # Convert datetime strings
    if isinstance(ad.get("created_at"), str):
        ad["created_at"] = datetime.fromisoformat(ad["created_at"])
    if isinstance(ad.get("expires_at"), str):
        ad["expires_at"] = datetime.fromisoformat(ad["expires_at"])
    
    return ad

@api_router.post("/ads")
async def create_ad(ad_data: AdCreate, request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    
    # Validate category
    if ad_data.category not in AD_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    # Validate subcategory
    if ad_data.subcategory and ad_data.subcategory not in AD_CATEGORIES[ad_data.category]["subcategories"]:
        raise HTTPException(status_code=400, detail="Invalid subcategory for selected category")
    
    # Validate free ad constraints
    if not ad_data.is_paid:
        if len(ad_data.images) > 5:
            raise HTTPException(status_code=400, detail="Free ads are limited to 5 images")
    
    # Create ad
    ad_id = f"ad_{uuid.uuid4().hex[:12]}"
    created_at = datetime.now(timezone.utc)
    expires_at = created_at + timedelta(weeks=3)
    
    ad_doc = {
        "ad_id": ad_id,
        "user_id": user["user_id"],
        "title": ad_data.title,
        "description": ad_data.description,
        "category": ad_data.category,
        "subcategory": ad_data.subcategory,
        "price": ad_data.price,
        "images": ad_data.images,
        "is_paid": ad_data.is_paid,
        "status": "active",
        "created_at": created_at.isoformat(),
        "expires_at": expires_at.isoformat()
    }
    
    await db.ads.insert_one(ad_doc)
    
    # Get the inserted ad without MongoDB _id field
    inserted_ad = await db.ads.find_one({"ad_id": ad_id}, {"_id": 0})
    
    # Convert datetime strings back to datetime objects for response
    if isinstance(inserted_ad.get("created_at"), str):
        inserted_ad["created_at"] = datetime.fromisoformat(inserted_ad["created_at"])
    if isinstance(inserted_ad.get("expires_at"), str):
        inserted_ad["expires_at"] = datetime.fromisoformat(inserted_ad["expires_at"])
    
    return inserted_ad

@api_router.put("/ads/{ad_id}")
async def update_ad(ad_id: str, ad_data: AdUpdate, request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    
    # Find ad
    ad = await db.ads.find_one({"ad_id": ad_id}, {"_id": 0})
    
    if not ad:
        raise HTTPException(status_code=404, detail="Ad not found")
    
    # Check ownership
    if ad["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Prepare update
    update_data = {}
    if ad_data.title:
        update_data["title"] = ad_data.title
    if ad_data.description:
        update_data["description"] = ad_data.description
    if ad_data.category and ad_data.category in AD_CATEGORIES:
        update_data["category"] = ad_data.category
    if ad_data.subcategory:
        # Validate subcategory against category
        category = ad_data.category if ad_data.category else ad["category"]
        if ad_data.subcategory not in AD_CATEGORIES[category]["subcategories"]:
            raise HTTPException(status_code=400, detail="Invalid subcategory for selected category")
        update_data["subcategory"] = ad_data.subcategory
    if ad_data.price is not None:
        update_data["price"] = ad_data.price
    if ad_data.images is not None:
        # Validate free ad constraints
        if not ad["is_paid"] and len(ad_data.images) > 5:
            raise HTTPException(status_code=400, detail="Free ads are limited to 5 images")
        update_data["images"] = ad_data.images
    
    if update_data:
        await db.ads.update_one({"ad_id": ad_id}, {"$set": update_data})
    
    # Get updated ad
    updated_ad = await db.ads.find_one({"ad_id": ad_id}, {"_id": 0})
    
    if isinstance(updated_ad.get("created_at"), str):
        updated_ad["created_at"] = datetime.fromisoformat(updated_ad["created_at"])
    if isinstance(updated_ad.get("expires_at"), str):
        updated_ad["expires_at"] = datetime.fromisoformat(updated_ad["expires_at"])
    
    return updated_ad

@api_router.delete("/ads/{ad_id}")
async def delete_ad(ad_id: str, request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    
    # Find ad
    ad = await db.ads.find_one({"ad_id": ad_id}, {"_id": 0})
    
    if not ad:
        raise HTTPException(status_code=404, detail="Ad not found")
    
    # Check ownership
    if ad["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Soft delete
    await db.ads.update_one({"ad_id": ad_id}, {"$set": {"status": "deleted"}})
    
    return {"message": "Ad deleted successfully"}

@api_router.get("/my-ads")
async def get_my_ads(request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    
    ads = await db.ads.find(
        {"user_id": user["user_id"], "status": {"$ne": "deleted"}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    for ad in ads:
        if isinstance(ad.get("created_at"), str):
            ad["created_at"] = datetime.fromisoformat(ad["created_at"])
        if isinstance(ad.get("expires_at"), str):
            ad["expires_at"] = datetime.fromisoformat(ad["expires_at"])
    
    return ads

# Payment endpoints
@api_router.post("/payment/create-session")
async def create_payment_session(request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    body = await request.json()
    
    ad_id = body.get("ad_id")
    origin_url = body.get("origin_url")
    
    if not origin_url:
        raise HTTPException(status_code=400, detail="Origin URL required")
    
    # Payment amount for premium ad (fixed price)
    amount = 10.00
    currency = "usd"
    
    # Create success and cancel URLs
    success_url = f"{origin_url}/payment-success?session_id={{{{CHECKOUT_SESSION_ID}}}}"
    cancel_url = f"{origin_url}/post-ad"
    
    # Initialize Stripe
    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    host_url = origin_url
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    # Create checkout session
    checkout_request = CheckoutSessionRequest(
        amount=amount,
        currency=currency,
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user["user_id"],
            "ad_id": ad_id if ad_id else "",
            "type": "premium_ad"
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction_id = f"txn_{uuid.uuid4().hex[:12]}"
    transaction_doc = {
        "transaction_id": transaction_id,
        "user_id": user["user_id"],
        "ad_id": ad_id,
        "session_id": session.session_id,
        "amount": amount,
        "currency": currency,
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.payment_transactions.insert_one(transaction_doc)
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payment/status/{session_id}")
async def get_payment_status(session_id: str, request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    
    # Find transaction
    transaction = await db.payment_transactions.find_one(
        {"session_id": session_id, "user_id": user["user_id"]},
        {"_id": 0}
    )
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # If already processed, return status
    if transaction["payment_status"] in ["paid", "complete"]:
        return transaction
    
    # Check with Stripe
    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    origin_url = str(request.base_url).rstrip("/")
    webhook_url = f"{origin_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    status_response = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction
    update_data = {
        "payment_status": status_response.payment_status,
        "status": status_response.status
    }
    
    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": update_data}
    )
    
    # If paid and ad_id exists, upgrade ad to premium
    if status_response.payment_status == "paid" and transaction.get("ad_id"):
        await db.ads.update_one(
            {"ad_id": transaction["ad_id"]},
            {"$set": {"is_paid": True}}
        )
    
    # Get updated transaction
    updated_transaction = await db.payment_transactions.find_one(
        {"session_id": session_id},
        {"_id": 0}
    )
    
    return updated_transaction

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    origin_url = str(request.base_url).rstrip("/")
    webhook_url = f"{origin_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update transaction based on webhook
        if webhook_response.event_type == "checkout.session.completed":
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {
                    "payment_status": webhook_response.payment_status,
                    "status": "complete"
                }}
            )
            
            # Upgrade ad to premium if applicable
            transaction = await db.payment_transactions.find_one(
                {"session_id": webhook_response.session_id},
                {"_id": 0}
            )
            
            if transaction and transaction.get("ad_id"):
                await db.ads.update_one(
                    {"ad_id": transaction["ad_id"]},
                    {"$set": {"is_paid": True}}
                )
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/categories")
async def get_categories():
    categories = []
    for cat_id, cat_data in AD_CATEGORIES.items():
        categories.append({
            "id": cat_id,
            "name": cat_data["name"],
            "subcategories": cat_data["subcategories"]
        })
    return categories

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
