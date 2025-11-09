from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID


# Expense Schemas
class ExpenseBase(BaseModel):
    amount: Optional[float] = None
    currency: Optional[str] = "MDL"
    vendor: Optional[str] = None
    purchase_date: Optional[date] = None
    category_id: Optional[UUID] = None


class ExpenseCreate(ExpenseBase):
    source: str
    json_data: Optional[dict] = None
    ai_confidence: Optional[float] = None


class ExpenseResponse(ExpenseBase):
    id: UUID
    owner_user_id: UUID
    source: str
    ai_confidence: Optional[float]
    created_at: datetime
    decrypted_vendor: Optional[str] = None
    category_name: Optional[str] = None
    vendor_fiscal_code: Optional[str] = None
    vendor_registration_number: Optional[str] = None
    vendor_address: Optional[str] = None

    class Config:
        from_attributes = True


class ExpenseDetailResponse(ExpenseResponse):
    """Extended expense response with decrypted json_data"""
    json_data: Optional[dict] = None
    decrypted_vendor: Optional[str] = None


class ExpenseListResponse(BaseModel):
    expenses: List[ExpenseResponse]
    total: int


# Manual text input
class ManualExpenseRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Expense description text")


class ExpensePreviewResponse(BaseModel):
    status: str = "preview"
    data: dict


class ManualExpenseConfirmRequest(BaseModel):
    parsed_data: dict
    source: str = "manual"


class CategorySuggestRequest(BaseModel):
    description: str = Field(..., min_length=3, description="Descriere scurtă a tipului de categorie dorite")


class CategorySuggestResponse(BaseModel):
    name: str
    color: str
    icon: str


# Update expense
class ExpenseUpdateRequest(BaseModel):
    amount: Optional[float] = None
    currency: Optional[str] = None
    vendor: Optional[str] = None
    purchase_date: Optional[date] = None
    category_id: Optional[UUID] = None
    notes: Optional[str] = None
    items: Optional[List[dict]] = None


# Category Schemas
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color: Optional[str] = None
    icon: Optional[str] = None
    is_default: bool = False


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(CategoryBase):
    name: Optional[str] = None


class CategoryResponse(CategoryBase):
    id: UUID
    user_id: UUID

    class Config:
        from_attributes = True


# Standard API responses
class SuccessResponse(BaseModel):
    status: str = "success"
    message: Optional[str] = None


class ExpenseCreatedResponse(SuccessResponse):
    expense_id: UUID
    data: dict
