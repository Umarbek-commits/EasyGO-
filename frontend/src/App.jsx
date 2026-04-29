import { useEffect } from "react";
import AppRouter from "./router/AppRouter";
import { getMe } from "./api/client";

function App() {
  useEffect(() => {
    const token = localStorage.getItem("easygo_token");

    if (!token) return;

    const restoreUser = async () => {
      try {
        const data = await getMe(token);

        if (data?.ok && data?.user) {
          localStorage.setItem("easygo_user", JSON.stringify(data.user));
        } else {
          localStorage.removeItem("easygo_token");
          localStorage.removeItem("easygo_user");
        }
      } catch (error) {
        localStorage.removeItem("easygo_token");
        localStorage.removeItem("easygo_user");
      }
    };

    restoreUser();
  }, []);

  return <AppRouter />;
}

export default App;