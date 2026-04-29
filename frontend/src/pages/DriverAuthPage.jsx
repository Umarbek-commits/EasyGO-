import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import { loginDriverWithTunduk } from "../api/client";

function DriverAuthPage() {
  const navigate = useNavigate();
  const [iin, setIin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDriverLogin() {
    setLoading(true);
    setError("");

    try {
      const data = await loginDriverWithTunduk({ iin });

      if (!data.ok) {
        setError(data.message || "Ошибка входа");
        return;
      }

      localStorage.setItem("easygo_token", data.token);
      localStorage.setItem("easygo_user", JSON.stringify(data.user));
      navigate("/driver-home");
    } catch {
      setError("Сервер недоступен");
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
        <h1 className="title">Вход для водителя</h1>
        <p className="subtitle">
          Авторизация через Tunduk пока работает в mock-режиме
        </p>

        <label className="field-label">ИИН</label>
        <input
          className="easy-input"
          type="text"
          placeholder="Введите ИИН"
          value={iin}
          onChange={(e) => setIin(e.target.value)}
        />

        {error ? <div className="error-text">{error}</div> : null}

        <button
          type="button"
          className="primary-dark-btn"
          onClick={handleDriverLogin}
          disabled={loading}
        >
          {loading ? "Входим..." : "Войти через Tunduk"}
        </button>

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

export default DriverAuthPage;