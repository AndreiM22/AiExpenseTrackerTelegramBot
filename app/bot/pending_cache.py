"""
In-memory cache for pending expense confirmations
"""
from typing import Dict, Any
from datetime import datetime, timedelta
import uuid

class PendingExpenseCache:
    """Simple in-memory cache for expenses awaiting user confirmation"""

    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}

    def store(self, user_id: str, parsed_data: dict, chat_id: int) -> str:
        """
        Store parsed expense data temporarily

        Args:
            user_id: User ID who will confirm
            parsed_data: Parsed expense data from AI
            chat_id: Telegram chat ID

        Returns:
            confirmation_id: Unique ID for this pending expense
        """
        confirmation_id = str(uuid.uuid4())[:8]  # Short ID

        self._cache[confirmation_id] = {
            "user_id": user_id,
            "parsed_data": parsed_data,
            "chat_id": chat_id,
            "created_at": datetime.now()
        }

        # Auto-cleanup old entries (older than 5 minutes)
        self._cleanup_old()

        return confirmation_id

    def get(self, confirmation_id: str) -> Dict[str, Any]:
        """
        Retrieve pending expense data

        Args:
            confirmation_id: The confirmation ID

        Returns:
            Cached data or None if not found/expired
        """
        return self._cache.get(confirmation_id)

    def delete(self, confirmation_id: str) -> None:
        """Remove confirmed/cancelled expense from cache"""
        if confirmation_id in self._cache:
            del self._cache[confirmation_id]

    def _cleanup_old(self):
        """Remove entries older than 5 minutes"""
        cutoff = datetime.now() - timedelta(minutes=5)
        expired_ids = [
            conf_id for conf_id, data in self._cache.items()
            if data["created_at"] < cutoff
        ]
        for conf_id in expired_ids:
            del self._cache[conf_id]


# Singleton instance
pending_cache = PendingExpenseCache()
