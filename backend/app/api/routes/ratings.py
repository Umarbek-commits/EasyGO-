"""Ratings routes placeholder."""

from fastapi import APIRouter

router = APIRouter()

@router.get("/ratings/ping")
def ping():
    return {"ok": True}
