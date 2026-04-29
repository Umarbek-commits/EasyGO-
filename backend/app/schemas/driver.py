"""Driver schemas placeholder."""

from pydantic import BaseModel


class DriverOut(BaseModel):
    user_id: int
    car_model: str | None = None
