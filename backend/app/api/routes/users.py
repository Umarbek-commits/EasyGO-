from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User

router = APIRouter(tags=["Users"])


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "phone": user.phone,
        "role": user.role,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "photo_url": user.photo_url,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
    }


@router.get("/users/ping")
def ping():
    return {"ok": True}


@router.get("/users/me")
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return {
        "ok": True,
        "user": serialize_user(current_user),
    }


# =========================