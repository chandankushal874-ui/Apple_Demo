"""FastAPI backend for the Apple demo store."""
import os
import hmac
import hashlib
import json
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import engine, Base, get_db
from models import Product, Order, OrderItem, Contract
import seed

Base.metadata.create_all(bind=engine)
seed.seed()  # idempotent

app = FastAPI(title="Apple Demo Store API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Schemas ----------
class ProductOut(BaseModel):
    id: int
    name: str
    category: str
    price: float
    description: str
    image: str
    stock: int

    class Config:
        from_attributes = True


class CartItem(BaseModel):
    product_id: int
    quantity: int = 1


class CheckoutRequest(BaseModel):
    items: List[CartItem]


class ContractIn(BaseModel):
    company: str
    value: float
    status: str = "signed"


# ---------- Product endpoints ----------
@app.get("/api/products", response_model=List[ProductOut])
def list_products(category: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Product)
    if category:
        q = q.filter(Product.category == category)
    return q.all()


@app.get("/api/products/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).get(product_id)
    if not p:
        raise HTTPException(404, "Product not found")
    return p


# ---------- Checkout / Orders ----------
@app.post("/api/checkout")
def checkout(req: CheckoutRequest, db: Session = Depends(get_db)):
    if not req.items:
        raise HTTPException(400, "Cart is empty")
    order = Order(total=0.0, status="sold", created_at=datetime.utcnow())
    total = 0.0
    for item in req.items:
        prod = db.query(Product).get(item.product_id)
        if not prod:
            raise HTTPException(404, f"Product {item.product_id} not found")
        line = prod.price * item.quantity
        total += line
        if prod.stock >= item.quantity:
            prod.stock -= item.quantity
        order.items.append(OrderItem(
            product_id=prod.id, product_name=prod.name,
            quantity=item.quantity, price=prod.price,
        ))
    order.total = round(total, 2)
    db.add(order)
    db.commit()
    db.refresh(order)
    return {"order_id": order.id, "total": order.total, "status": order.status}


@app.post("/api/orders/{order_id}/ship")
def ship_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).get(order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    order.status = "shipped"
    db.commit()
    return {"order_id": order.id, "status": order.status}


# ---------- Contracts / Deals ----------
@app.get("/api/contracts")
def list_contracts(db: Session = Depends(get_db)):
    rows = db.query(Contract).order_by(Contract.signed_at.desc()).all()
    return [
        {
            "id": c.id, "company": c.company, "value": c.value,
            "status": c.status, "signed_at": c.signed_at.isoformat(),
        }
        for c in rows
    ]


@app.post("/api/contracts")
def create_contract(payload: ContractIn, db: Session = Depends(get_db)):
    c = Contract(company=payload.company, value=payload.value, status=payload.status)
    db.add(c)
    db.commit()
    db.refresh(c)
    return {"id": c.id, "company": c.company, "value": c.value, "status": c.status}


# ---------- Analytics ----------
@app.get("/api/analytics")
def analytics(db: Session = Depends(get_db)):
    items_sold = db.query(func.coalesce(func.sum(OrderItem.quantity), 0)).join(Order).filter(Order.status == "sold").scalar()
    items_shipped = db.query(func.coalesce(func.sum(OrderItem.quantity), 0)).join(Order).filter(Order.status == "shipped").scalar()
    total_units = db.query(func.coalesce(func.sum(OrderItem.quantity), 0)).scalar()
    revenue = db.query(func.coalesce(func.sum(Order.total), 0.0)).scalar()
    deals = db.query(Contract).filter(Contract.status == "deal").count()
    contracts_signed = db.query(Contract).filter(Contract.status == "signed").count()
    contract_value = db.query(func.coalesce(func.sum(Contract.value), 0.0)).scalar()

    # units sold per category
    by_cat = (
        db.query(Product.category, func.sum(OrderItem.quantity))
        .join(OrderItem, OrderItem.product_id == Product.id)
        .group_by(Product.category)
        .all()
    )
    return {
        "items_sold": int(items_sold),
        "items_shipped": int(items_shipped),
        "total_units": int(total_units),
        "revenue": round(revenue, 2),
        "deals": deals,
        "contracts_signed": contracts_signed,
        "contract_value": round(contract_value, 2),
        "by_category": {cat: int(qty) for cat, qty in by_cat},
    }

# ---------- Ollabear Webhook ----------
WEBHOOK_SECRET = os.getenv("OLLABEAR_WEBHOOK_SECRET", "")


@app.post("/webhook")
async def ollabear_webhook(request: Request):
    """
    Receives Ollabear webhook events (message.created, conversation.closed, etc.).
    Verifies the HMAC-SHA256 signature before processing.
    """
    raw_body = await request.body()
    signature = request.headers.get("x-webhook-signature", "")
    event_type = request.headers.get("x-webhook-event", "unknown")

    # Verify signature if secret is configured
    if WEBHOOK_SECRET:
        expected = hmac.new(
            WEBHOOK_SECRET.encode(),
            raw_body,
            hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(expected, signature):
            print(f"[webhook] ❌ Signature mismatch for event: {event_type}")
            raise HTTPException(401, "Invalid signature")

    # Parse and log the event
    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError:
        payload = {}

    print(f"[webhook] ✅ Received event: {event_type}")
    print(f"[webhook]    Payload: {json.dumps(payload, indent=2)}")

    # Handle specific events
    if event_type == "message.created":
        message = payload.get("message", {})
        print(f"[webhook]    💬 New message from {message.get('role', '?')}: {message.get('content', '')}")
    elif event_type == "conversation.created":
        print(f"[webhook]    🆕 New conversation: {payload.get('conversation_id', '?')}")
    elif event_type == "conversation.closed":
        print(f"[webhook]    🔒 Conversation closed: {payload.get('conversation_id', '?')}")

    return {"status": "ok"}


# ---------- Serve frontend build at /demo ----------
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(FRONTEND_DIST):
    app.mount("/demo", StaticFiles(directory=FRONTEND_DIST, html=True), name="demo")

    @app.get("/")
    def root():
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
else:
    @app.get("/")
    def root():
        return {"message": "Apple Demo Store API. Build the frontend to serve /demo."}
