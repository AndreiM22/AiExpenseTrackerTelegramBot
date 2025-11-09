from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

router = APIRouter()


class TelegramBindRequest(BaseModel):
    telegram_user_id: int
    username: str = None
    display_name: str = None


@router.post("/telegram_bind")
async def bind_telegram_account(request: TelegramBindRequest):
    """Bind a Telegram account to create/authenticate user"""
    # Will be implemented in MVP-009
    return {"message": "Telegram bind - to be implemented"}
