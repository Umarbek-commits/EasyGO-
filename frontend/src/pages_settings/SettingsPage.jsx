import ProfileMenuPage from "./ProfileMenuPage";

function SettingsPage() {
  return (
    <ProfileMenuPage
      title="Настройки"
      description="Основные параметры приложения"
    >
      <div className="profile-subpage-list">
        <div className="profile-subpage-card">
          <div className="profile-subpage-row-title">Язык</div>
          <div className="profile-subpage-row-subtitle">Русский</div>
        </div>

        <div className="profile-subpage-card">
          <div className="profile-subpage-row-title">Тема</div>
          <div className="profile-subpage-row-subtitle">Светлая</div>
        </div>

        <div className="profile-subpage-card">
          <div className="profile-subpage-row-title">Версия приложения</div>
          <div className="profile-subpage-row-subtitle">v0.0.1</div>
        </div>
      </div>
    </ProfileMenuPage>
  );
}

export default SettingsPage;