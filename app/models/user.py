from sqlalchemy import Column, String, DateTime, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.models.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, nullable=True)
    display_name = Column(String, nullable=True)
    telegram_user_id = Column(Integer, unique=True, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    categories = relationship("Category", back_populates="user", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="owner", cascade="all, delete-orphan")
    user_groups = relationship("UserGroup", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.username or self.id}>"
