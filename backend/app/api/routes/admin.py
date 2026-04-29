"""Admin routes placeholder."""

from fastapi import APIRouter

router = APIRouter()

@router.get("/admin/ping")
def ping():
    return {"ok": True}
