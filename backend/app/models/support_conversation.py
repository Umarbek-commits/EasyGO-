from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class SupportConversation(Base):
    __tablename__ = "support_conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # open | ai | waiting_operator | closed
    status = Column(String, nullable=False, default="ai", index=True)

    # telegram chat id оператора/группы, куда эскалируем
    telegram_chat_id = Column(String, nullable=True)

    # когда оператор реально подключился
    operator_connected_at = Column(DateTime(timezone=True), nullable=True)

    # просто тех. метка
    last_message_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user = relationship("User")
    messages = relationship(
        "SupportMessage",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="SupportMessage.created_at.asc()",
    )