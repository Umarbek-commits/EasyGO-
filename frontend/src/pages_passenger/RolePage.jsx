import { useNavigate } from "react-router-dom";
import MobileShell from "../components/MobileShell";

function RolePage() {
  const navigate = useNavigate();

  return (
    <MobileShell className="role-screen" showBottomNav={false}>
      <div className="welcome-glow welcome-glow-top-right" />
      <div className="welcome-glow welcome-glow-bottom-left" />

      <div className="top-brand">
        <span className="brand-black">Easy</span>
        <span className="brand-purple">GO!</span>
      </div>

      <div className="role-card">
        <h1 className="title">Кто вы?</h1>
        <p className="subtitle">Выберите роль для входа в систему</p>

        <button
          type="button"
          className="choice-btn"
          onClick={() => navigate("/driver-auth")}
        >
          Я водитель
        </button>

        <button
          type="button"
          className="choice-btn choice-btn-purple"
          onClick={() => navigate("/passenger-auth")}
        >
          Я клиент
        </button>
      </div>
    </MobileShell>
  );
}

export default RolePage;