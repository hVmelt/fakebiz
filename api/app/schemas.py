from pydantic import BaseModel, Field

class ProductCreate(BaseModel):
    sku: str = Field(min_length=1)
    name: str = Field(min_length=1)
    price: float = Field(ge=0)
    stock: int = Field(ge=0, default=0)

class ProductOut(BaseModel):
    id: int
    sku: str
    name: str
    price: float
    stock: int

    class Config:
        from_attributes = True

class CustomerCreate(BaseModel):
    name: str = Field(min_length=1)
    email: str = Field(min_length=3)

class CustomerOut(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True

class OrderItemCreate(BaseModel):
    product_id: int
    qty: int = Field(gt=0)

class OrderCreate(BaseModel):
    customer_id: int
    items: list[OrderItemCreate] = Field(min_length=1)

class OrderItemOut(BaseModel):
    product_id: int
    qty: int
    price_at_purchase: float

    class Config:
        from_attributes = True

class OrderOut(BaseModel):
    id: int
    customer_id: int
    items: list[OrderItemOut]

    class Config:
        from_attributes = True
