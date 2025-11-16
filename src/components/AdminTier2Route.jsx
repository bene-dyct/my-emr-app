import { Navigate } from "react-router-dom";

export default function AdminTier2Route({ children }) {
  const adminLevel = sessionStorage.getItem("adminLevel");
  return adminLevel === "tier2" ? children : <Navigate to="/admin" />;
}