from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.otp_code import OTPCode


def create_otp_code(db: Session, phone: str, role: str):
    code = "1234"  # mock

    otp = OTPCode(
        phone=phone,
        code=code,
        role=role,
        expires_at=datetime.utcnow() + timedelta(minutes=5),
        is_used=False
    )

    db.add(otp)
    db.commit()
    db.refresh(otp)

    return otp