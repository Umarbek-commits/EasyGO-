import ProfileMenuPage from "./ProfileMenuPage";

function AddressesPage() {
  return (
    <ProfileMenuPage
      title="Мои адреса"
      description="Сохранённые адреса для быстрых поездок"
    >
      <div className="profile-subpage-list">
        <div className="profile-subpage-card">
          <div className="profile-subpage-row-title">Дом</div>
          <div className="profile-subpage-row-subtitle">мкр. Джал, дом 12</div>
        </div>

        <div className="profile-subpage-card">
          <div className="profile-subpage-row-title">Работа</div>
          <div className="profile-subpage-row-subtitle">БЦ Россия, 5 этаж</div>
        </div>

        <div className="profile-subpage-card">
          <div className="profile-subpage-row-title">Учёба</div>
          <div className="profile-subpage-row-subtitle">Политех, главный корпус</div>
        </div>
      </div>
    </ProfileMenuPage>
  );
}

export default AddressesPage;