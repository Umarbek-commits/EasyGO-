import { Routes, Route, Navigate } from "react-router-dom";

import WelcomePage from "../pages/WelcomePage";
import RolePage from "../pages/RolePage";

import DriverAuthPage from "../pages/DriverAuthPage";
import PassengerAuthPage from "../pages/PassengerAuthPage";

import SupportPage from "../pages/SupportPage";

import { passengerRoutes } from "./PassengerRoutes";
import { driverRoutes } from "./DriverRoutes";

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

      <Route path="/driver-auth" element={<DriverAuthPage />} />
      <Route path="/passenger-auth" element={<PassengerAuthPage />} />

      {/* REDIRECTS */}
      <Route
        path="/home"
        element={
          isDriver
            ? <Navigate to="/driver/home" replace />
            : <Navigate to="/passenger/home" replace />
        }
      />

      {/* PASSENGER */}
      {!isDriver && passengerRoutes}

      {/* DRIVER */}
      {isDriver && driverRoutes}

      {/* COMMON */}
      <Route path="/support" element={<SupportPage />} />

      {/* FALLBACK */}
      <Route
        path="*"
        element={
          <Navigate
            to={isDriver ? "/driver/home" : "/home"}
            replace
          />
        }
      />
    </Routes>
  );
}

export default AppRouter;