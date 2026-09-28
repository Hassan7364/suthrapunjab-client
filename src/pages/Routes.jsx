import { Navigate, Route, Routes } from "react-router-dom";

// import Frontend from "./Frontend";
import Auth from "./Auth";
import Dashboard from "./Dashboard";

import { useAuthContext } from "../context/AuthContext.js";

const Index = () => {
  const { isAuth } = useAuthContext();
  return (
    <>
      <Routes>
        <Route
          path="/*"
          element={isAuth ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth/login" replace />}
        />
        <Route path="/auth/*" element={!isAuth ? <Auth /> : <Navigate to="/dashboard" replace />} />
        <Route path="/dashboard/*" element={isAuth ? <Dashboard /> : <Navigate to="/auth/login" replace />} />
      </Routes>
    </>
  );
};

export default Index;
