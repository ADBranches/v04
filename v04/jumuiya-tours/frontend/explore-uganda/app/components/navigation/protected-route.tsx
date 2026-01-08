import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";
import authService from "../../services/auth.service";

/**
 * 🔒 ProtectedRoute ensures only authorized roles access certain routes.
 * Safe for SSR — waits for client before accessing localStorage.
 */
interface ProtectedRouteProps {
  requiredRole?: "admin" | "auditor" | "guide" | "user";
}

export default function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setUser(authService.getCurrentUser());
    setMounted(true);
  }, []);

  // ⏳ Prevent SSR mismatch by waiting for hydration
  if (!mounted) return null;

  if (!user) return <Navigate to="/auth/login" replace />;
  if (requiredRole && user.role !== requiredRole)
    return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
