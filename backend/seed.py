"""Seed the database with Apple products and demo analytics data."""
import random
from datetime import datetime, timedelta

from database import SessionLocal, engine, Base
from models import Product, Order, OrderItem, Contract

Base.metadata.create_all(bind=engine)

PRODUCTS = [
    # iPhones
    ("iPhone 15 Pro Max", "iPhone", 1199.00, "6.7-inch, A17 Pro chip, Titanium design", "https://images.unsplash.com/photo-1592286927505-1def25115558?w=500"),
    ("iPhone 15 Pro", "iPhone", 999.00, "6.1-inch, A17 Pro chip, Action button", "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500"),
    ("iPhone 15", "iPhone", 799.00, "6.1-inch, Dynamic Island, 48MP camera", "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500"),
    ("iPhone 15 Plus", "iPhone", 899.00, "6.7-inch, all-day battery life", "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500"),
    ("iPhone SE", "iPhone", 429.00, "4.7-inch, A15 Bionic, Touch ID", "https://images.unsplash.com/photo-1529653762956-b0a27278529c?w=500"),
    # iPads
    ("iPad Pro 12.9", "iPad", 1099.00, "M2 chip, Liquid Retina XDR display", "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500"),
    ("iPad Air", "iPad", 599.00, "M1 chip, 10.9-inch Liquid Retina", "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=500"),
    ("iPad", "iPad", 449.00, "10.9-inch, A14 Bionic, USB-C", "https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=500"),
    ("iPad mini", "iPad", 499.00, "8.3-inch, A15 Bionic, ultra-portable", "https://images.unsplash.com/photo-1587033411391-5d9e51cce126?w=500"),
    # Macs
    ("MacBook Pro 16", "Mac", 2499.00, "M3 Pro chip, 16-inch Liquid Retina XDR", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500"),
    ("MacBook Air 15", "Mac", 1299.00, "M2 chip, 15.3-inch, ultra-thin", "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500"),
    ("MacBook Air 13", "Mac", 1099.00, "M2 chip, 13.6-inch, all-day battery", "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=500"),
    ("iMac 24", "Mac", 1299.00, "M3 chip, 24-inch 4.5K Retina display", "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500"),
    ("Mac mini", "Mac", 599.00, "M2 chip, compact desktop powerhouse", "https://images.unsplash.com/photo-1620085482142-9f4f36e0a49f?w=500"),
]

COMPANIES = [
    "Globex Corp", "Initech", "Umbrella Inc", "Stark Industries", "Wayne Enterprises",
    "Acme Co", "Hooli", "Pied Piper", "Wonka Industries", "Cyberdyne Systems",
]


def seed():
    db = SessionLocal()
    if db.query(Product).count() > 0:
        print("Database already seeded.")
        db.close()
        return

    products = []
    for name, cat, price, desc, img in PRODUCTS:
        p = Product(name=name, category=cat, price=price, description=desc, image=img, stock=random.randint(20, 200))
        db.add(p)
        products.append(p)
    db.commit()

    # Seed some historical orders (sold + shipped) for analytics
    for _ in range(60):
        prod = random.choice(products)
        qty = random.randint(1, 3)
        status = random.choice(["sold", "shipped", "shipped"])
        order = Order(
            total=prod.price * qty,
            status=status,
            created_at=datetime.utcnow() - timedelta(days=random.randint(0, 30)),
        )
        order.items.append(OrderItem(
            product_id=prod.id, product_name=prod.name, quantity=qty, price=prod.price,
        ))
        db.add(order)

    # Seed deals / contracts
    for i in range(12):
        status = "signed" if i % 2 == 0 else "deal"
        c = Contract(
            company=random.choice(COMPANIES),
            value=round(random.uniform(50000, 500000), 2),
            status=status,
            signed_at=datetime.utcnow() - timedelta(days=random.randint(0, 60)),
        )
        db.add(c)

    db.commit()
    db.close()
    print("Seeded products, orders and contracts.")


if __name__ == "__main__":
    seed()
