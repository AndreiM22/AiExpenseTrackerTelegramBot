from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
import os
import tempfile
import uuid
import csv
from io import StringIO
import json

from app.models.database import get_db
from app.models.expense import Expense
from app.models.category import Category
from app.services.groq_client import groq_client
from app.utils.crypto import encrypt_data, decrypt_data
from app.utils.user_context import get_active_user_id
from app.api.schemas import (
    ManualExpenseRequest,
    ManualExpenseConfirmRequest,
    ExpensePreviewResponse,
    ExpenseCreatedResponse,
    ExpenseResponse,
    ExpenseListResponse,
    ExpenseDetailResponse,
    ExpenseUpdateRequest
)

router = APIRouter()


@router.post("/photo", response_model=ExpenseCreatedResponse)
async def create_expense_from_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload receipt photo and extract expense data using Groq AI vision model"""

    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_path = temp_file.name

    try:
        # Parse photo with Groq AI
        parsed_data = await groq_client.parse_photo(temp_path)

        # Determine user and create expense record
        user_id = get_active_user_id(db)
        expense = await _create_expense_from_parsed_data(
            db=db,
            parsed_data=parsed_data,
            source="photo",
            user_id=user_id  # TODO: Get from auth
        )

        return ExpenseCreatedResponse(
            status="success",
            expense_id=expense.id,
            data=parsed_data
        )

    finally:
        # Cleanup temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.post("/voice", response_model=ExpenseCreatedResponse)
async def create_expense_from_voice(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload voice message and extract expense data using Groq AI speech model"""

    # Validate file type
    allowed_types = ["audio/", "video/"]
    if not any(file.content_type.startswith(t) for t in allowed_types):
        raise HTTPException(status_code=400, detail="File must be audio or video")

    # Save uploaded file temporarily
    suffix = os.path.splitext(file.filename)[1] or ".m4a"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_path = temp_file.name

    try:
        # Parse voice with Groq AI
        parsed_data = await groq_client.parse_voice(temp_path)

        # Determine user and create expense record
        user_id = get_active_user_id(db)
        expense = await _create_expense_from_parsed_data(
            db=db,
            parsed_data=parsed_data,
            source="voice",
            user_id=user_id  # TODO: Get from auth
        )

        return ExpenseCreatedResponse(
            status="success",
            expense_id=expense.id,
            data=parsed_data
        )

    finally:
        # Cleanup temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.post("/manual", response_model=ExpenseCreatedResponse)
async def create_expense_from_text(
    request: ManualExpenseRequest,
    db: Session = Depends(get_db)
):
    """Submit manual text input and normalize using Groq AI text model"""

    # TODO: Get user from authentication
    user_id = get_active_user_id(db)

    # Get user's custom categories
    user_categories = _get_user_category_names(db, user_id)

    # Parse text with Groq AI
    parsed_data = await groq_client.parse_text(request.text, user_categories)

    # Create expense record
    expense = await _create_expense_from_parsed_data(
        db=db,
        parsed_data=parsed_data,
        source="manual",
        user_id=user_id  # TODO: Get from auth
    )

    return ExpenseCreatedResponse(
        status="success",
        expense_id=expense.id,
        data=parsed_data
    )


@router.post("/manual/preview", response_model=ExpensePreviewResponse)
async def preview_expense_from_text(
    request: ManualExpenseRequest,
    db: Session = Depends(get_db)
):
    """Use AI to parse manual text without saving the expense"""

    user_id = get_active_user_id(db)
    user_categories = _get_user_category_names(db, user_id)
    parsed_data = await groq_client.parse_text(request.text, user_categories)

    return ExpensePreviewResponse(
        status="preview",
        data=parsed_data
    )


@router.options("/manual/preview", include_in_schema=False)
async def preview_expense_options():
    return Response(status_code=200)


@router.options("/manual", include_in_schema=False)
async def manual_expense_options():
    return Response(status_code=200)


@router.post("/manual/confirm", response_model=ExpenseDetailResponse)
async def confirm_expense_from_parsed_data(
    request: ManualExpenseConfirmRequest,
    db: Session = Depends(get_db)
):
    """Persist an expense using parsed data returned by the AI"""

    user_id = get_active_user_id(db)
    expense = await _create_expense_from_parsed_data(
        db=db,
        parsed_data=request.parsed_data,
        source=request.source,
        user_id=user_id
    )

    return _build_expense_detail_response(expense)


