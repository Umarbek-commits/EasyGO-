from pydantic import BaseModel


class RequestCodeSchema(BaseModel):
    phone: str


class VerifyCodeSchema(BaseModel):
    phone: str
    code: str