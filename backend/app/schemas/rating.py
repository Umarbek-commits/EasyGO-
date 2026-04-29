"""Rating schemas placeholder."""

from pydantic import BaseModel


class RatingIn(BaseModel):
    ride_id: int
    score: int
    comment: str | None = None
