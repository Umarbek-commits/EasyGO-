"""Ride schemas placeholder."""

from pydantic import BaseModel


class RideOut(BaseModel):
    id: int
    origin: str
    destination: str
