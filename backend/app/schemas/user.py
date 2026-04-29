"""User schemas placeholder."""

from pydantic import BaseModel


class UserOut(BaseModel):
    id: int
    phone: str
    name: str | None = None
