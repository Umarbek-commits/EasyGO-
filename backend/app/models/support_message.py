from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func

from app.core.database import Base


class SupportMessage(Base):
    __tablename__ = "support_messages"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # user | ai | operator | system
    role = Column(String, nullable=False)

    text = Column(Text, nullable=False)

    is_read = Column(Boolean, default=False)

    # 🔥 НОВОЕ — скрытие вместо удаления
    is_deleted = Column(Boolean, default=False, nullable=False)

    # время уже есть — используем
    created_at = Column(DateTime(timezone=True), server_default=func.now())