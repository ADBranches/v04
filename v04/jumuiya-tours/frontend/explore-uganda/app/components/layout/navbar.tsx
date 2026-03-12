// app/components/layout/navbar.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import authService from "../../services/auth.service";
import { ROUTES } from "../../config/routes-config";

const navItems = [
  { label: "Destinations", to: ROUTES.destinations.list },
  { label: "Guides", to: ROUTES.guides.list },
  { label: "Search", to: "/search" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = location.pathname === "/";

  useEffect(() => {
    const syncUser = () => setUser(authService.getCurrentUser?.() || null);
    syncUser();

    window.addEventListener("authChange", syncUser as EventListener);
    return () => {
      window.removeEventListener("authChange", syncUser as EventListener);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const greetingName = useMemo(() => user?.name?.split?.(" ")?.[0] || "Traveler", [user]);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setMenuOpen(false);
    navigate(ROUTES.auth.login);
  };

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    [
      "relative rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300",
      isActive
        ? "bg-uganda-yellow text-uganda-black shadow-sm"
        : "text-gray-700 hover:bg-black/5 hover:text-uganda-black",
    ].join(" ");

  return (
    <nav
      className={[
        "sticky top-0 z-50 border-b border-black/5 backdrop-blur-xl transition-all duration-300",
        isHome ? "bg-white/90 shadow-[0_10px_30px_rgba(15,23,42,0.08)]" : "bg-white/95 shadow-sm",
      ].join(" ")}
    >
      <div className="container mx-auto flex items-center justify-between px-4 py-3 lg:px-8">
        {/* Brand */}
        <Link to={ROUTES.home || "/"} className="group flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-uganda-black text-sm font-black text-uganda-yellow shadow-lg shadow-black/15 transition duration-300 group-hover:scale-105 group-hover:bg-uganda-red group-hover:text-white">
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

        {/* Desktop nav */}
        <div className="hidden items-center gap-2 lg:flex">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClasses}>
              {item.label}
            </NavLink>
          ))}

          {user && (
            <NavLink to={ROUTES.bookings?.list || "/bookings"} className={linkClasses}>
              My Bookings
            </NavLink>
          )}
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              <div className="flex items-center gap-3 rounded-full border border-black/5 bg-black/[0.03] px-4 py-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-uganda-yellow font-black text-uganda-black">
                  {greetingName.charAt(0).toUpperCase()}
                </span>
                <div className="text-left leading-tight">
                  <p className="text-sm font-semibold text-uganda-black">Hi, {greetingName}</p>
                  <p className="text-xs capitalize text-gray-500">{user.role}</p>
                </div>
              </div>
              <Link
                to={ROUTES.dashboards.base}
                className="rounded-full bg-uganda-black px-5 py-2.5 text-sm font-bold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-uganda-red"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-bold text-uganda-black transition duration-300 hover:-translate-y-0.5 hover:border-uganda-red hover:bg-uganda-red hover:text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label="Toggle navigation menu"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-uganda-black shadow-sm transition duration-300 hover:bg-uganda-yellow lg:hidden"
        >
          {menuOpen ? (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile panel */}
      {menuOpen && (
        <div className="border-t border-black/5 bg-white/95 px-4 pb-5 pt-3 shadow-[0_20px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:hidden">
          <div className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "block rounded-2xl px-4 py-3 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-uganda-yellow text-uganda-black"
                      : "text-gray-700 hover:bg-black/5 hover:text-uganda-black",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}

            {user && (
              <NavLink
                to={ROUTES.bookings?.list || "/bookings"}
                className={({ isActive }) =>
                  [
                    "block rounded-2xl px-4 py-3 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-uganda-yellow text-uganda-black"
                      : "text-gray-700 hover:bg-black/5 hover:text-uganda-black",
                  ].join(" ")
                }
              >
                My Bookings
              </NavLink>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-black/5 bg-black/[0.03] p-4">
            {user ? (
              <>
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-uganda-yellow font-black text-uganda-black">
                    {greetingName.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="font-semibold text-uganda-black">{user.name}</p>
                    <p className="text-xs capitalize text-gray-500">{user.role}</p>
                  </div>
                </div>
                <div className="grid gap-3">
                  <Link
                    to={ROUTES.dashboards.base}
                    className="rounded-full bg-uganda-black px-5 py-3 text-center text-sm font-bold text-white"
                  >
                    Go to Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="rounded-full border border-black/10 px-5 py-3 text-sm font-bold text-uganda-black transition duration-300 hover:border-uganda-red hover:bg-uganda-red hover:text-white"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="grid gap-3">
                <Link
                  to={ROUTES.auth.login}
                  className="rounded-full bg-uganda-yellow px-5 py-3 text-center text-sm font-bold text-uganda-black"
                >
                  Login
                </Link>
                <Link
                  to={ROUTES.auth.register}
                  className="rounded-full border border-uganda-yellow px-5 py-3 text-center text-sm font-bold text-uganda-black"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
