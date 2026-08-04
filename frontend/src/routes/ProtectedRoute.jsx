import { Navigate, Outlet } from "react-router-dom";
import { getAuth } from "../store/auth.store.js";

export default function ProtectedRoute() {
  return getAuth()?.accessToken ? <Outlet /> : <Navigate to="/login" replace />;
}
