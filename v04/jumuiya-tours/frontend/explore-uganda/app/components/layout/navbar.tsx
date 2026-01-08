// app/components/layout/navbar.tsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/auth.service";

export default function Navbar() {
  const navigate = useNavigate();
  
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    authService.logout();
    navigate("/auth/login");
  };

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50 font-african">
      <div className="container mx-auto flex justify-between items-center px-4 py-3 md:py-4">
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-bold text-uganda-black font-display flex items-center"
        >
          Explore<span className="text-uganda-yellow ml-1">Uganda</span>
        </Link>

        {/* Hamburger Icon (Mobile) */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden focus:outline-none text-uganda-black"
        >
          {menuOpen ? (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>

        {/* Navigation Links (Desktop) */}
        <div className="hidden md:flex items-center space-x-6">
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

          <Link
            to="/search"
            className="text-gray-700 hover:text-uganda-yellow transition-colors"
          >
            Search
          </Link>

          {user && (
            <Link
              to="/bookings"
              className="text-gray-700 hover:text-uganda-yellow transition-colors"
            >
              My Bookings
            </Link>
          )}

          {user ? (
            <>
              <span className="text-gray-700 text-sm">
                Hi, {user.name.split(" ")[0]}
              </span>
              <button
                onClick={handleLogout}
                className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/auth/login"
              className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-inner animate-slide-down">
          <div className="flex flex-col space-y-4 px-6 py-4">
            <Link
              to="/destinations"
              className="text-gray-700 hover:text-uganda-yellow transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Destinations
            </Link>

            <Link
              to="/guides"
              className="text-gray-700 hover:text-uganda-yellow transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Guides
            </Link>

            <Link
              to="/search"
              className="text-gray-700 hover:text-uganda-yellow transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Search
            </Link>

            {user && (
              <Link
                to="/bookings"
                className="text-gray-700 hover:text-uganda-yellow transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                My Bookings
              </Link>
            )}

            {user ? (
              <button
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/auth/login"
                onClick={() => setMenuOpen(false)}
                className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors text-center"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
