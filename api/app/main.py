from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from .db import Base, engine, get_db
from .models import Product
from .schemas import ProductCreate, ProductOut

app = FastAPI(title="MiniBiz Ops Suite")

# Create tables automatically (fine for learning; later you’ll use migrations)
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
