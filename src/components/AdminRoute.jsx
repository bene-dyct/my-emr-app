import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const isAdmin = sessionStorage.getItem("isAdminAuthenticated") === "true";
  return isAdmin ? children : <Navigate to="/admin" />;
}