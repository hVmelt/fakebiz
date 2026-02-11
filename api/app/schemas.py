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
