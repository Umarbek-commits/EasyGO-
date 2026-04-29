from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.auth import RequestCodeSchema, VerifyCodeSchema
from app.services.otp_service import create_otp_code
from app.services.auth_service import get_or_create_user, login_user
from app.models.otp_code import OTPCode
from app.models.driver_profile import DriverProfile

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/passenger/request-code")
def request_code(data: RequestCodeSchema, db: Session = Depends(get_db)):
    create_otp_code(db, phone=data.phone, role="client")

    return {
        "message": "Code sent",
        "code": "1234",
        "ok": True,
    }


@router.post("/passenger/verify-code")
def verify_code(data: VerifyCodeSchema, db: Session = Depends(get_db)):
    otp = db.query(OTPCode).filter(
        OTPCode.phone == data.phone,
        OTPCode.code == data.code,
        OTPCode.is_used == False
    ).first()

    if not otp:
        raise HTTPException(status_code=400, detail="Invalid code")

    otp.is_used = True
    db.commit()

    user = get_or_create_user(db, phone=data.phone, role="client")
    result = login_user(user)

    return {
        "ok": True,
        "access_token": result["access_token"],
        "token": result["access_token"],
        "token_type": result["token_type"],
        "user": result["user"],
    }


@router.post("/driver/tunduk")
def driver_tunduk_login(
    payload: dict | None = Body(default=None),
    db: Session = Depends(get_db),
):
    iin = str((payload or {}).get("iin") or "")
    mock_phone = "+996555000111"

    user = get_or_create_user(db, phone=mock_phone, role="driver")

    if not user.first_name:
        user.first_name = "Айбек"
        user.last_name = "Т."
        user.is_verified = True
        db.commit()
        db.refresh(user)

    driver_profile = db.query(DriverProfile).filter(
        DriverProfile.user_id == user.id
    ).first()

    if not driver_profile:
        driver_profile = DriverProfile(
            user_id=user.id,
            car_model="Honda Fit",
            car_number="01KG123ABC",
            car_color="Белый",
            rating_avg=4.9,
            rating_count=120,
            status="online",
        )
        db.add(driver_profile)
        db.commit()
        db.refresh(driver_profile)

    result = login_user(user)

    return {
        "ok": True,
        "message": "Tunduk login success",
        "access_token": result["access_token"],
        "token": result["access_token"],
        "token_type": result["token_type"],
        "user": {
            **result["user"],
            "first_name": user.first_name,
            "last_name": user.last_name,
            "iin": iin,
            "driver_profile": {
                "car_model": driver_profile.car_model,
                "car_number": driver_profile.car_number,
                "car_color": driver_profile.car_color,
                "rating_avg": driver_profile.rating_avg,
                "rating_count": driver_profile.rating_count,
                "status": driver_profile.status,
            },
        },
    }