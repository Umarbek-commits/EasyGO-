from datetime import datetime
import math
import random

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.ride import Ride
from app.models.user import User
from app.models.driver_profile import DriverProfile

# Импорт WebSocket для отправки уведомлений (ПРАВИЛЬНЫЙ ПУТЬ)
from app.api.ws import broadcast_new_ride

router = APIRouter(tags=["Rides"])

ACTIVE_RIDE_STATUSES = {"searching", "driver_found", "accepted", "arrived", "in_progress"}


class CreateRideSchema(BaseModel):
    pickup_address: str
    dropoff_address: str
    pickup_lat: float
    pickup_lng: float
    dropoff_lat: float
    dropoff_lng: float
    payment_method: str = "cash"
    driver_id: int | None = None


class MatchDriversSchema(BaseModel):
    pickup_lat: float
    pickup_lng: float
    dropoff_lat: float
    dropoff_lng: float


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0

    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


def calculate_eta_min(from_lat: float, from_lng: float, to_lat: float, to_lng: float) -> int:
    distance_km = haversine_km(from_lat, from_lng, to_lat, to_lng)

    avg_city_speed_kmh = 30.0
    eta_hours = distance_km / avg_city_speed_kmh if avg_city_speed_kmh > 0 else 0
    eta_min = max(1, math.ceil(eta_hours * 60))

    return eta_min


def move_towards(current: float, target: float, step_ratio: float = 0.22) -> float:
    return current + (target - current) * step_ratio


def ensure_driver_start_position(profile: DriverProfile, ride: Ride) -> None:
    if profile.current_lat is not None and profile.current_lng is not None:
        return

    lat_offset = random.uniform(0.010, 0.025)
    lng_offset = random.uniform(0.010, 0.025)

    profile.current_lat = ride.pickup_lat + lat_offset
    profile.current_lng = ride.pickup_lng + lng_offset
    profile.last_location_updated_at = datetime.utcnow()
    profile.updated_at = datetime.utcnow()


def serialize_driver(
    driver_user: User | None,
    driver_profile: DriverProfile | None,
    ride: Ride | None = None,
) -> dict | None:
    if not driver_user or not driver_profile:
        return None

    eta_min = None
    trip_eta_min = None

    if (
        ride
        and driver_profile.current_lat is not None
        and driver_profile.current_lng is not None
    ):
        if ride.status == "in_progress":
            trip_eta_min = calculate_eta_min(
                driver_profile.current_lat,
                driver_profile.current_lng,
                ride.dropoff_lat,
                ride.dropoff_lng,
            )
        else:
            eta_min = calculate_eta_min(
                driver_profile.current_lat,
                driver_profile.current_lng,
                ride.pickup_lat,
                ride.pickup_lng,
            )

    return {
        "id": driver_user.id,
        "first_name": driver_user.first_name,
        "last_name": driver_user.last_name,
        "phone": driver_user.phone,
        "car_model": driver_profile.car_model,
        "car_number": driver_profile.car_number,
        "car_color": driver_profile.car_color,
        "rating_avg": driver_profile.rating_avg,
        "rating_count": driver_profile.rating_count,
        "status": driver_profile.status,
        "current_lat": driver_profile.current_lat,
        "current_lng": driver_profile.current_lng,
        "eta_min": eta_min,
        "trip_eta_min": trip_eta_min,
    }


def serialize_ride(ride: Ride, db: Session) -> dict:
    driver_user = None
    driver_profile = None
    eta_min = None
    trip_eta_min = None

    if ride.driver_id:
        driver_user = db.query(User).filter(User.id == ride.driver_id).first()
        if driver_user:
            driver_profile = (
                db.query(DriverProfile)
                .filter(DriverProfile.user_id == driver_user.id)
                .first()
            )

    if (
        driver_profile
        and driver_profile.current_lat is not None
        and driver_profile.current_lng is not None
    ):
        if ride.status == "in_progress":
            trip_eta_min = calculate_eta_min(
                driver_profile.current_lat,
                driver_profile.current_lng,
                ride.dropoff_lat,
                ride.dropoff_lng,
            )
        else:
            eta_min = calculate_eta_min(
                driver_profile.current_lat,
                driver_profile.current_lng,
                ride.pickup_lat,
                ride.pickup_lng,
            )

    return {
        "id": ride.id,
        "client_id": ride.client_id,
        "driver_id": ride.driver_id,
        "pickup_address": ride.pickup_address,
        "dropoff_address": ride.dropoff_address,
        "pickup_lat": ride.pickup_lat,
        "pickup_lng": ride.pickup_lng,
        "dropoff_lat": ride.dropoff_lat,
        "dropoff_lng": ride.dropoff_lng,
        "payment_method": ride.payment_method,
        "status": ride.status,
        "estimated_price": ride.estimated_price,
        "estimated_duration_min": ride.estimated_duration_min,
        "eta_min": eta_min,
        "trip_eta_min": trip_eta_min,
        "search_started_at": ride.search_started_at.isoformat() if ride.search_started_at else None,
        "driver_found_at": ride.driver_found_at.isoformat() if ride.driver_found_at else None,
        "started_at": ride.started_at.isoformat() if ride.started_at else None,
        "completed_at": ride.completed_at.isoformat() if ride.completed_at else None,
        "cancelled_at": ride.cancelled_at.isoformat() if ride.cancelled_at else None,
        "created_at": ride.created_at.isoformat() if ride.created_at else None,
        "updated_at": ride.updated_at.isoformat() if ride.updated_at else None,
        "driver": serialize_driver(driver_user, driver_profile, ride),
    }


