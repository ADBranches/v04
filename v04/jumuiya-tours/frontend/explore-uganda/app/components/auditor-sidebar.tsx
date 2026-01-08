import { Link, useLocation } from "react-router";

export default function AuditorSidebar() {
  const location = useLocation();
  
  const menuItems = [
    { path: "/auditor/dashboard", label: "Dashboard", icon: "📈" },
    { path: "/auditor/content-queue", label: "Content Queue", icon: "📝" },
    { path: "/auditor/guide-approvals", label: "Guide Approvals", icon: "✅" },
  ];

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6 border-b border-uganda-yellow/20">
        <h2 className="text-lg font-semibold text-uganda-black">Auditor Panel</h2>
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