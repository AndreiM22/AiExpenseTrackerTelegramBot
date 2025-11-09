from sqlalchemy import Column, String, Numeric, Date, DateTime, ForeignKey, Float, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.models.database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    group_id = Column(String(36), ForeignKey("groups.id"), nullable=True)

    source = Column(String, nullable=False)  # photo | voice | manual
    amount = Column(Numeric(12, 2), nullable=True)
    currency = Column(String(10), nullable=True)
    vendor = Column(Text, nullable=True)  # Encrypted
    vendor_fiscal_code = Column(String(128), nullable=True)
    vendor_registration_number = Column(String(128), nullable=True)
    vendor_address = Column(Text, nullable=True)
    purchase_date = Column(Date, nullable=True)

    category_id = Column(String(36), ForeignKey("categories.id"), nullable=True)
    json_data = Column(JSON, nullable=True)  # Encrypted parsed info from Groq
    ai_confidence = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="expenses")
    category = relationship("Category", back_populates="expenses")
    group = relationship("Group", back_populates="expenses")

    def __repr__(self):
        return f"<Expense {self.id} - {self.amount} {self.currency}>"
