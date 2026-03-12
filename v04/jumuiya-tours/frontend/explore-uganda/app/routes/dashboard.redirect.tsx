import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/auth.service";
import { ROUTES } from "../config/routes-config";

export default function DashboardRedirect() {
  const navigate = useNavigate();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const user = authService.getCurrentUser();

    if (!user || !user.role) {
      // No valid user → clear auth state and redirect to login
      authService.logout();
      navigate(ROUTES.auth.login, { replace: true });
      return;
    }

    switch (user.role) {
      case "admin":
        navigate(ROUTES.dashboards.admin, { replace: true });
        break;
      case "auditor":
        navigate(ROUTES.dashboards.auditor, { replace: true });
        break;
      case "guide":
        navigate(ROUTES.dashboards.guide, { replace: true });
        break;
      default:
        navigate(ROUTES.dashboards.user, { replace: true });
        break;
    }
  }, [hydrated, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-yellow-50 text-gray-700">
      Redirecting to your dashboard...
    </div>
  );
}