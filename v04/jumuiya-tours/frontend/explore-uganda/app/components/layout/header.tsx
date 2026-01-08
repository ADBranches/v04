// app/components/layout/header.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { authService } from "../../services/auth.service";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [user, setUser] = useState<any>(null);
  const [isHydrated, setIsHydrated] = useState(false); // ✅ prevents hydration mismatch

  // --- Hydration-safe initialization ---
  useEffect(() => {
    setIsHydrated(true); // mark client render

    const currentUser = authService.getCurrentUser();
    setUser(currentUser);

    // ✅ Listen for login/logout/profile updates
    const handleAuthChange = (event: CustomEvent) => {
      if (event.detail?.type === "logout") {
        setUser(null);
      } else if (event.detail?.user) {
        setUser(event.detail.user);
      } else {
        setUser(authService.getCurrentUser());
      }
    };

    window.addEventListener("authChange", handleAuthChange as EventListener);
    return () => {
      window.removeEventListener("authChange", handleAuthChange as EventListener);
    };
  }, []);

  const handleLogout = () => {
    authService.logout();
    window.location.href = "/auth/login";
  };

  // --- 🧠 During SSR or before hydration ---
  if (!isHydrated) {
    return (
      <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-[100]">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-6">
            <button
              type="button"
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={onMenuClick}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <Link
              to="/"
              className="text-xl font-bold text-uganda-black font-display"
            >
              Explore<span className="text-uganda-yellow">Uganda</span>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  // --- ✅ Hydrated Header ---
  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-[100]">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left: Logo + Nav */}
        <div className="flex items-center space-x-6">
          {/* Mobile Menu Button */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            onClick={onMenuClick}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Logo */}
          <Link
            to="/"
            className="text-xl font-bold text-uganda-black font-display"
          >
            Explore<span className="text-uganda-yellow">Uganda</span>
          </Link>

          {/* Main Navigation */}
          <nav className="hidden lg:flex space-x-6">
            <Link
              to="/destinations"
              className="text-gray-700 hover:text-uganda-yellow transition-colors"
            >
              Destinations
            </Link>
            <Link
              to="/guides"
              className="text-gray-700 hover:text-uganda-yellow transition-colors"
            >
              Guides
            </Link>
            {user && (
              <Link
                to="/bookings"
                className="text-gray-700 hover:text-uganda-yellow transition-colors"
              >
                My Bookings
              </Link>
            )}
          </nav>
        </div>

        {/* Right: Auth/User Section */}
        <div className="flex items-center space-x-4 ml-auto">
          {!isHydrated ? (
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
          ) : user ? (
            // ✅ Logged-in Dropdown
            <>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
              <div className="relative group">
                <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 bg-uganda-yellow rounded-full flex items-center justify-center">
                    <span className="text-uganda-black font-bold text-sm">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // ✅ Not logged in → show links immediately
            <div className="flex items-center space-x-3">
              <Link
                to="/auth/login"
                className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg font-african hover:bg-yellow-400 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/auth/register"
                className="border border-uganda-yellow text-uganda-yellow px-4 py-2 rounded-lg font-african hover:bg-yellow-50 transition-colors"
              >
                Register
              </Link>
          </div>
        )}

        </div>
      </div>
    </header>
  );
}
