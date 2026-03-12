// app/components/layout/header.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import authService from "../../services/auth.service";
import { ROUTES } from "../../config/routes-config";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [user, setUser] = useState<any>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);

    const syncUser = () => setUser(authService.getCurrentUser?.() || null);
    syncUser();

    window.addEventListener("authChange", syncUser as EventListener);
    return () => {
      window.removeEventListener("authChange", syncUser as EventListener);
    };
  }, []);

  const displayName = useMemo(() => user?.name?.split?.(" ")?.[0] || "User", [user]);

  const handleLogout = () => {
    authService.logout();
    window.location.href = ROUTES.auth.login;
  };

  return (
    <header className="sticky top-0 z-[100] border-b border-black/5 bg-white/90 backdrop-blur-xl shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="flex h-[72px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 lg:gap-6">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-gray-600 transition duration-300 hover:bg-uganda-yellow hover:text-uganda-black lg:hidden"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link to={ROUTES.home || "/"} className="group flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-uganda-black text-sm font-black text-uganda-yellow shadow-md transition duration-300 group-hover:bg-uganda-red group-hover:text-white">
              JT
            </span>
            <div className="leading-tight">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-gray-500">
                Explore Uganda
              </p>
              <p className="text-xl font-black text-uganda-black">
                Jumuiya<span className="text-uganda-yellow">Tours</span>
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            <Link
              to={ROUTES.destinations.list}
              className="rounded-full px-4 py-2 text-sm font-semibold text-gray-700 transition duration-300 hover:bg-black/5 hover:text-uganda-black"
            >
              Destinations
            </Link>
            <Link
              to={ROUTES.guides.list}
              className="rounded-full px-4 py-2 text-sm font-semibold text-gray-700 transition duration-300 hover:bg-black/5 hover:text-uganda-black"
            >
              Guides
            </Link>
            {user && (
              <Link
                to={ROUTES.bookings?.list || "/bookings"}
                className="rounded-full px-4 py-2 text-sm font-semibold text-gray-700 transition duration-300 hover:bg-black/5 hover:text-uganda-black"
              >
                My Bookings
              </Link>
            )}
          </nav>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {!isHydrated ? (
            <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
          ) : user ? (
            <div className="relative group">
              <button className="flex items-center gap-3 rounded-full border border-black/5 bg-black/[0.03] px-3 py-2 transition duration-300 hover:bg-black/[0.05]">
                <span className="hidden text-right sm:block">
                  <span className="block text-sm font-semibold text-uganda-black">{displayName}</span>
                  <span className="block text-xs capitalize text-gray-500">{user.role}</span>
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-uganda-yellow font-black text-uganda-black">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </button>

              <div className="invisible absolute right-0 mt-3 w-56 rounded-2xl border border-black/5 bg-white p-2 opacity-0 shadow-[0_25px_60px_rgba(15,23,42,0.12)] transition-all duration-200 group-hover:visible group-hover:opacity-100">
                <Link
                  to={ROUTES.profile || "/profile"}
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition duration-300 hover:bg-black/5 hover:text-uganda-black"
                >
                  Profile Settings
                </Link>
                <Link
                  to={ROUTES.dashboards.base}
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition duration-300 hover:bg-black/5 hover:text-uganda-black"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-red-600 transition duration-300 hover:bg-red-50"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to={ROUTES.auth.login}
                className="rounded-full bg-uganda-yellow px-5 py-2.5 text-sm font-bold text-uganda-black transition duration-300 hover:-translate-y-0.5 hover:bg-uganda-black hover:text-white"
              >
                Login
              </Link>
              <Link
                to={ROUTES.auth.register}
                className="rounded-full border border-uganda-yellow px-5 py-2.5 text-sm font-bold text-uganda-black transition duration-300 hover:-translate-y-0.5 hover:bg-uganda-yellow"
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
