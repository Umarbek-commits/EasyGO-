import ProfileMenuPage from "./ProfileMenuPage";

const mockHistory = [
  {
    id: 1,
    from: "ТРЦ Asia Mall",
    to: "Политех",
    date: "Сегодня, 14:20",
    price: "180 сом",
  },
  {
    id: 2,
    from: "Ош базары",
    to: "7 мкр",
    date: "Вчера, 19:05",
    price: "220 сом",
  },
  {
    id: 3,
    from: "ЦУМ",
    to: "Аламедин",
    date: "22 марта, 09:40",
    price: "160 сом",
  },
];

function RideHistoryPage() {
  return (
    <ProfileMenuPage
      title="История поездок"
      description="Ваши последние поездки"
    >
      <div className="profile-subpage-list">
        {mockHistory.map((ride) => (
          <div className="profile-subpage-card" key={ride.id}>
            <div className="profile-subpage-row-title">{ride.from}</div>
            <div className="profile-subpage-row-subtitle">Куда: {ride.to}</div>
            <div className="profile-subpage-row-subtitle">{ride.date}</div>
            <div className="profile-subpage-price">{ride.price}</div>
          </div>
        ))}
      </div>
    </ProfileMenuPage>
  );
}

export default RideHistoryPage;