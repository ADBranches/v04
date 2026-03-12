// app/components/navigation/protected-route.tsx
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import authService from "../../services/auth.service";
import { ROUTES } from "../../config/routes-config";

type Role = "admin" | "auditor" | "guide" | "user";

interface ProtectedRouteProps {
  /** New, preferred API: allowedRoles={['admin', 'auditor']} */
  allowedRoles?: Role[];
  /** Backwards-compat: requiredRole="admin" */
  requiredRole?: Role;
}

/**
 * 🔒 ProtectedRoute ensures only authorized roles access certain routes.
 * Safe for SSR — waits for client before accessing localStorage.
 */
export default function ProtectedRoute({
  allowedRoles,
  requiredRole,
}: ProtectedRouteProps) {
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setUser(authService.getCurrentUser());
    setMounted(true);
  }, []);

  // ⏳ Prevent SSR mismatch by waiting for hydration
  if (!mounted) return null;

  // 1) Not logged in → go to login
  if (!user) return <Navigate to={ROUTES.auth.login} replace />;

  // 2) Logged in, but role not allowed → 403 screen
  const effectiveAllowed =
    allowedRoles ?? (requiredRole ? [requiredRole] : undefined);

  if (effectiveAllowed && !effectiveAllowed.includes(user.role)) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-semibold">403 – Access Denied</h2>
          <p className="text-red-600 mt-2">
            You don&apos;t have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  // 3) All good → render nested route
  return <Outlet />;
}
