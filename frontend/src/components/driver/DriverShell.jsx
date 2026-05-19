import DriverBottomNav from "./DriverBottomNav";

function DriverShell({
  children,
  activeTab = "map",
  showBottomNav = true,
}) {
  return (
    <div className="mobile-shell">
      <div className="mobile-content">
        {children}
      </div>

      {showBottomNav && (
        <DriverBottomNav activeTab={activeTab} />
      )}
    </div>
  );
}

export default DriverShell;