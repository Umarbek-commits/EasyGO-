import { Routes, Route, Navigate } from "react-router-dom";

import WelcomePage from "../pages/WelcomePage";
import RolePage from "../pages/RolePage";
import DriverAuthPage from "../pages/DriverAuthPage";
import PassengerAuthPage from "../pages/PassengerAuthPage";

import HomePage from "../pages/HomePage";
import DriverHomePage from "../pages/DriverHomePage";

import ProfilePage from "../pages/ProfilePage";
import DriverProfilePage from "../pages/DriverProfilePage";

import SupportPage from "../pages/SupportPage";

import PaymentsPage from "../pages/PaymentsPage";
import PromoPage from "../pages/PromoPage";
import RideHistoryPage from "../pages/RideHistoryPage";
import NotificationsPage from "../pages/NotificationsPage";
import AddressesPage from "../pages/AddressesPage";
import SettingsPage from "../pages/SettingsPage";
import AboutPage from "../pages/AboutPage";

function AppRouter() {
  const user = JSON.parse(localStorage.getItem("easygo_user") || "null");

  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/role" element={<RolePage />} />

      <Route path="/driver-auth" element={<DriverAuthPage />} />
      <Route path="/passenger-auth" element={<PassengerAuthPage />} />

      {/* CLIENT */}
      <Route
        path="/home"
        element={
          user?.role === "driver"
            ? <Navigate to="/driver/home" replace />
            : <HomePage />
        }
      />

      <Route
        path="/profile"
        element={
          user?.role === "driver"
            ? <Navigate to="/driver/profile" replace />
            : <ProfilePage />
        }
      />

      {/* DRIVER */}
      <Route
        path="/driver/home"
        element={
          user?.role === "driver"
            ? <DriverHomePage />
            : <Navigate to="/home" replace />
        }
      />

      <Route
        path="/driver/profile"
        element={
          user?.role === "driver"
            ? <DriverProfilePage />
            : <Navigate to="/home" replace />
        }
      />

      {/* COMMON */}
      <Route path="/support" element={<SupportPage />} />

      <Route path="/profile/payments" element={<PaymentsPage />} />
      <Route path="/profile/promo" element={<PromoPage />} />
      <Route path="/profile/history" element={<RideHistoryPage />} />
      <Route path="/profile/notifications" element={<NotificationsPage />} />
      <Route path="/profile/addresses" element={<AddressesPage />} />
      <Route path="/profile/settings" element={<SettingsPage />} />
      <Route path="/profile/about" element={<AboutPage />} />
    </Routes>
  );
}

export default AppRouter;