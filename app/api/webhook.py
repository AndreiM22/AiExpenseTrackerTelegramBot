"""
Telegram Webhook API endpoint
"""
from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.user import User
from app.bot import handlers
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/webhook")
async def telegram_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Receive updates from Telegram via webhook
    """
    try:
        from app.utils.config import settings
        from app.bot.telegram_bot import telegram_bot

        update = await request.json()
        logger.info(f"Received update: {update}")

        # Extract chat info for access control
        chat_id = None
        user_id = None

        if "message" in update:
            chat_id = update["message"]["chat"]["id"]
            user_id = update["message"]["from"]["id"]
        elif "callback_query" in update:
            chat_id = update["callback_query"]["message"]["chat"]["id"]
            user_id = update["callback_query"]["from"]["id"]

        # ACCESS CONTROL: Verifică dacă grupul/user-ul are permisiune
        if settings.ALLOWED_GROUP_ID:
            # Dacă este setat un grup whitelist, verifică
            if chat_id != settings.ALLOWED_GROUP_ID:
                # Nu este grupul permis - trimite mesaj de refuz
                await telegram_bot.send_message(
                    chat_id=chat_id,
                    text="❌ <b>Acces Refuzat</b>\n\n"
                         "Acest bot este privat și funcționează doar într-un grup specific.\n"
                         "Nu aveți permisiunea să folosiți acest bot."
                )
                return {"ok": True, "message": "Access denied"}

        # Opțional: verifică și user IDs dacă sunt setați
        if settings.ALLOWED_USER_IDS:
            allowed_users = [int(uid.strip()) for uid in settings.ALLOWED_USER_IDS.split(",") if uid.strip()]
            if allowed_users and user_id not in allowed_users:
                await telegram_bot.send_message(
                    chat_id=chat_id,
                    text="❌ <b>Acces Refuzat</b>\n\n"
                         "Nu aveți permisiunea să folosiți acest bot."
                )
                return {"ok": True, "message": "User not authorized"}

        # Handle callback queries (button presses)
        if "callback_query" in update:
            callback_query = update["callback_query"]
            await handlers.handle_callback_query(callback_query, db)
            return {"ok": True}

        # Extract message
        message = update.get("message")
        if not message:
            return {"ok": True}

        chat_id = message["chat"]["id"]
        user_data = message["from"]

        # Get or find user
        telegram_user_id = user_data.get("id")
        user = db.query(User).filter(User.telegram_user_id == telegram_user_id).first()

        # Handle different message types
        if "text" in message:
            text = message["text"]

            # Handle commands
            if text.startswith("/"):
                command = text.split()[0].lower()

                if command == "/start":
                    await handlers.handle_start(chat_id, user_data, db)

                elif command == "/help":
                    await handlers.handle_help(chat_id)

                elif command == "/categories":
                    if user:
                        await handlers.handle_categories(chat_id, user.id, db)
                    else:
                        await handlers.handle_start(chat_id, user_data, db)

                elif command == "/expenses":
                    if user:
                        await handlers.handle_expenses(chat_id, user.id, db)
                    else:
                        await handlers.handle_start(chat_id, user_data, db)

                elif command == "/stats":
                    if user:
                        await handlers.handle_stats(chat_id, user.id, db)
                    else:
                        await handlers.handle_start(chat_id, user_data, db)

                elif command == "/add_category":
                    if user:
                        # Extract category name from text
                        category_name = text.replace("/add_category", "").strip()
                        await handlers.handle_add_category(chat_id, user.id, category_name, db)
                    else:
                        await handlers.handle_start(chat_id, user_data, db)

                else:
                    await handlers.handle_help(chat_id)

            else:
                # Regular text - treat as expense
                if user:
                    await handlers.handle_text_expense(chat_id, user.id, text, db)
                else:
                    # Create user first
                    await handlers.handle_start(chat_id, user_data, db)
                    # Refresh user
                    user = db.query(User).filter(User.telegram_user_id == telegram_user_id).first()
                    if user:
                        await handlers.handle_text_expense(chat_id, user.id, text, db)

        elif "photo" in message:
            # Handle photo receipts
            if user:
                await handlers.handle_photo_expense(chat_id, user.id, message["photo"], db)
            else:
                await handlers.handle_start(chat_id, user_data, db)
                user = db.query(User).filter(User.telegram_user_id == telegram_user_id).first()
                if user:
                    await handlers.handle_photo_expense(chat_id, user.id, message["photo"], db)

        elif "voice" in message:
            # Handle voice messages
            if user:
                await handlers.handle_voice_expense(chat_id, user.id, message["voice"], db)
            else:
                await handlers.handle_start(chat_id, user_data, db)
                user = db.query(User).filter(User.telegram_user_id == telegram_user_id).first()
                if user:
                    await handlers.handle_voice_expense(chat_id, user.id, message["voice"], db)

        return {"ok": True}

    except Exception as e:
        logger.error(f"Error processing webhook: {e}", exc_info=True)
        return {"ok": False, "error": str(e)}


@router.get("/webhook/info")
async def webhook_info():
    """Get webhook status"""
    from app.bot.telegram_bot import telegram_bot

    try:
        info = await telegram_bot.get_webhook_info()
        return info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook/set")
async def set_webhook(webhook_url: str):
    """Set webhook URL"""
    from app.bot.telegram_bot import telegram_bot

    try:
        result = await telegram_bot.set_webhook(webhook_url)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/webhook")
async def delete_webhook():
    """Delete webhook"""
    from app.bot.telegram_bot import telegram_bot

    try:
        result = await telegram_bot.delete_webhook()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