@router.get("", response_model=ExpenseListResponse)
async def list_expenses(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    # Filters
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    category_id: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    source: Optional[str] = None,
    search: Optional[str] = None,
    # Sorting
    sort_by: str = "created_at",
    order: str = "desc"
):
    """
    List all expenses for authenticated user with advanced filtering and sorting

    Filters:
    - date_from: Start date (YYYY-MM-DD)
    - date_to: End date (YYYY-MM-DD)
    - category_id: Filter by category UUID
    - min_amount: Minimum amount
    - max_amount: Maximum amount
    - source: Filter by source (photo, voice, manual)
    - search: Search in vendor name

    Sorting:
    - sort_by: Field to sort by (created_at, purchase_date, amount, vendor)
    - order: Sort order (asc, desc)
    """

    # TODO: Filter by authenticated user
    user_id = get_active_user_id(db)

    # Base query
    query = db.query(Expense).filter(Expense.owner_user_id == user_id)

    # Apply filters
    if date_from:
        try:
            from datetime import datetime
            date_from_obj = datetime.strptime(date_from, "%Y-%m-%d").date()
            query = query.filter(Expense.purchase_date >= date_from_obj)
        except ValueError:
            pass

    if date_to:
        try:
            from datetime import datetime
            date_to_obj = datetime.strptime(date_to, "%Y-%m-%d").date()
            query = query.filter(Expense.purchase_date <= date_to_obj)
        except ValueError:
            pass

    if category_id:
        query = query.filter(Expense.category_id == category_id)

    if min_amount is not None:
        query = query.filter(Expense.amount >= min_amount)

    if max_amount is not None:
        query = query.filter(Expense.amount <= max_amount)

    if source:
        query = query.filter(Expense.source == source)

    if search:
        from app.utils.crypto import decrypt_data
        # Note: Search in encrypted vendor is complex
        # For now, we'll fetch all and filter in Python
        # TODO: Consider storing vendor hash for better search performance
        pass

    # Apply sorting
    if sort_by == "created_at":
        order_field = Expense.created_at
    elif sort_by == "purchase_date":
        order_field = Expense.purchase_date
    elif sort_by == "amount":
        order_field = Expense.amount
    elif sort_by == "vendor":
        order_field = Expense.vendor
    else:
        order_field = Expense.created_at

    if order.lower() == "asc":
        query = query.order_by(order_field.asc())
    else:
        query = query.order_by(order_field.desc())

    # Get total count before pagination
    total = query.count()

    # Apply pagination
    expenses = query.offset(skip).limit(limit).all()

    # If search is provided, filter by vendor (decrypt and search)
    if search and expenses:
        search_term = search.lower()
        filtered_expenses = []
        for expense in expenses:
            decrypted_vendor = _decrypt_vendor_value(expense.vendor)
            if decrypted_vendor and search_term in decrypted_vendor.lower():
                # cache decrypted vendor for later serialization
                expense._decrypted_vendor_cache = decrypted_vendor
                filtered_expenses.append(expense)
        expenses = filtered_expenses
        total = len(filtered_expenses)

    serialized_expenses = [_serialize_expense(expense) for expense in expenses]

    return ExpenseListResponse(
        expenses=serialized_expenses,
        total=total
    )


