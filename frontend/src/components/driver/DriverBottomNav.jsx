import { useNavigate } from "react-router-dom";

function DriverBottomNav({ activeTab }) {
  const navigate = useNavigate();

  return (
    <div className="bottom-nav">
      <button
        className={activeTab === "map" ? "active" : ""}
        onClick={() => navigate("/driver/home")}
      >
        Заказы
      </button>

      <button
        className={activeTab === "profile" ? "active" : ""}
        onClick={() => navigate("/driver/profile")}
      >
        Профиль
      </button>
    </div>
  );
}

export default DriverBottomNav;