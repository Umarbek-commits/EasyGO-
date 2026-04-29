from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


class SupportSendRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=4000)


class SupportEscalateRequest(BaseModel):
    conversation_id: int


class SupportMessageResponse(BaseModel):
    id: int
    conversation_id: int
    user_id: Optional[int] = None
    role: str
    text: str
    is_read: bool
    needs_operator: bool
    telegram_message_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SupportConversationResponse(BaseModel):
    id: int
    user_id: int
    status: str
    telegram_chat_id: Optional[str] = None
    operator_connected_at: Optional[datetime] = None
    last_message_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SupportMessagesPayload(BaseModel):
    conversation: SupportConversationResponse
    messages: List[SupportMessageResponse]


class SupportSendResponse(BaseModel):
    conversation: SupportConversationResponse
    user_message: SupportMessageResponse
    reply_message: Optional[SupportMessageResponse] = None
    mode: str  # ai | waiting_operator