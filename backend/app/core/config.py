from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "EasyGO API"
    APP_DEBUG: bool = True
    API_PREFIX: str = "/api"

    DATABASE_URL: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    CORS_ORIGINS: str = "http://localhost:5173"

    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_SUPPORT_CHAT_ID: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()