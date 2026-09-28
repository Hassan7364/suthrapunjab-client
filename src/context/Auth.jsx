import { useEffect, useState } from "react";
import AuthContext from "./AuthContext.js";
import apiRequest from "../lib/api.js";

const Auth = ({ children }) => {
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState({});
  const [isAppLoading, setIsAppLoading] = useState(() => Boolean(localStorage.getItem("token")));

  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem("token");

    if (!token) return undefined;

    apiRequest("/auth/me")
      .then((currentUser) => {
        if (!isMounted) return;
        setUser(currentUser);
        setIsAuth(true);
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      })
      .finally(() => {
        if (isMounted) setIsAppLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials) => {
    const { user: authenticatedUser, token } = await apiRequest("/auth/login", {
      method: "POST",
      body: credentials,
    });

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);
    setIsAuth(true);
    return authenticatedUser;
  };

  const handleLogout = () => {
    setIsAuth(false);
    setUser({});
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.toastify("Sucessfully Logout!", "success");
  };

  return (
    <>
      <AuthContext.Provider value={{ isAuth, user, login, handleLogout, isAppLoading }}>
        {children}
      </AuthContext.Provider>
    </>
  );
};

export default Auth;
