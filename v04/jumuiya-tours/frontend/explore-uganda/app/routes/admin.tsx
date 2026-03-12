import { Outlet, Navigate } from "react-router-dom";
import AdminSidebar from "../components/admin-sidebar";
import authService from "../services/auth.service";
import { ROUTES } from "../config/routes-config";
import { useHydrated } from "../hooks/useHydrated";

export default function AdminLayout() {
  const hydrated = useHydrated();

  // Prevent hydration mismatch / auth flicker
  if (!hydrated) {
    return (
      <div className="min-h-screen bg-safari-sand flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Checking admin access…</p>
        </div>
      </div>
    );
  }

  const user = authService.getCurrentUser();

  // Not logged in → redirect to login
  if (!authService.isAuthenticated() || !user) {
    return <Navigate to={ROUTES.auth.login} replace />;
  }

  // Logged in but not admin → show 403 experience
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-safari-sand flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-red-100 p-8 text-center">
          <div className="text-4xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-red-700 mb-2">Access Denied</h1>
          <p className="text-gray-600">
            You do not have permission to access the admin area.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-safari-sand min-h-screen font-african">
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}