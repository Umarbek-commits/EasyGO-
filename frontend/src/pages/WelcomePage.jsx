import { useNavigate } from "react-router-dom";

function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="welcome-screen">
      <div className="welcome-glow welcome-glow-top-right" />
      <div className="welcome-glow welcome-glow-bottom-left" />

      <div className="welcome-content">
        <div className="welcome-logo">
          <span className="brand-black">Easy</span>
          <span className="brand-purple">GO!</span>
        </div>

        <button
          type="button"
          className="welcome-btn"
          onClick={() => navigate("/role")}
        >
          Добро пожаловать
        </button>
      </div>

      <div className="welcome-version">v0.0.1</div>
    </div>
  );
}

export default WelcomePage;