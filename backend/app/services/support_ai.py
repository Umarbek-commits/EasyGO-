from dataclasses import dataclass
from typing import Optional


@dataclass
class AIResult:
    answered: bool
    answer_text: Optional[str] = None
    category: Optional[str] = None
    needs_operator: bool = False


def decide_support_reply(user_text: str) -> AIResult:
    text = (user_text or "").strip().lower()

    if not text:
        return AIResult(
            answered=True,
            answer_text="Пожалуйста, напишите ваш вопрос чуть подробнее.",
            category="empty",
            needs_operator=False,
        )

    if any(word in text for word in ["отмен", "отмена", "cancel"]):
        return AIResult(
            answered=True,
            answer_text=(
                "Чтобы отменить поездку, откройте текущую поездку и нажмите кнопку отмены. "
                "Если деньги уже списались, напишите, пожалуйста, что именно произошло."
            ),
            category="cancel",
            needs_operator=False,
        )

    if any(word in text for word in ["водитель не приехал", "не приехал", "driver not arrived"]):
        return AIResult(
            answered=True,
            answer_text=(
                "Мне жаль, что водитель не приехал. "
                "Проверьте статус поездки в приложении. "
                "Если поездка уже сорвалась или деньги списались ошибочно, я могу позвать оператора."
            ),
            category="driver_absent",
            needs_operator=False,
        )

    if any(word in text for word in ["деньги", "оплата", "возврат", "не вернули", "refund", "payment"]):
        return AIResult(
            answered=False,
            answer_text=None,
            category="payment_refund",
            needs_operator=True,
        )

    if any(word in text for word in ["жалоб", "плохой водитель", "авар", "опас", "хам", "груб"]):
        return AIResult(
            answered=False,
            answer_text=None,
            category="complaint_safety",
            needs_operator=True,
        )

    if any(word in text for word in ["как пользоваться", "как заказать", "как найти машину"]):
        return AIResult(
            answered=True,
            answer_text=(
                "Чтобы заказать поездку, укажите точку отправления и назначения, "
                "после чего система начнёт поиск подходящего водителя."
            ),
            category="how_to_use",
            needs_operator=False,
        )

    return AIResult(
        answered=False,
        answer_text=None,
        category="unknown",
        needs_operator=True,
    )