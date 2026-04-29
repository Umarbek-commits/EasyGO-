import { useState } from "react";
import ProfileMenuPage from "./ProfileMenuPage";

function PromoPage() {
  const [promo, setPromo] = useState("");
  const [applied, setApplied] = useState("");

  function handleApplyPromo() {
    const value = promo.trim();
    if (!value) return;
    setApplied(value);
    setPromo("");
  }

  return (
    <ProfileMenuPage
      title="Ввести промокод"
      description="Введите промокод для скидки на поездку"
    >
      <div className="profile-subpage-card">
        <input
          className="profile-subpage-input"
          type="text"
          placeholder="Введите промокод"
          value={promo}
          onChange={(e) => setPromo(e.target.value)}
        />

        <button
          type="button"
          className="profile-subpage-primary-btn"
          onClick={handleApplyPromo}
        >
          Применить
        </button>

        {applied ? (
          <div className="profile-subpage-note">
            Промокод <strong>{applied}</strong> сохранён
          </div>
        ) : null}
      </div>
    </ProfileMenuPage>
  );
}

export default PromoPage;