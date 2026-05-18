import { useEffect } from "react";
import AppRouter from "./router/AppRouter";
import { getMe } from "./api/client";

function App() {
  useEffect(() => {
    const token = localStorage.getItem("easygo_token");

    if (!token) return;

    const restoreUser = async () => {
      try {
        const data = await getMe();

        if (data?.ok && data?.user) {
          // Нормализуем роль, чтобы фронтенд использовал единый набор значений
          const roleFromServer = data.user.role || "";
          const normalizedRole = roleFromServer === "client" ? "passenger" : roleFromServer;

          const userToStore = {
            ...data.user,
            role: normalizedRole,
          };

          localStorage.setItem("easygo_user", JSON.stringify(userToStore));
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