from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.models.database import Base


class UserGroup(Base):
    __tablename__ = "user_groups"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    group_id = Column(String(36), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False, default="member")  # member | admin
    joined_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="user_groups")
    group = relationship("Group", back_populates="user_groups")

    def __repr__(self):
        return f"<UserGroup user={self.user_id} group={self.group_id} role={self.role}>"
