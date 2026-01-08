import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service";

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
      // No user → clear storage and redirect to login
      localStorage.clear();
      navigate("/auth/login", { replace: true });
      return;
    }

    // Redirect based on role
    switch (user.role) {
      case "admin":
        navigate("/dashboard/admin", { replace: true });
        break;
      case "auditor":
        navigate("/dashboard/auditor", { replace: true });
        break;
      case "guide":
        navigate("/dashboard/guide", { replace: true });
        break;
      default:
        navigate("/dashboard/user", { replace: true });
        break;
    }
  }, [hydrated, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-yellow-50 text-gray-700">
      Redirecting to your dashboard...
    </div>
  );
}
