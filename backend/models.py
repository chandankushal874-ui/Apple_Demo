"""SQLAlchemy ORM models for the Apple demo store."""
from datetime import datetime

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)  # iPhone, iPad, Mac
    price = Column(Float, nullable=False)
    description = Column(Text, default="")
    image = Column(String, default="")
    stock = Column(Integer, default=100)


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    total = Column(Float, default=0.0)
    status = Column(String, default="sold")  # sold, shipped
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    product_name = Column(String)
    quantity = Column(Integer, default=1)
    price = Column(Float, default=0.0)

    order = relationship("Order", back_populates="items")


class Contract(Base):
    """Enterprise deals / contracts signed."""
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    company = Column(String, nullable=False)
    value = Column(Float, default=0.0)
    signed_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="signed")  # deal, signed
