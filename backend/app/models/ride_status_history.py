from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from datetime import datetime

from app.core.database import Base


class RideStatusHistory(Base):
    __tablename__ = "ride_status_history"

    id = Column(Integer, primary_key=True, index=True)

    ride_id = Column(Integer, ForeignKey("rides.id"))

    old_status = Column(String)
    new_status = Column(String)

    changed_by_user_id = Column(Integer, ForeignKey("users.id"))

    created_at = Column(DateTime, default=datetime.utcnow)
    