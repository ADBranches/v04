import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import authService from "../../services/auth.service";

type Role = "admin" | "auditor" | "guide" | "user";

interface SidebarProps {
  role?: Role;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ role, isOpen, onClose }: SidebarProps) {
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

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const effectiveRole: Role = role || user?.role || "user";

  const dashboardHomeByRole: Record<Role, string> = {
    admin: "/dashboard/admin",
    auditor: "/dashboard/auditor",
    guide: "/dashboard/guide",
    user: "/dashboard/user",
  };

  const commonRoutes = [
    {
      name: "Dashboard",
      href: dashboardHomeByRole[effectiveRole],
      roles: ["user", "guide", "auditor", "admin"] as Role[],
      icon: "📊",
    },
    {
      name: "Destinations",
      href: "/destinations",
      roles: ["user", "guide", "auditor", "admin"] as Role[],
      icon: "🏞️",
    },
    {
      name: "Guides",
      href: "/guides",
      roles: ["user", "guide", "auditor", "admin"] as Role[],
      icon: "👨‍🏫",
    },
    {
      name: "Bookings",
      href: "/bookings",
      roles: ["user", "guide", "auditor", "admin"] as Role[],
      icon: "📅",
    },
  ];

  const adminRoutes = [
    {
      name: "Admin Dashboard",
      href: "/dashboard/admin",
      roles: ["admin"] as Role[],
      icon: "🛡️",
    },
    {
      name: "User Management",
      href: "/admin/users",
      roles: ["admin"] as Role[],
      icon: "👥",
    },
    {
      name: "Analytics",
      href: "/admin/analytics",
      roles: ["admin"] as Role[],
      icon: "📈",
    },
    {
      name: "Roles",
      href: "/admin/roles",
      roles: ["admin"] as Role[],
      icon: "🔐",
    },
  ];

  const auditorRoutes = [
    {
      name: "Auditor Dashboard",
      href: "/dashboard/auditor",
      roles: ["auditor"] as Role[],
      icon: "🔍",
    },
    {
      name: "Content Queue",
      href: "/auditor/content-queue",
      roles: ["auditor"] as Role[],
      icon: "⏳",
    },
    {
      name: "Guide Approvals",
      href: "/auditor/guide-approvals",
      roles: ["auditor"] as Role[],
      icon: "✅",
    },
  ];

  const guideRoutes = [
    {
      name: "Guide Dashboard",
      href: "/dashboard/guide",
      roles: ["guide"] as Role[],
      icon: "🧭",
    },
    {
      name: "Create Destination",
      href: "/destinations/create",
      roles: ["guide"] as Role[],
      icon: "➕",
    },
  ];

  const userRoutes = [
    {
      name: "My Dashboard",
      href: "/dashboard/user",
      roles: ["user"] as Role[],
      icon: "🏠",
    },
    {
      name: "My Profile",
      href: "/profile",
      roles: ["user"] as Role[],
      icon: "👤",
    },
  ];

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== "/" && location.pathname.startsWith(`${path}/`));

  const visibleCommonRoutes = commonRoutes.filter((r) =>
    r.roles.includes(effectiveRole)
  );
  const visibleAdminRoutes = adminRoutes.filter((r) =>
    r.roles.includes(effectiveRole)
  );
  const visibleAuditorRoutes = auditorRoutes.filter((r) =>
    r.roles.includes(effectiveRole)
  );
  const visibleGuideRoutes = guideRoutes.filter((r) =>
    r.roles.includes(effectiveRole)
  );
  const visibleUserRoutes = userRoutes.filter((r) =>
    r.roles.includes(effectiveRole)
  );

  if (loading) {
    return (
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex items-center justify-center">
        <span className="text-gray-500 animate-pulse text-sm">
          Loading menu...
        </span>
      </aside>
    );
  }

  if (!user && !loading) {
    return (
      <aside className="fixed inset-y-0 left-0 w-64 bg-white flex items-center justify-center text-gray-500 border-r border-gray-200">
        <span>Login to access menu</span>
      </aside>
    );
  }

  const renderNavItem = (item: { name: string; href: string; icon: string }) => (
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
  );

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

        {/* User Summary */}
        <div className="px-4 py-4 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-900">
            {user?.name || "Authenticated User"}
          </p>
          <p className="text-xs text-gray-500 capitalize">{effectiveRole}</p>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto">
          {visibleCommonRoutes.map(renderNavItem)}

          {visibleAdminRoutes.length > 0 && (
            <section>
              <div className="mt-4 mb-2 px-4 text-xs uppercase text-gray-500 font-semibold">
                Administration
              </div>
              {visibleAdminRoutes.map(renderNavItem)}
            </section>
          )}

          {visibleAuditorRoutes.length > 0 && (
            <section>
              <div className="mt-4 mb-2 px-4 text-xs uppercase text-gray-500 font-semibold">
                Moderation
              </div>
              {visibleAuditorRoutes.map(renderNavItem)}
            </section>
          )}

          {visibleGuideRoutes.length > 0 && (
            <section>
              <div className="mt-4 mb-2 px-4 text-xs uppercase text-gray-500 font-semibold">
                Guide Tools
              </div>
              {visibleGuideRoutes.map(renderNavItem)}
            </section>
          )}

          {visibleUserRoutes.length > 0 && (
            <section>
              <div className="mt-4 mb-2 px-4 text-xs uppercase text-gray-500 font-semibold">
                My Area
              </div>
              {visibleUserRoutes.map(renderNavItem)}
            </section>
          )}
        </nav>
      </aside>
    </>
  );
}