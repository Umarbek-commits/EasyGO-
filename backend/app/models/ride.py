from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from datetime import datetime

from app.core.database import Base


class Ride(Base):
    __tablename__ = "rides"

    id = Column(Integer, primary_key=True, index=True)

    client_id = Column(Integer, ForeignKey("users.id"))
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    pickup_address = Column(String)
    dropoff_address = Column(String)

    pickup_lat = Column(Float)
    pickup_lng = Column(Float)

    dropoff_lat = Column(Float)
    dropoff_lng = Column(Float)

    payment_method = Column(String)

    status = Column(String, default="searching")

    estimated_price = Column(Float, nullable=True)
    estimated_duration_min = Column(Integer, nullable=True)

    search_started_at = Column(DateTime, default=datetime.utcnow)
    driver_found_at = Column(DateTime, nullable=True)

    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)