import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import {
  requestPassengerCode,
  verifyPassengerCode,
} from "../api/client";

function PassengerAuthPage() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [mockCode, setMockCode] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRequestCode() {
  setLoading(true);
  setError("");

  try {
    const data = await requestPassengerCode(phone);

    if (!data || !data.code) {
      setError(data?.detail || data?.message || "Ошибка отправки кода");
      return;
    }

    setMockCode(data.code);
    setStep(2);
  } catch (err) {
    setError(err.message || "Сервер недоступен");
  } finally {
    setLoading(false);
  }
}

async function handleVerifyCode() {
  setLoading(true);
  setError("");

  try {
    const data = await verifyPassengerCode(phone, code);

    if (!data || !data.access_token || !data.user) {
      setError(data?.detail || data?.message || "Неверный код");
      return;
    }

    localStorage.setItem("easygo_token", data.access_token);
    localStorage.setItem("easygo_user", JSON.stringify(data.user));
    navigate("/home");
  } catch (err) {
    setError(err.message || "Сервер недоступен");
  } finally {
    setLoading(false);
  }
}

  return (
    <MobileShell className="auth-screen" showBottomNav={false}>
      <div className="welcome-glow welcome-glow-top-right" />
      <div className="welcome-glow welcome-glow-bottom-left" />

      <div className="top-brand auth-brand">
        <span className="brand-black">Easy</span>
        <span className="brand-purple">GO!</span>
      </div>

      <div className="auth-card">
        <h1 className="title">Вход для клиента</h1>
        <p className="subtitle">Введите номер телефона</p>

        <label className="field-label">Номер телефона</label>
        <input
          className="easy-input"
          type="text"
          placeholder="+996 700 00 00 00"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        {step === 2 && (
          <>
            <label className="field-label">Код подтверждения</label>
            <input
              className="easy-input"
              type="text"
              placeholder="Введите код"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />

            <div className="mock-hint">Тестовый код: {mockCode}</div>
          </>
        )}

        {error ? <div className="error-text">{error}</div> : null}

        {step === 1 ? (
          <button
            type="button"
            className="primary-dark-btn"
            onClick={handleRequestCode}
            disabled={loading}
          >
            {loading ? "Отправляем..." : "Получить код"}
          </button>
        ) : (
          <button
            type="button"
            className="primary-purple-btn"
            onClick={handleVerifyCode}
            disabled={loading}
          >
            {loading ? "Проверяем..." : "Войти"}
          </button>
        )}

        <button
          type="button"
          className="back-link-btn"
          onClick={() => navigate("/role")}
        >
          Назад
        </button>
      </div>
    </MobileShell>
  );
}

export default PassengerAuthPage;