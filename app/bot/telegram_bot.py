"""
Telegram Bot integration using webhooks
"""
import httpx
from typing import Optional
from app.utils.config import settings


class TelegramBot:
    def __init__(self):
        self.token = settings.TELEGRAM_BOT_TOKEN
        self.base_url = f"https://api.telegram.org/bot{self.token}"

    async def send_message(
        self,
        chat_id: int,
        text: str,
        parse_mode: str = "HTML",
        reply_markup: Optional[dict] = None
    ) -> dict:
        """Send a message to a Telegram chat"""
        url = f"{self.base_url}/sendMessage"

        data = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode
        }

        if reply_markup:
            data["reply_markup"] = reply_markup

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=data)
            return response.json()

    async def send_photo(self, chat_id: int, photo: str, caption: str = None) -> dict:
        """Send a photo to a Telegram chat"""
        url = f"{self.base_url}/sendPhoto"

        data = {
            "chat_id": chat_id,
            "photo": photo
        }

        if caption:
            data["caption"] = caption

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=data)
            return response.json()

    async def get_file(self, file_id: str) -> dict:
        """Get file info from Telegram"""
        url = f"{self.base_url}/getFile"

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json={"file_id": file_id})
            return response.json()

    async def download_file(self, file_path: str) -> bytes:
        """Download a file from Telegram servers"""
        url = f"https://api.telegram.org/file/bot{self.token}/{file_path}"

        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            return response.content

    async def set_webhook(self, webhook_url: str) -> dict:
        """Set webhook URL for receiving updates"""
        url = f"{self.base_url}/setWebhook"

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json={"url": webhook_url})
            return response.json()

    async def delete_webhook(self) -> dict:
        """Delete webhook"""
        url = f"{self.base_url}/deleteWebhook"

        async with httpx.AsyncClient() as client:
            response = await client.post(url)
            return response.json()

    async def get_webhook_info(self) -> dict:
        """Get current webhook info"""
        url = f"{self.base_url}/getWebhookInfo"

        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            return response.json()


telegram_bot = TelegramBot()