def get_driver_profile_by_user_id(db: Session, user_id: int) -> DriverProfile | None:
    return (
        db.query(DriverProfile)
        .filter(DriverProfile.user_id == user_id)
        .first()
    )


def calculate_route_match_score(
    pickup_lat: float,
    pickup_lng: float,
    dropoff_lat: float,
    dropoff_lng: float,
    driver_profile: DriverProfile,
) -> float:
    if driver_profile.current_lat is None or driver_profile.current_lng is None:
        return 0.0

    distance_to_pickup = haversine_km(
        pickup_lat,
        pickup_lng,
        driver_profile.current_lat,
        driver_profile.current_lng,
    )

    proximity_score = max(0.0, 100.0 - distance_to_pickup * 28.0)

    route_direct_distance = haversine_km(
        pickup_lat,
        pickup_lng,
        dropoff_lat,
        dropoff_lng,
    )
    route_bonus = min(18.0, route_direct_distance * 2.5)

    score = proximity_score + route_bonus
    return round(score, 1)


@router.get("/rides/ping")
def ping():
    return {"ok": True}


@router.get("/driver/available")
def get_available_rides(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Проверяем, что пользователь - водитель
    if current_user.role != "driver":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only drivers can view available rides",
        )

    # Ищем активные поездки со статусом "searching"
    rides = db.query(Ride).filter(Ride.status == "searching").all()

    result = []
    for ride in rides:
        result.append({
            "id": ride.id,
            "pickup": ride.pickup_address,
            "dropoff": ride.dropoff_address,
            "pickup_lat": ride.pickup_lat,
            "pickup_lng": ride.pickup_lng,
            "dropoff_lat": ride.dropoff_lat,
            "dropoff_lng": ride.dropoff_lng,
            "price": ride.estimated_price or 120,
            "distance": round(haversine_km(
                ride.pickup_lat, ride.pickup_lng,
                ride.dropoff_lat, ride.dropoff_lng
            ), 1),
            "time": calculate_eta_min(
                ride.pickup_lat, ride.pickup_lng,
                ride.dropoff_lat, ride.dropoff_lng
            ),
        })

    return {"rides": result}


@router.post("/rides/{ride_id}/accept")
def accept_ride(
    ride_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Проверяем, что пользователь - водитель
    if current_user.role != "driver":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only drivers can accept rides",
        )

    ride = db.query(Ride).filter(Ride.id == ride_id).first()

    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ride not found",
        )

    if ride.status != "searching":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ride is not available for acceptance",
        )

    # Назначаем водителя на поездку
    ride.driver_id = current_user.id
    ride.status = "accepted"
    ride.driver_found_at = datetime.utcnow()
    ride.updated_at = datetime.utcnow()

    # Обновляем профиль водителя
    driver_profile = get_driver_profile_by_user_id(db, current_user.id)
    if driver_profile:
        driver_profile.status = "busy"
        driver_profile.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(ride)

    return {
        "ok": True,
        "ride": {
            "id": ride.id,
            "status": ride.status,
            "driver_id": ride.driver_id,
        },
    }


@router.get("/driver/current")
def driver_current_ride(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Проверяем, что пользователь - водитель
    if current_user.role != "driver":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only drivers can view their current ride",
        )

    ride = db.query(Ride).filter(
        Ride.driver_id == current_user.id,
        Ride.status.in_(["accepted", "arrived", "in_progress"])
    ).first()

    if not ride:
        return {"ride": None}

    return {
        "ride": {
            "id": ride.id,
            "pickup": ride.pickup_address,
            "dropoff": ride.dropoff_address,
            "pickup_lat": ride.pickup_lat,
            "pickup_lng": ride.pickup_lng,
            "dropoff_lat": ride.dropoff_lat,
            "dropoff_lng": ride.dropoff_lng,
            "status": ride.status,
            "client_id": ride.client_id,
        }
    }


