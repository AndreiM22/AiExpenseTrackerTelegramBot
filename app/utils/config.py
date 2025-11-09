from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://expenseuser:expensepass@db:5432/expensebot"

    # Groq AI
    GROQ_API_KEY: str

    # Security
    ENCRYPTION_KEY: str
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24

    # Telegram
    TELEGRAM_BOT_TOKEN: str

    # Access Control
    ALLOWED_GROUP_ID: int = -5028155280  # Group ID care poate folosi bot-ul
    ALLOWED_USER_IDS: str = ""  # Lista de user IDs separați prin virgulă
    DEFAULT_USER_ID: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
