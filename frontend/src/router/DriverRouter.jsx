import { Route } from "react-router-dom";

import DriverHomePage from "../pages/DriverHomePage";
import DriverProfilePage from "../pages/DriverProfilePage";

export const driverRoutes = (
  <>
    <Route path="/driver/home" element={<DriverHomePage />} />

    <Route
      path="/driver/profile"
      element={<DriverProfilePage />}
    />
  </>
);