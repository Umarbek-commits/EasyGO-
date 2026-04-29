import { Routes, Route } from "react-router-dom";

import WelcomePage from "../pages/WelcomePage";
import RolePage from "../pages/RolePage";
import DriverAuthPage from "../pages/DriverAuthPage";
import PassengerAuthPage from "../pages/PassengerAuthPage";
import HomePage from "../pages/HomePage";
import ProfilePage from "../pages/ProfilePage";
import SupportPage from "../pages/SupportPage";
import DriverHomePage from "../pages/Driverhomepage";
import DriverProfilePage from "../pages/DriverProfilePage";

import PaymentsPage from "../pages/PaymentsPage";
import PromoPage from "../pages/PromoPage";
import RideHistoryPage from "../pages/RideHistoryPage";
import NotificationsPage from "../pages/NotificationsPage";
import AddressesPage from "../pages/AddressesPage";
import SettingsPage from "../pages/SettingsPage";
import AboutPage from "../pages/AboutPage";

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/role" element={<RolePage />} />
      <Route path="/driver-auth" element={<DriverAuthPage />} />
      <Route path="/passenger-auth" element={<PassengerAuthPage />} />

      <Route
        path="/home"
        element={
          (() => {
            const user = JSON.parse(localStorage.getItem("easygo_user") || "null");
            return user?.role === "driver" ? <DriverHomePage /> : <HomePage />;
          })()
        }
      />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/support" element={<SupportPage />} />

      <Route path="/driver/home" element={<DriverHomePage />} />
      <Route path="/driver/profile" element={<DriverProfilePage />} />

      <Route path="/driver-home" element={<DriverHomePage />} />

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