@router.get("/{expense_id}", response_model=ExpenseDetailResponse)
async def get_expense_detail(
    expense_id: str,
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific expense including decrypted data"""

    # TODO: Filter by authenticated user
    user_id = get_active_user_id(db)

    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.owner_user_id == user_id
    ).first()

    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    # Decrypt json_data and vendor
    decrypted_json = _decrypt_json_payload(expense.json_data)
    decrypted_vendor = _decrypt_vendor_value(expense.vendor)

    # Create response
    return _build_expense_detail_response(expense)


@router.put("/{expense_id}", response_model=ExpenseDetailResponse)
async def update_expense(
    expense_id: str,
    update_data: ExpenseUpdateRequest,
    db: Session = Depends(get_db)
):
    """Update an existing expense"""

    # TODO: Filter by authenticated user
    user_id = get_active_user_id(db)

    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.owner_user_id == user_id
    ).first()

    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    # Update fields
    if update_data.amount is not None:
        expense.amount = update_data.amount

    if update_data.currency is not None:
        expense.currency = update_data.currency

    if update_data.vendor is not None:
        # Re-encrypt vendor
        expense.vendor = encrypt_data(update_data.vendor)

    if update_data.purchase_date is not None:
        expense.purchase_date = update_data.purchase_date

    if update_data.category_id is not None:
        expense.category_id = update_data.category_id

    # Update json_data with notes and items if provided
    if update_data.notes is not None or update_data.items is not None:
        # Decrypt existing json_data
        existing_json = _decrypt_json_payload(expense.json_data) or {}

        # Update with new data
        if update_data.notes is not None:
            existing_json['notes'] = update_data.notes

        if update_data.items is not None:
            existing_json['items'] = update_data.items

        # Re-encrypt
        expense.json_data = encrypt_data(existing_json)

    db.commit()
    db.refresh(expense)

    # Return detailed response with decrypted data
    return _build_expense_detail_response(expense)


@router.delete("/{expense_id}")
async def delete_expense(
    expense_id: str,
    db: Session = Depends(get_db)
):
    """Delete an expense"""

    # TODO: Filter by authenticated user
    user_id = get_active_user_id(db)

    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.owner_user_id == user_id
    ).first()

    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    # Hard delete (you can change to soft delete by adding deleted_at field)
    db.delete(expense)
    db.commit()

    from app.api.schemas import SuccessResponse
    return SuccessResponse(
        status="success",
        message=f"Expense deleted successfully"
    )


@router.get("/export/csv")
async def export_expenses_csv(
    db: Session = Depends(get_db),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    category_id: Optional[str] = None,
    source: Optional[str] = None
):
    """Export expenses to CSV with optional filters"""

    # TODO: Get from authenticated user
    user_id = get_active_user_id(db)

    # Build query with same filters as list_expenses
    query = db.query(Expense).filter(Expense.owner_user_id == user_id)

    if date_from:
        try:
            date_from_obj = datetime.strptime(date_from, "%Y-%m-%d").date()
            query = query.filter(Expense.purchase_date >= date_from_obj)
        except ValueError:
            pass

    if date_to:
        try:
            date_to_obj = datetime.strptime(date_to, "%Y-%m-%d").date()
            query = query.filter(Expense.purchase_date <= date_to_obj)
        except ValueError:
            pass

    if category_id:
        query = query.filter(Expense.category_id == category_id)

    if source:
        query = query.filter(Expense.source == source)

    expenses = query.order_by(Expense.purchase_date.desc()).all()

    # Create CSV in memory
    output = StringIO()
    writer = csv.writer(output)

    # Write header
    writer.writerow(['Date', 'Vendor', 'Amount', 'Currency', 'Category', 'Source', 'Notes', 'AI Confidence'])

    # Write data
    for expense in expenses:
        # Decrypt vendor
        vendor = _decrypt_vendor_value(expense.vendor) or "[encrypted]"

        # Get category name
        category_name = ""
        if expense.category_id:
            category = db.query(Category).filter(Category.id == expense.category_id).first()
            if category:
                category_name = category.name

        # Get notes from json_data
        notes = ""
        if expense.json_data:
            try:
                json_obj = decrypt_data(expense.json_data)
                notes = json_obj.get('notes', '')
            except:
                pass

        writer.writerow([
            expense.purchase_date.strftime("%Y-%m-%d") if expense.purchase_date else "",
            vendor,
            expense.amount,
            expense.currency,
            category_name,
            expense.source,
            notes,
            expense.ai_confidence
        ])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=expenses_{datetime.now().strftime('%Y%m%d')}.csv"}
    )


def _build_expense_detail_response(expense: Expense) -> ExpenseDetailResponse:
    decrypted_json = _decrypt_json_payload(expense.json_data)
    decrypted_vendor = _decrypt_vendor_value(expense.vendor)
    category_name = _derive_category_name(expense)

    return ExpenseDetailResponse(
        id=expense.id,
        owner_user_id=expense.owner_user_id,
        source=expense.source,
        amount=expense.amount,
        currency=expense.currency,
        vendor=decrypted_vendor,
        purchase_date=expense.purchase_date,
        category_id=expense.category_id,
        ai_confidence=expense.ai_confidence,
        created_at=expense.created_at,
        json_data=decrypted_json,
        decrypted_vendor=decrypted_vendor,
        category_name=category_name,
        vendor_fiscal_code=expense.vendor_fiscal_code,
        vendor_registration_number=expense.vendor_registration_number,
        vendor_address=expense.vendor_address
    )


async def _create_expense_from_parsed_data(
    db: Session,
    parsed_data: dict,
    source: str,
    user_id: str
) -> Expense:
    """
    Helper function to create expense from Groq parsed data

    Args:
        db: Database session
        parsed_data: Data returned from Groq AI
        source: Source type (photo, voice, manual)
        user_id: User ID (UUID string)

    Returns:
        Created Expense object
    """

    # Encrypt sensitive data
    encrypted_json = encrypt_data(parsed_data)
    encrypted_vendor = encrypt_data(parsed_data.get("vendor", "")) if parsed_data.get("vendor") else None

    # Parse date
    purchase_date = None
    if parsed_data.get("purchase_date"):
        try:
            purchase_date = datetime.strptime(parsed_data["purchase_date"], "%Y-%m-%d").date()
        except:
            pass

    category_id = None
    if parsed_data.get("category_id"):
        category_id = parsed_data["category_id"]
    elif parsed_data.get("category"):
        category_id = _match_category_id_by_name(
            db, user_id, parsed_data["category"]
        )

    # Create expense
    expense = Expense(
        owner_user_id=user_id,
        source=source,
        amount=parsed_data.get("amount"),
        currency=parsed_data.get("currency", "MDL"),
        vendor=encrypted_vendor,
        purchase_date=purchase_date,
        category_id=category_id,
        json_data=encrypted_json,
        ai_confidence=parsed_data.get("confidence"),
        vendor_fiscal_code=parsed_data.get("fiscal_code"),
        vendor_registration_number=parsed_data.get("registration_number"),
        vendor_address=parsed_data.get("address"),
    )

    db.add(expense)
    db.commit()
    db.refresh(expense)

    return expense


def _get_user_category_names(db: Session, user_id: str) -> list[str]:
    """
    Get list of category names for a user

    Args:
        db: Database session
        user_id: User ID (UUID string)

    Returns:
        List of category names
    """
    categories = db.query(Category).filter(
        Category.user_id == user_id
    ).all()

    return [cat.name for cat in categories]


def _decrypt_vendor_value(encrypted_vendor: Optional[str]) -> Optional[str]:
    if not encrypted_vendor:
        return None
    try:
        return decrypt_data(encrypted_vendor)
    except Exception:
        return None


def _serialize_expense(expense: Expense) -> ExpenseResponse:
    decrypted_vendor = getattr(expense, "_decrypted_vendor_cache", None)
    if decrypted_vendor is None:
        decrypted_vendor = _decrypt_vendor_value(expense.vendor)

    category_name = _derive_category_name(expense)

    return ExpenseResponse(
        id=expense.id,
        owner_user_id=expense.owner_user_id,
        source=expense.source,
        amount=expense.amount,
        currency=expense.currency,
        vendor=decrypted_vendor,
        purchase_date=expense.purchase_date,
        category_id=expense.category_id,
        ai_confidence=expense.ai_confidence,
        created_at=expense.created_at,
        decrypted_vendor=decrypted_vendor,
        category_name=category_name,
        vendor_fiscal_code=expense.vendor_fiscal_code,
        vendor_registration_number=expense.vendor_registration_number,
        vendor_address=expense.vendor_address
    )


def _decrypt_json_payload(encrypted_payload: Optional[str]) -> Optional[dict]:
    if not encrypted_payload:
        return None
    try:
        data = decrypt_data(encrypted_payload)
        if isinstance(data, str):
            try:
                return json.loads(data)
            except json.JSONDecodeError:
                return None
        if isinstance(data, dict):
            return data
    except Exception:
        return None
    return None


def _derive_category_name(expense: Expense) -> Optional[str]:
    if expense.category and expense.category.name:
        return expense.category.name

    payload = _decrypt_json_payload(expense.json_data)
    if payload and isinstance(payload.get("category"), str):
        return payload["category"]

    return None


def _match_category_id_by_name(db: Session, user_id: str, name: str) -> Optional[str]:
    if not name:
        return None
    normalized = name.strip().lower()
    if not normalized:
        return None

    category = db.query(Category).filter(
        Category.user_id == user_id,
        func.lower(Category.name) == normalized
    ).first()

    return str(category.id) if category else None
