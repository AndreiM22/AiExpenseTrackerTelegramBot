from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.models.database import Base


class Group(Base):
    __tablename__ = "groups"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    expenses = relationship("Expense", back_populates="group")
    user_groups = relationship("UserGroup", back_populates="group", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Group {self.name}>"
