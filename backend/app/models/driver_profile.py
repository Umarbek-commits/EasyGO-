from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from datetime import datetime

from app.core.database import Base


class DriverProfile(Base):
    __tablename__ = "driver_profiles"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    car_model = Column(String, nullable=True)
    car_number = Column(String, nullable=True)
    car_color = Column(String, nullable=True)

    rating_avg = Column(Float, default=5.0)
    rating_count = Column(Integer, default=0)

    status = Column(String, default="offline")

    current_lat = Column(Float, nullable=True)
    current_lng = Column(Float, nullable=True)

    last_location_updated_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)