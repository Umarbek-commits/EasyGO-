import ProfileMenuPage from "./ProfileMenuPage";

function AboutPage() {
  return (
    <ProfileMenuPage
      title="Информация"
      description="Информация о сервисе EasyGO"
    >
      <div className="profile-subpage-card">
        <div className="profile-subpage-row-title">EasyGO</div>
        <div className="profile-subpage-row-subtitle">
          Сервис совместных поездок и удобного городского передвижения.
        </div>
      </div>

      <div className="profile-subpage-card">
        <div className="profile-subpage-row-title">Поддержка</div>
        <div className="profile-subpage-row-subtitle">
          support@easygo.app
        </div>
      </div>

      <div className="profile-subpage-card">
        <div className="profile-subpage-row-title">Версия</div>
        <div className="profile-subpage-row-subtitle">0.0.1</div>
      </div>
    </ProfileMenuPage>
  );
}

export default AboutPage;