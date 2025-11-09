from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
import random

from app.models.database import get_db
from app.models.category import Category
from app.models.expense import Expense
from app.api.schemas import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
    SuccessResponse,
    CategorySuggestRequest,
    CategorySuggestResponse
)
from app.services.groq_client import groq_client
from app.utils.user_context import get_active_user_id

router = APIRouter()


@router.post("", response_model=CategoryResponse, status_code=201)
async def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db)
):
    """Create a new custom category for the user"""

    # TODO: Get user from authentication
    user_id = get_active_user_id(db)

    try:
        category = Category(
            user_id=user_id,
            name=category_data.name,
            color=category_data.color,
            icon=category_data.icon,
            is_default=category_data.is_default
        )

        db.add(category)
        db.commit()
        db.refresh(category)

        return category

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Category '{category_data.name}' already exists for this user"
        )


@router.get("", response_model=List[CategoryResponse])
async def list_categories(
    db: Session = Depends(get_db)
):
    """List all categories for authenticated user"""

    # TODO: Get user from authentication
    user_id = get_active_user_id(db)

    categories = db.query(Category).filter(
        Category.user_id == user_id
    ).all()

    return categories


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific category"""

    # TODO: Get user from authentication
    user_id = get_active_user_id(db)

    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == user_id
    ).first()

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    return category


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    category_data: CategoryUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing category"""

    # TODO: Get user from authentication
    user_id = get_active_user_id(db)

    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == user_id
    ).first()

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    try:
        # Update fields
        if category_data.name is not None:
            category.name = category_data.name
        if category_data.color is not None:
            category.color = category_data.color
        if category_data.icon is not None:
            category.icon = category_data.icon
        if category_data.is_default is not None:
            category.is_default = category_data.is_default

        db.commit()
        db.refresh(category)

        return category

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Category name '{category_data.name}' already exists for this user"
        )


@router.delete("/{category_id}", response_model=SuccessResponse)
async def delete_category(
    category_id: str,
    db: Session = Depends(get_db)
):
    """Delete a category"""

    # TODO: Get user from authentication
    user_id = get_active_user_id(db)

    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == user_id
    ).first()

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Reassign expenses to uncategorized
    db.query(Expense).filter(
        Expense.category_id == category_id
    ).update({Expense.category_id: None})

    db.delete(category)
    db.commit()

    return SuccessResponse(
        status="success",
        message=f"Category '{category.name}' deleted successfully"
    )


SUGGESTION_PRESETS = [
    {"keywords": ["food", "dining", "restaurant", "coffee", "drink", "grocer", "mcd"], "name": "Mâncare & Restaurante", "icon": "🍽️", "color": "#F97316"},
    {"keywords": ["travel", "plane", "flight", "vacation", "trip"], "name": "Călătorii", "icon": "✈️", "color": "#38BDF8"},
    {"keywords": ["health", "doctor", "med", "pharma", "gym"], "name": "Sănătate & Wellness", "icon": "💊", "color": "#34D399"},
    {"keywords": ["home", "rent", "utility", "electric", "gas", "mortgage"], "name": "Utilități & Locuință", "icon": "🏠", "color": "#FACC15"},
    {"keywords": ["shopping", "clothes", "fashion", "gift", "store"], "name": "Cumpărături", "icon": "🛍️", "color": "#F472B6"},
    {"keywords": ["transport", "car", "fuel", "taxi", "uber", "bus"], "name": "Transport", "icon": "🚗", "color": "#60A5FA"},
    {"keywords": ["education", "books", "course", "learning"], "name": "Educație", "icon": "📚", "color": "#A78BFA"},
    {"keywords": ["entertainment", "movie", "game", "music", "fun"], "name": "Distracție & Timp liber", "icon": "🎬", "color": "#FB7185"},
    {"keywords": ["pets", "dog", "cat", "animal"], "name": "Animale & Îngrijire", "icon": "🐾", "color": "#FDBA74"},
    {"keywords": ["charity", "donation"], "name": "Caritate", "icon": "🤝", "color": "#FDE047"},
]


@router.post("/suggest", response_model=CategorySuggestResponse)
async def suggest_category(
    request: CategorySuggestRequest
):
    description = request.description.strip()
    if not description:
        raise HTTPException(status_code=400, detail="Description is required")

    try:
        suggestion = await groq_client.suggest_category(description)
        return CategorySuggestResponse(**suggestion)
    except Exception:
        for preset in SUGGESTION_PRESETS:
            if any(keyword in description.lower() for keyword in preset["keywords"]):
                return CategorySuggestResponse(
                    name=preset["name"],
                    icon=preset["icon"],
                    color=preset["color"]
                )

        fallback = random.choice(SUGGESTION_PRESETS)
        return CategorySuggestResponse(
            name=fallback["name"],
            icon=fallback["icon"],
            color=fallback["color"]
        )
