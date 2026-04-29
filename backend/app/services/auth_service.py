from sqlalchemy.orm import Session

from app.models.user import User
from app.core.security import create_access_token


def get_or_create_user(db: Session, phone: str, role: str):
    user = db.query(User).filter(User.phone == phone).first()

    if not user:
        user = User(
            phone=phone,
            role=role,
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user


def login_user(user: User):
    token = create_access_token(
        data={"user_id": user.id, "role": user.role}
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "phone": user.phone,
            "role": user.role
        }
    }