@router.post("/rides/matches")
def find_matching_drivers(
    payload: MatchDriversSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clients can search drivers",
        )

    existing_ride = (
        db.query(Ride)
        .filter(
            Ride.client_id == current_user.id,
            Ride.status.in_(ACTIVE_RIDE_STATUSES),
        )
        .order_by(Ride.created_at.desc())
        .first()
    )

    if existing_ride:
        return {
            "ok": True,
            "drivers": [],
            "message": "Active ride already exists",
            "ride": serialize_ride(existing_ride, db),
        }

    available_profiles = (
        db.query(DriverProfile)
        .join(User, User.id == DriverProfile.user_id)
        .filter(
            User.role == "driver",
            User.is_active == True,
            DriverProfile.status == "online",
        )
        .all()
    )

    drivers = []

    for profile in available_profiles:
        if profile.current_lat is None or profile.current_lng is None:
            continue

        distance_km = haversine_km(
            payload.pickup_lat,
            payload.pickup_lng,
            profile.current_lat,
            profile.current_lng,
        )

        if distance_km > 3.5:
            continue

        driver_user = db.query(User).filter(User.id == profile.user_id).first()
        if not driver_user:
            continue

        score = calculate_route_match_score(
            payload.pickup_lat,
            payload.pickup_lng,
            payload.dropoff_lat,
            payload.dropoff_lng,
            profile,
        )

        eta_min = calculate_eta_min(
            profile.current_lat,
            profile.current_lng,
            payload.pickup_lat,
            payload.pickup_lng,
        )

        drivers.append(
            {
                "driver_id": driver_user.id,
                "name": driver_user.first_name or "Водитель",
                "phone": driver_user.phone,
                "car": f"{profile.car_color or ''} {profile.car_model or ''}".strip(),
                "plate": profile.car_number,
                "car_color": profile.car_color,
                "car_model": profile.car_model,
                "distance_km": round(distance_km, 2),
                "eta_min": eta_min,
                "score": score,
                "lat": profile.current_lat,
                "lng": profile.current_lng,
                "meeting_point": "Подойдите к ближайшей удобной точке встречи",
                "rating_avg": profile.rating_avg,
                "rating_count": profile.rating_count,
            }
        )

    drivers.sort(key=lambda item: (-item["score"], item["distance_km"]))

    return {
        "ok": True,
        "drivers": drivers[:4],
    }


