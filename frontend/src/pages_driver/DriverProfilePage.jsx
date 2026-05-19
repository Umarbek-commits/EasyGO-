import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DriverMobileShell from "../components/DriverMobileShell";
import paymentMethodsIcon from "../assets/Icon/profile/payment-methods.svg";
import promoIcon from "../assets/Icon/profile/promo.svg";
import historyIcon from "../assets/Icon/profile/history.png";
import notificationsIcon from "../assets/Icon/profile/notifications.png";
import addressIcon from "../assets/Icon/profile/address.png";
import settingsIcon from "../assets/Icon/profile/settings.png";
import infoIcon from "../assets/Icon/profile/info.png";

const menuGroups = [
  ["Способы оплаты", "Ввести промокод"],
  ["История поездок", "Уведомления", "Мои адреса"],
  ["Настройки", "Информация"],
];

function DriverProfilePage() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("easygo_user") || "null");
    } catch {
      return null;
    }
  }, []);

  const displayName = user?.name || user?.full_name || "Водитель";
  const displayPhone = user?.phone || "+996555000111";

  function handleLogout() {
    localStorage.removeItem("easygo_token");
    localStorage.removeItem("easygo_user");
    navigate("/");
  }

  function handleMenuClick(item) {
    switch (item) {
      case "Способы оплаты":
        navigate("/profile/payments");
        return;
      case "Ввести промокод":
        navigate("/profile/promo");
        return;
      case "История поездок":
        navigate("/profile/history");
        return;
      case "Уведомления":
        navigate("/profile/notifications");
        return;
      case "Мои адреса":
        navigate("/profile/addresses");
        return;
      case "Настройки":
        navigate("/profile/settings");
        return;
      case "Информация":
        navigate("/profile/about");
        return;
      default:
        return;
    }
  }

  function renderMenuIcon(item) {
    switch (item) {
      case "Способы оплаты":
        return <img src={paymentMethodsIcon} alt="" className="profile-menu-icon-img" />;
      case "Ввести промокод":
        return <img src={promoIcon} alt="" className="profile-menu-icon-img" />;
      case "История поездок":
        return <img src={historyIcon} alt="" className="profile-menu-icon-img history-icon-img" />;
      case "Уведомления":
        return <img src={notificationsIcon} alt="" className="profile-menu-icon-img notifications-icon-img" />;
      case "Мои адреса":
        return <img src={addressIcon} alt="" className="profile-menu-icon-img address-icon-img" />;
      case "Настройки":
        return <img src={settingsIcon} alt="" className="profile-menu-icon-img settings-icon-img" />;
      case "Информация":
        return <img src={infoIcon} alt="" className="profile-menu-icon-img info-icon-img" />;
      default:
        return "◼";
    }
  }

  return (
    <DriverMobileShell activeTab="profile">
      <div className="page profile-page">
        <div className="profile-top-gradient" />

        <div className="profile-header-card">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">
              <span>👤</span>
            </div>
          </div>

          <div className="profile-user-info">
            <h1 className="profile-name">{displayName}</h1>
            <div className="profile-phone">{displayPhone}</div>

            <div className="profile-badges">
              <span className="profile-badge profile-badge-dark">Рейтинг</span>
              <span className="profile-badge profile-badge-black">5/5</span>
            </div>
          </div>
        </div>

        <div className="profile-menu-groups">
          {menuGroups.map((group, groupIndex) => (
            <div className="profile-menu-card" key={`group-${groupIndex}`}>
              {group.map((item) => (
                <button
                  key={item}
                  className="profile-menu-item"
                  type="button"
                  onClick={() => handleMenuClick(item)}
                >
                  <span className="profile-menu-left">
                    <span className="profile-menu-icon">
                      {renderMenuIcon(item)}
                    </span>
                    <span className="profile-menu-text">{item}</span>
                  </span>

                  <span className="profile-menu-arrow">›</span>
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="profile-logout-wrap">
          <button
            type="button"
            className="profile-logout-btn"
            onClick={handleLogout}
          >
            Выйти
          </button>
        </div>
      </div>
    </DriverMobileShell>
  );
}

export default DriverProfilePage;