import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import authService from "../../services/auth.service";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error("Sidebar authService error:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
  }, [isOpen]);

  const routes = [
    { name: "Dashboard", href: "/dashboard", roles: ["user", "guide", "auditor", "admin"], icon: "📊" },
    { name: "Destinations", href: "/destinations", roles: ["user", "guide", "auditor", "admin"], icon: "🏞️" },
    { name: "Guides", href: "/guides", roles: ["user", "guide", "auditor", "admin"], icon: "👨‍🏫" },
    { name: "Bookings", href: "/bookings", roles: ["user", "guide", "auditor", "admin"], icon: "📅" },
  ];

  const adminRoutes = [
    { name: "Admin Dashboard", href: "/dashboard/admin", roles: ["admin"], icon: "🛡️" },
    { name: "User Management", href: "/dashboard/admin/users", roles: ["admin"], icon: "👥" },
    { name: "Analytics", href: "/dashboard/admin/analytics", roles: ["admin"], icon: "📈" },
  ];

  const auditorRoutes = [
    { name: "Auditor Dashboard", href: "/dashboard/auditor", roles: ["auditor"], icon: "🔍" },
    { name: "Content Queue", href: "/dashboard/auditor/content-queue", roles: ["auditor"], icon: "⏳" },
    { name: "Guide Approvals", href: "/dashboard/auditor/guide-approvals", roles: ["auditor"], icon: "✅" },
  ];

  const isActive = (path: string) => location.pathname === path;
  const role = user?.role || "user";

  const visibleRoutes = routes.filter((r) => r.roles.includes(role));
  const visibleAdmin = adminRoutes.filter((r) => r.roles.includes(role));
  const visibleAuditor = auditorRoutes.filter((r) => r.roles.includes(role));

  // 🧠 Prevent flickering when loading user
  if (loading) {
    return (
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex items-center justify-center">
        <span className="text-gray-500 animate-pulse text-sm">Loading menu...</span>
      </aside>
    );
  }

  // 🚫 If no user (not logged in), don’t render sidebar at all
  if (!user && !loading) {
    return (
      <aside className="fixed inset-y-0 left-0 w-64 bg-white flex items-center justify-center text-gray-500">
        <span>Login to access menu</span>
      </aside>
    );
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar overlay"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out 
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        lg:translate-x-0 lg:static lg:inset-0`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-safari-sand">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-uganda-yellow rounded-full flex items-center justify-center">
              <span className="text-uganda-black font-bold text-sm">JT</span>
            </div>
            <span className="font-bold text-uganda-black text-lg">
              Jumuiya<span className="text-uganda-yellow">Tours</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 rounded-md"
            aria-label="Close sidebar"
          >
            ✖️
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto">
          {visibleRoutes.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-uganda-yellow text-uganda-black"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
            </Link>
          ))}

          {visibleAdmin.length > 0 && (
            <section>
              <div className="mt-4 mb-2 px-4 text-xs uppercase text-gray-500 font-semibold">
                Administration
              </div>
              {visibleAdmin.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-uganda-yellow text-uganda-black"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </section>
          )}

          {visibleAuditor.length > 0 && (
            <section>
              <div className="mt-4 mb-2 px-4 text-xs uppercase text-gray-500 font-semibold">
                Moderation
              </div>
              {visibleAuditor.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-uganda-yellow text-uganda-black"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </section>
          )}
        </nav>
      </aside>
    </>
  );
}
