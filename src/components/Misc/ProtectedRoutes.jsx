import { useAuthContext } from "@/context/AuthContext.js";
import { Navigate } from "react-router-dom";

const ProtectedRoutes = ({ Component, allowedRoles }) => {
  const { isAuth, user } = useAuthContext();

  if (!isAuth) return <Navigate to="/auth/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Component />;
};

export default ProtectedRoutes;
