import { useNavigate } from "react-router-dom";

function PassengerBottomNav({ activeTab }) {
  const navigate = useNavigate();

  return (
    <div className="bottom-nav">
      <button
        className={activeTab === "map" ? "active" : ""}
        onClick={() => navigate("/passenger/home")}
      >
        Карта
      </button>

      <button
        className={activeTab === "profile" ? "active" : ""}
        onClick={() => navigate("/passenger/profile")}
      >
        Профиль
      </button>
    </div>
  );
}

export default PassengerBottomNav;