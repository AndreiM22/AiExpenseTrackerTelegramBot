from sqlalchemy.orm import Session

from app.models.user import User
from app.utils.config import settings


def get_active_user_id(db: Session) -> str:
    """
    Temporary helper until proper auth is in place.
    Returns DEFAULT_USER_ID from settings, or falls back to the first user in DB.
    """
    default_id = (settings.DEFAULT_USER_ID or "").strip()
    if default_id:
        return default_id

    user = db.query(User.id).order_by(User.created_at.asc()).first()
    if not user:
        raise ValueError("No default user available. Please seed at least one user or set DEFAULT_USER_ID.")

    return str(user.id)
