import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const tabs = [
  { key: "support", label: "Поддержка", path: "/support" },
  { key: "map", label: "Карта", path: "/home" },
  { key: "profile", label: "Профиль", path: "/profile" },
];

function MobileShell({
  children,
  activeTab = "map",
  className = "",
  showBottomNav = true,
}) {
  const navigate = useNavigate();

  return (
    <div className={`mobile-shell ${className}`.trim()}>
      <div className="mobile-screen">{children}</div>

      {showBottomNav && (
        <nav className="bottom-nav-shell">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                className={`bottom-nav-item ${isActive ? "active" : ""}`}
                onClick={() => navigate(tab.path)}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-active-pill"
                    className="bottom-nav-active-pill"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 32,
                      mass: 0.9,
                    }}
                  />
                )}

                <span className="bottom-nav-inner">
                  {tab.key === "support" && (
                    <svg
                      width="26"
                      height="26"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    >
                      <path d="M4 4h16v12H8l-4 4V4z" />
                      <path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round" />
                    </svg>
                  )}

                  {tab.key === "map" && (
                    <svg
                      width="26"
                      height="26"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                  )}

                  {tab.key === "profile" && (
                    <svg
                      width="26"
                      height="26"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="8" r="3.5" />
                      <path
                        d="M4 19c0-3.3 3.6-5 8-5s8 1.7 8 5"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}

                  <span className="bottom-nav-label">{tab.label}</span>
                </span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

export default MobileShell;