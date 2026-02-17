import time
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from .db import Base, engine, get_db
from .models import Product
from .schemas import ProductCreate, ProductOut
from .models import Product, Customer
from .schemas import ProductCreate, ProductOut, CustomerCreate, CustomerOut
from .models import Product, Customer, Order, OrderItem
from sqlalchemy import text
from .schemas import (
    ProductCreate, ProductOut,
    CustomerCreate, CustomerOut,
    OrderCreate, OrderOut
)



app = FastAPI(title="MiniBiz Ops Suite")

# Create tables automatically (fine for learning; later you’ll use migrations)
# Base.metadata.create_all(bind=engine)

@app.on_event("startup")
def startup():
    # Wait for Postgres to be ready (retry for ~15 seconds)
    for _ in range(15):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            break
        except Exception:
            time.sleep(1)
    else:
        raise RuntimeError("Database not ready after waiting")

    # Create tables once DB is reachable
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/products", response_model=ProductOut, status_code=201)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    # prevent duplicate SKU
    existing = db.execute(select(Product).where(Product.sku == payload.sku)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="SKU already exists")

    product = Product(
        sku=payload.sku,
        name=payload.name,
        price=payload.price,
        stock=payload.stock,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@app.get("/products", response_model=list[ProductOut])
def list_products(db: Session = Depends(get_db)):
    products = db.execute(select(Product).order_by(Product.id)).scalars().all()
    return products

@app.post("/customers", response_model=CustomerOut, status_code=201)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    existing = db.execute(select(Customer).where(Customer.email == payload.email)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Email already exists")

    customer = Customer(name=payload.name, email=payload.email)
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

@app.get("/customers", response_model=list[CustomerOut])
def list_customers(db: Session = Depends(get_db)):
    return db.execute(select(Customer).order_by(Customer.id)).scalars().all()

@app.post("/orders", response_model=OrderOut, status_code=201)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    customer = db.get(Customer, payload.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    try:
        order = Order(customer_id=payload.customer_id)
        db.add(order)
        db.flush()  # gets order.id without committing

        for item in payload.items:
            product = db.get(Product, item.product_id)
            if not product:
                raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")

            if item.qty > product.stock:
                raise HTTPException(
                    status_code=400,
                    detail=f"Not enough stock for product {product.id} (have {product.stock}, need {item.qty})"
                )

            product.stock -= item.qty

            db.add(OrderItem(
                order_id=order.id,
                product_id=product.id,
                qty=item.qty,
                price_at_purchase=float(product.price),
            ))

        db.commit()
        db.refresh(order)
        return order

    except:
        db.rollback()
        raise

@app.get("/orders", response_model=list[OrderOut])
def list_orders(db: Session = Depends(get_db)):
    orders = db.execute(select(Order).order_by(Order.id)).scalars().all()
    return orders

@app.get("/reports/revenue")
def get_revenue(db: Session = Depends(get_db)):
    total = db.execute(
        select(func.coalesce(func.sum(OrderItem.qty * OrderItem.price_at_purchase), 0))
    ).scalar_one()

    return {"total_revenue": float(total)}

@app.get("/reports/top-products")
def top_products(limit: int = 5, db: Session = Depends(get_db)):
    results = db.execute(
        select(
            OrderItem.product_id,
            func.sum(OrderItem.qty).label("units_sold")
        )
        .group_by(OrderItem.product_id)
        .order_by(func.sum(OrderItem.qty).desc())
        .limit(limit)
    ).all()

    return [
        {"product_id": pid, "units_sold": int(units)}
        for pid, units in results
    ]

@app.get("/reports/low-stock")
def low_stock(threshold: int = 5, db: Session = Depends(get_db)):
    products = db.execute(
        select(Product)
        .where(Product.stock <= threshold)
        .order_by(Product.stock.asc())
    ).scalars().all()

    return products

