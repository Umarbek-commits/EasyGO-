import PassengerBottomNav from "./PassengerBottomNav";

function PassengerShell({
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
        <PassengerBottomNav activeTab={activeTab} />
      )}
    </div>
  );
}

export default PassengerShell;