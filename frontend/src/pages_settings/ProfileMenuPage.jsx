import { useNavigate } from "react-router-dom";
import MobileShell from "../components/MobileShell";

function ProfileMenuPage({
  title,
  description,
  children,
}) {
  const navigate = useNavigate();

  return (
    <MobileShell activeTab="profile">
      <div className="page profile-subpage">
        <div className="profile-subpage-top-gradient" />

        <div className="profile-subpage-header">
          <button
            type="button"
            className="profile-subpage-back"
            onClick={() => navigate("/profile")}
          >
            ← Назад
          </button>

          <h1 className="profile-subpage-title">{title}</h1>

          {description ? (
            <p className="profile-subpage-description">{description}</p>
          ) : null}
        </div>

        <div className="profile-subpage-content">{children}</div>
      </div>
    </MobileShell>
  );
}

export default ProfileMenuPage;