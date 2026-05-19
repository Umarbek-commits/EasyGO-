import { Routes, Route, Navigate } from "react-router-dom";

// PASSENGER PAGES
import WelcomePage from "../pages_passenger/WelcomePage";
import RolePage from "../pages_passenger/RolePage";
import PassengerAuthPage from "../pages_passenger/PassengerAuthPage";
import HomePage from "../pages_passenger/HomePage";
import SupportPage from "../pages_passenger/SupportPage";

// DRIVER PAGES
import DriverAuthPage from "../pages_driver/DriverAuthPage";
import DriverHomePage from "../pages_driver/DriverHomePage";
import DriverProfilePage from "../pages_driver/DriverProfilePage";

// SETTINGS PAGES
import AboutPage from "../pages_settings/AboutPage";
import AddressesPage from "../pages_settings/AddressesPage";
import NotificationsPage from "../pages_settings/NotificationsPage";
import PaymentsPage from "../pages_settings/PaymentsPage";
import PromoPage from "../pages_settings/PromoPage";
import RideHistoryPage from "../pages_settings/RideHistoryPage";
import SettingsPage from "../pages_settings/SettingsPage";
import ProfileMenuPage from "../pages_settings/ProfileMenuPage";
import ProfilePage from "../pages_settings/ProfilePage";

function AppRouter() {
  const user = JSON.parse(
    localStorage.getItem("easygo_user") || "null"
  );

  const isDriver = user?.role === "driver";

  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/" element={<WelcomePage />} />

      <Route path="/role" element={<RolePage />} />

      <Route
        path="/driver-auth"
        element={<DriverAuthPage />}
      />

      <Route
        path="/passenger-auth"
        element={<PassengerAuthPage />}
      />

      {/* HOME REDIRECT */}
      <Route
        path="/home"
        element={
          isDriver ? (
            <Navigate to="/driver/home" replace />
          ) : (
            <Navigate to="/passenger/home" replace />
          )
        }
      />

      {/* PASSENGER ROUTES */}
      {!isDriver && (
        <>
          <Route
            path="/passenger/home"
            element={<HomePage />}
          />

          <Route
            path="/passenger/profile"
            element={<ProfilePage />}
          />

          <Route
            path="/support"
            element={<SupportPage />}
          />

          {/* SETTINGS */}
          <Route
            path="/profile/menu"
            element={<ProfileMenuPage />}
          />

          <Route
            path="/profile/payments"
            element={<PaymentsPage />}
          />

          <Route
            path="/profile/promo"
            element={<PromoPage />}
          />

          <Route
            path="/profile/history"
            element={<RideHistoryPage />}
          />

          <Route
            path="/profile/notifications"
            element={<NotificationsPage />}
          />

          <Route
            path="/profile/addresses"
            element={<AddressesPage />}
          />

          <Route
            path="/profile/settings"
            element={<SettingsPage />}
          />

          <Route
            path="/profile/about"
            element={<AboutPage />}
          />
        </>
      )}

      {/* DRIVER ROUTES */}
      {isDriver && (
        <>
          <Route
            path="/driver/home"
            element={<DriverHomePage />}
          />

          <Route
            path="/driver/profile"
            element={<DriverProfilePage />}
          />

          <Route
            path="/support"
            element={<SupportPage />}
          />
        </>
      )}

      {/* FALLBACK */}
      <Route
        path="*"
        element={
          <Navigate
            to={
              isDriver
                ? "/driver/home"
                : "/passenger/home"
            }
            replace
          />
        }
      />
    </Routes>
  );
}

export default AppRouter;