@router.post("/rides")
async def create_ride(
    payload: CreateRideSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clients can create rides",
        )

    existing_ride = (
        db.query(Ride)
        .filter(
            Ride.client_id == current_user.id,
            Ride.status.in_(ACTIVE_RIDE_STATUSES),
        )
        .order_by(Ride.created_at.desc())
        .first()
    )

    if existing_ride:
        return {
            "ok": True,
            "message": "Active ride already exists",
            "ride": serialize_ride(existing_ride, db),
        }

    selected_driver_profile = None

    if payload.driver_id is not None:
        selected_driver = db.query(User).filter(User.id == payload.driver_id).first()
        if not selected_driver or selected_driver.role != "driver":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Selected driver not found",
            )

        selected_driver_profile = get_driver_profile_by_user_id(db, selected_driver.id)
        if not selected_driver_profile or selected_driver_profile.status != "online":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected driver is not online",
            )

    ride = Ride(
        client_id=current_user.id,
        driver_id=payload.driver_id,
        pickup_address=payload.pickup_address,
        dropoff_address=payload.dropoff_address,
        pickup_lat=payload.pickup_lat,
        pickup_lng=payload.pickup_lng,
        dropoff_lat=payload.dropoff_lat,
        dropoff_lng=payload.dropoff_lng,
        payment_method=payload.payment_method,
        status="accepted" if payload.driver_id is not None else "searching",
        estimated_price=180.0,
        estimated_duration_min=12,
        search_started_at=datetime.utcnow(),
        driver_found_at=datetime.utcnow() if payload.driver_id is not None else None,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    db.add(ride)
    db.commit()
    db.refresh(ride)

    if selected_driver_profile:
        ensure_driver_start_position(selected_driver_profile, ride)
        db.commit()
        db.refresh(ride)

    # Отправляем уведомление всем водителям через WebSocket
    if ride.status == "searching":
        await broadcast_new_ride({
            "id": ride.id,
            "pickup_address": ride.pickup_address,
            "dropoff_address": ride.dropoff_address,
            "pickup_lat": ride.pickup_lat,
            "pickup_lng": ride.pickup_lng,
            "dropoff_lat": ride.dropoff_lat,
            "dropoff_lng": ride.dropoff_lng,
            "estimated_price": ride.estimated_price,
        })

    return {
        "ok": True,
        "message": "Ride created",
        "ride": serialize_ride(ride, db),
    }


@router.get("/rides/current")
def get_current_ride(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == "client":
        ride = (
            db.query(Ride)
            .filter(
                Ride.client_id == current_user.id,
                Ride.status.in_(ACTIVE_RIDE_STATUSES),
            )
            .order_by(Ride.created_at.desc())
            .first()
        )
    elif current_user.role == "driver":
        ride = (
            db.query(Ride)
            .filter(
                Ride.driver_id == current_user.id,
                Ride.status.in_(ACTIVE_RIDE_STATUSES),
            )
            .order_by(Ride.created_at.desc())
            .first()
        )
    else:
        ride = None

    if ride and ride.status == "searching" and ride.driver_id is None and ride.search_started_at:
        seconds_passed = (datetime.utcnow() - ride.search_started_at).total_seconds()

        if seconds_passed >= 5:
            available_profiles = (
                db.query(DriverProfile)
                .join(User, User.id == DriverProfile.user_id)
                .filter(
                    User.role == "driver",
                    User.is_active == True,
                    DriverProfile.status == "online",
                )
                .all()
            )

            if available_profiles:
                selected_profile = random.choice(available_profiles)

                ensure_driver_start_position(selected_profile, ride)

                ride.status = "driver_found"
                ride.driver_id = selected_profile.user_id
                ride.driver_found_at = datetime.utcnow()
                ride.updated_at = datetime.utcnow()

                db.commit()
                db.refresh(ride)

    if ride and ride.driver_id and ride.status in {"driver_found", "accepted"}:
        driver_profile = (
            db.query(DriverProfile)
            .filter(DriverProfile.user_id == ride.driver_id)
            .first()
        )

        if driver_profile and driver_profile.current_lat is not None and driver_profile.current_lng is not None:
            distance_km = haversine_km(
                driver_profile.current_lat,
                driver_profile.current_lng,
                ride.pickup_lat,
                ride.pickup_lng,
            )

            if distance_km <= 0.08:
                ride.status = "arrived"
                ride.updated_at = datetime.utcnow()
            else:
                driver_profile.current_lat = move_towards(driver_profile.current_lat, ride.pickup_lat)
                driver_profile.current_lng = move_towards(driver_profile.current_lng, ride.pickup_lng)
                driver_profile.last_location_updated_at = datetime.utcnow()
                driver_profile.updated_at = datetime.utcnow()
                ride.updated_at = datetime.utcnow()

            db.commit()
            db.refresh(ride)

    if ride and ride.driver_id and ride.status == "in_progress":
        driver_profile = (
            db.query(DriverProfile)
            .filter(DriverProfile.user_id == ride.driver_id)
            .first()
        )

        if driver_profile and driver_profile.current_lat is not None and driver_profile.current_lng is not None:
            distance_km = haversine_km(
                driver_profile.current_lat,
                driver_profile.current_lng,
                ride.dropoff_lat,
                ride.dropoff_lng,
            )

            if distance_km <= 0.08:
                ride.status = "completed"
                ride.completed_at = datetime.utcnow()
                ride.updated_at = datetime.utcnow()
            else:
                driver_profile.current_lat = move_towards(driver_profile.current_lat, ride.dropoff_lat)
                driver_profile.current_lng = move_towards(driver_profile.current_lng, ride.dropoff_lng)
                driver_profile.last_location_updated_at = datetime.utcnow()
                driver_profile.updated_at = datetime.utcnow()
                ride.updated_at = datetime.utcnow()

            db.commit()
            db.refresh(ride)

    return {
        "ok": True,
        "ride": serialize_ride(ride, db) if ride else None,
    }


@router.post("/rides/current/start")
def start_current_ride(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clients can start rides",
        )

    ride = (
        db.query(Ride)
        .filter(
            Ride.client_id == current_user.id,
            Ride.status.in_(ACTIVE_RIDE_STATUSES),
        )
        .order_by(Ride.created_at.desc())
        .first()
    )

    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active ride not found",
        )

    if ride.status != "arrived":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ride is not ready to start",
        )

    ride.status = "in_progress"
    ride.started_at = datetime.utcnow()
    ride.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(ride)

    return {
        "ok": True,
        "message": "Ride started",
        "ride": serialize_ride(ride, db),
    }


@router.post("/rides/current/cancel")
def cancel_current_ride(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clients can cancel rides",
        )

    ride = (
        db.query(Ride)
        .filter(
            Ride.client_id == current_user.id,
            Ride.status.in_(ACTIVE_RIDE_STATUSES),
        )
        .order_by(Ride.created_at.desc())
        .first()
    )

    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active ride not found",
        )

    ride.status = "cancelled"
    ride.cancelled_at = datetime.utcnow()
    ride.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(ride)

    return {
        "ok": True,
        "message": "Ride cancelled",
        "ride": serialize_ride(ride, db),
    }
