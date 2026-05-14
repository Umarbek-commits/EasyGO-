from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Импорт роутов (исправлен импорт ws)
from app.api.routes import auth, users, rides, support, drivers
from app.api.ws import router as ws_router

from app.core.config import settings
from app.core.database import Base, engine
from app.models import *


app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.APP_DEBUG,
)

app.include_router(ws_router, prefix=settings.API_PREFIX)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://easy-go-git-main-sidikovoatillo44-2899s-projects.vercel.app",
        "https://easy-go.vercel.app",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ROUTES
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(users.router, prefix=settings.API_PREFIX)
app.include_router(rides.router, prefix=settings.API_PREFIX)
app.include_router(support.router, prefix=settings.API_PREFIX)
app.include_router(drivers.router, prefix=settings.API_PREFIX)  # Drivers роутер
app.include_router(ws.router, prefix=settings.API_PREFIX)  # WebSocket роутер


@app.get("/")
def root():
    return {
        "message": "EasyGO API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok"
    }


# создаём таблицы (включая support_messages)
Base.metadata.create_all(bind=engine)


print("API is ready to serve requests")