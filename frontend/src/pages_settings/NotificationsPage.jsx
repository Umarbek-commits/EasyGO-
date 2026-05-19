import { useState } from "react";
import ProfileMenuPage from "./ProfileMenuPage";

function NotificationsPage() {
  const [rides, setRides] = useState(true);
  const [promo, setPromo] = useState(false);
  const [news, setNews] = useState(false);

  return (
    <ProfileMenuPage
      title="Уведомления"
      description="Управляйте уведомлениями приложения"
    >
      <div className="profile-subpage-card">
        <label className="profile-subpage-switch-row">
          <span>Уведомления о поездках</span>
          <input type="checkbox" checked={rides} onChange={() => setRides(!rides)} />
        </label>

        <label className="profile-subpage-switch-row">
          <span>Промо и скидки</span>
          <input type="checkbox" checked={promo} onChange={() => setPromo(!promo)} />
        </label>

        <label className="profile-subpage-switch-row">
          <span>Новости EasyGO</span>
          <input type="checkbox" checked={news} onChange={() => setNews(!news)} />
        </label>
      </div>
    </ProfileMenuPage>
  );
}

export default NotificationsPage;