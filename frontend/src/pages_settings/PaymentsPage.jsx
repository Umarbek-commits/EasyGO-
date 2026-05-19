import ProfileMenuPage from "./ProfileMenuPage";

function PaymentsPage() {
  return (
    <ProfileMenuPage
      title="Способы оплаты"
      description="Выберите удобный способ оплаты поездок"
    >
      <div className="profile-subpage-card">
        <div className="profile-subpage-row">
          <div>
            <div className="profile-subpage-row-title">Наличные</div>
            <div className="profile-subpage-row-subtitle">Доступно сейчас</div>
          </div>
          <div className="profile-subpage-badge profile-subpage-badge-active">
            Активно
          </div>
        </div>

        <div className="profile-subpage-row">
          <div>
            <div className="profile-subpage-row-title">Банковская карта</div>
            <div className="profile-subpage-row-subtitle">Скоро будет доступно</div>
          </div>
          <div className="profile-subpage-badge">Скоро</div>
        </div>
      </div>
    </ProfileMenuPage>
  );
}

export default PaymentsPage;