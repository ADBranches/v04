import { Link, useLocation } from "react-router-dom";
import { ROUTES } from "../config/routes-config";

export default function AdminSidebar() {
  const location = useLocation();

  const menuItems = [
    { path: ROUTES.admin.analytics, label: "Analytics", icon: "📊" },
    { path: ROUTES.admin.users, label: "User Management", icon: "👥" },
    { path: ROUTES.admin.roles, label: "Role Management", icon: "🔑" },
    { path: ROUTES.admin.destinations, label: "Destinations", icon: "📍" },
    { path: ROUTES.admin.approvals, label: "Approvals", icon: "✅" },
    { path: ROUTES.admin.activity, label: "Activity", icon: "🕒" },
    { path: ROUTES.admin.settings, label: "Settings", icon: "⚙️" },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <aside className="w-64 bg-white shadow-lg min-h-screen border-r border-gray-100">
      <div className="p-6 border-b border-uganda-yellow/20">
        <h2 className="text-lg font-semibold text-uganda-black">Admin Panel</h2>
        <p className="text-sm text-gray-500 mt-1">Management &amp; moderation</p>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item, index) => {
            const active = isActive(item.path);
            
            return (
              <li key={item.path || index}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    active
                      ? "bg-uganda-yellow text-uganda-black font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}