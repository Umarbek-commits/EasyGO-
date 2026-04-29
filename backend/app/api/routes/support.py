from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import requests

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.models.user import User
from app.models.support_message import SupportMessage

router = APIRouter(tags=["support"])


def ai_reply(text: str):
    text = text.lower().strip()

    if "отмен" in text:
        return "Вы можете отменить поездку в разделе поездки."

    if "деньги" in text or "оплата" in text or "возврат" in text:
        return None

    if "водитель" in text:
        return "Попробуйте связаться с водителем через приложение. Если проблема не решится, оператор подключится."

    if "как" in text:
        return "Опишите подробнее, и я постараюсь помочь."

    return None


def send_to_telegram(text: str):
    telegram_bot_token = settings.TELEGRAM_BOT_TOKEN
    telegram_chat_id = settings.TELEGRAM_SUPPORT_CHAT_ID

    if not telegram_bot_token or not telegram_chat_id:
        print("Telegram config missing")
        return False

    url = f"https://api.telegram.org/bot{telegram_bot_token}/sendMessage"

    try:
        response = requests.post(
            url,
            json={
                "chat_id": telegram_chat_id,
                "text": text,
            },
            timeout=10,
        )
        return response.ok
    except Exception as e:
        print("Telegram send error:", str(e))
        return False

# =========================
# =========================
# SEND MESSAGE
# =========================
@router.post("/support/send")
def send_message(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    text = data.get("text", "").strip()

    if not text:
        raise HTTPException(status_code=400, detail="Empty message")

    user_msg = SupportMessage(
        user_id=current_user.id,
        role="user",
        text=text,
        is_read=True,
    )

    db.add(user_msg)
    db.flush()

    answer = ai_reply(text)

    if answer:
        ai_msg = SupportMessage(
            user_id=current_user.id,
            role="ai",
            text=answer,
            is_read=False,
        )

        db.add(ai_msg)
        db.commit()

        return {
            "ok": True,
            "mode": "ai",
            "reply": answer,
        }

    system_text = "Пожалуйста, подождите ответа оператора."

    system_msg = SupportMessage(
        user_id=current_user.id,
        role="system",
        text=system_text,
        is_read=False,
    )

    db.add(system_msg)
    db.commit()

    tg_text = (
        f"Новый запрос EasyGO\n\n"
        f"User ID: {current_user.id}\n"
        f"Телефон: {getattr(current_user, 'phone', 'unknown')}\n"
        f"Имя: {getattr(current_user, 'first_name', '')} {getattr(current_user, 'last_name', '')}\n\n"
        f"Сообщение:\n{text}\n\n"
        f"Ответь командой:\n/reply {current_user.id} ваш_ответ"
    )

    send_to_telegram(tg_text)

    return {
        "ok": True,
        "mode": "operator",
        "reply": system_text,
    }


# =========================
# GET MESSAGES (🔥 фильтр скрытых)
# =========================
@router.get("/support/messages")
def get_messages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    messages = (
        db.query(SupportMessage)
        .filter(
            SupportMessage.user_id == current_user.id,
            SupportMessage.is_deleted == False,
        )
        .order_by(SupportMessage.id.asc())
        .all()
    )

    return {
        "ok": True,
        "messages": [
            {
                "id": msg.id,
                "role": msg.role,
                "text": msg.text,
                "created_at": msg.created_at,
            }
            for msg in messages
        ],
    }


# =========================
# 🔥 СКРЫТЬ СТАРЫЕ СООБЩЕНИЯ
# =========================
@router.post("/support/hide-old")
def hide_old_messages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    messages = (
        db.query(SupportMessage)
        .filter(
            SupportMessage.user_id == current_user.id,
            SupportMessage.is_deleted == False,
        )
        .all()
    )

    for msg in messages:
        msg.is_deleted = True

    db.commit()

    return {"ok": True}


# =========================
# TELEGRAM WEBHOOK
# =========================
@router.post("/support/telegram/webhook")
async def telegram_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    data = await request.json()

    message = data.get("message", {})
    text = (message.get("text") or "").strip()

    if not text.startswith("/reply"):
        return {"ok": True}

    try:
        _, user_id, reply_text = text.split(" ", 2)
        user_id = int(user_id)
    except Exception:
        return {"ok": False}

    msg = SupportMessage(
        user_id=user_id,
        role="operator",
        text=reply_text,
        is_read=False,
    )

    db.add(msg)
    db.commit()

    return {"ok": True}