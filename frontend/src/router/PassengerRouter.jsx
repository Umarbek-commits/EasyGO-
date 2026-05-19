import { Route } from "react-router-dom";

import HomePage from "../pages/HomePage";
import ProfilePage from "../pages/ProfilePage";

import PaymentsPage from "../pages/PaymentsPage";
import PromoPage from "../pages/PromoPage";
import RideHistoryPage from "../pages/RideHistoryPage";
import NotificationsPage from "../pages/NotificationsPage";
import AddressesPage from "../pages/AddressesPage";
import SettingsPage from "../pages/SettingsPage";
import AboutPage from "../pages/AboutPage";

export const passengerRoutes = (
  <>
    <Route path="/home" element={<HomePage />} />

    <Route path="/profile" element={<ProfilePage />} />

    <Route path="/profile/payments" element={<PaymentsPage />} />
    <Route path="/profile/promo" element={<PromoPage />} />
    <Route path="/profile/history" element={<RideHistoryPage />} />
    <Route path="/profile/notifications" element={<NotificationsPage />} />
    <Route path="/profile/addresses" element={<AddressesPage />} />
    <Route path="/profile/settings" element={<SettingsPage />} />
    <Route path="/profile/about" element={<AboutPage />} />
  </>
);