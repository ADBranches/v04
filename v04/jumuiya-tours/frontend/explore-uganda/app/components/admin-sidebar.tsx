import { Link, useLocation } from "react-router";

export default function AdminSidebar() {
  const location = useLocation();
  
  const menuItems = [
    { path: "/admin/analytics", label: "Analytics", icon: "📊" },
    { path: "/admin/users", label: "User Management", icon: "👥" },
    { path: "/admin/roles", label: "Role Management", icon: "🔑" },
  ];

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6 border-b border-uganda-yellow/20">
        <h2 className="text-lg font-semibold text-uganda-black">Admin Panel</h2>
      </div>
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? "bg-uganda-yellow text-uganda-black"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}