"""Drivers routes for managing driver routes and locations."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.driver_profile import DriverProfile
from app.core.security import get_current_user


router = APIRouter(tags=["Drivers"])


class DriverRouteSchema(BaseModel):
    from_address: str
    to_address: str
    from_lat: float | None = None
    from_lng: float | None = None
    to_lat: float | None = None
    to_lng: float | None = None


class DriverLocationSchema(BaseModel):
    lat: float
    lng: float


def match_routes(client_from: str, client_to: str, driver_from: str, driver_to: str) -> bool:
    """Check if driver route matches client route."""
    if not driver_from or not driver_to:
        return False

    return (
        client_from.lower() in driver_from.lower()
        or client_to.lower() in driver_to.lower()
    )


@router.get("/drivers/match")
def match_drivers(
    from_: str, 
    to: str, 
    db: Session = Depends(get_db)
):
    """Find drivers whose routes match the client's route."""
    
    # Получаем всех водителей с онлайн статусом
    drivers = (
        db.query(User)
        .join(DriverProfile, User.id == DriverProfile.user_id)
        .filter(
            User.role == "driver",
            DriverProfile.status == "online"
        )
        .all()
    )

    result = []

    for driver in drivers:
        # Получаем профиль водителя
        driver_profile = (
            db.query(DriverProfile)
            .filter(DriverProfile.user_id == driver.id)
            .first()
        )
        
        if not driver_profile:
            continue
            
        # Проверяем совпадение маршрутов
        if match_routes(
            from_, 
            to, 
            getattr(driver_profile, "route_from", ""), 
            getattr(driver_profile, "route_to", "")
        ):
            # Получаем текущую геолокацию водителя
            current_lat = driver_profile.current_lat
            current_lng = driver_profile.current_lng
            
            result.append({
                "driver_id": driver.id,
                "name": driver.first_name or "Водитель",
                "car": driver_profile.car_model or "Машина не указана",
                "plate": driver_profile.car_number or "XXXXXXX",
                "price": 120,  # Базовая цена, позже можно рассчитать динамически
                "lat": current_lat,
                "lng": current_lng,
                "rating": driver_profile.rating_avg or 5.0,
            })

    return {"drivers": result}


@router.post("/driver/set-route")
def set_driver_route(
    data: DriverRouteSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Set driver's current route (where they are going)."""
    
    # Проверяем, что пользователь - водитель
    if current_user.role != "driver":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only drivers can set route",
        )
    
    # Получаем профиль водителя
    driver_profile = db.query(DriverProfile).filter(DriverProfile.user_id == current_user.id).first()
    
    if not driver_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver profile not found",
        )
    
    # Сохраняем маршрут в профиле водителя
    driver_profile.route_from = data.from_address
    driver_profile.route_to = data.to_address
    
    if data.from_lat and data.from_lng:
        driver_profile.route_from_lat = data.from_lat
        driver_profile.route_from_lng = data.from_lng
    
    if data.to_lat and data.to_lng:
        driver_profile.route_to_lat = data.to_lat
        driver_profile.route_to_lng = data.to_lng
    
    driver_profile.status = "online"  # Водитель становится онлайн
    driver_profile.updated_at = db.func.now()
    
    db.commit()
    
    return {
        "ok": True,
        "message": "Route set successfully",
        "data": {
            "from": data.from_address,
            "to": data.to_address,
        }
    }


@router.post("/driver/update-location")
def update_driver_location(
    data: DriverLocationSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update driver's current location."""
    
    # Проверяем, что пользователь - водитель
    if current_user.role != "driver":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only drivers can update location",
        )
    
    # Получаем профиль водителя
    driver_profile = db.query(DriverProfile).filter(DriverProfile.user_id == current_user.id).first()
    
    if not driver_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver profile not found",
        )
    
    # Обновляем местоположение
    driver_profile.current_lat = data.lat
    driver_profile.current_lng = data.lng
    driver_profile.last_location_updated_at = db.func.now()
    driver_profile.updated_at = db.func.now()
    
    db.commit()
    
    return {
        "ok": True,
        "message": "Location updated",
        "location": {
            "lat": data.lat,
            "lng": data.lng,
        }
    }


@router.get("/driver/route")
def get_driver_route(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get driver's current route."""
    
    # Проверяем, что пользователь - водитель
    if current_user.role != "driver":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only drivers can get route",
        )
    
    # Получаем профиль водителя
    driver_profile = db.query(DriverProfile).filter(DriverProfile.user_id == current_user.id).first()
    
    if not driver_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver profile not found",
        )
    
    return {
        "ok": True,
        "route": {
            "from": getattr(driver_profile, "route_from", None),
            "to": getattr(driver_profile, "route_to", None),
            "from_lat": getattr(driver_profile, "route_from_lat", None),
            "from_lng": getattr(driver_profile, "route_from_lng", None),
            "to_lat": getattr(driver_profile, "route_to_lat", None),
            "to_lng": getattr(driver_profile, "route_to_lng", None),
        },
        "status": driver_profile.status,
    }


@router.post("/driver/go-offline")
def driver_go_offline(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Set driver status to offline."""
    
    # Проверяем, что пользователь - водитель
    if current_user.role != "driver":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only drivers can go offline",
        )
    
    # Получаем профиль водителя
    driver_profile = db.query(DriverProfile).filter(DriverProfile.user_id == current_user.id).first()
    
    if not driver_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver profile not found",
        )
    
    driver_profile.status = "offline"
    driver_profile.updated_at = db.func.now()
    
    db.commit()
    
    return {
        "ok": True,
        "message": "Driver is now offline",
        "status": driver_profile.status,
    }


@router.get("/drivers/ping")
def ping():
    return {"ok": True}