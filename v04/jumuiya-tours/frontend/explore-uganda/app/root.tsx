import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";
import React, { useState, useEffect } from "react";
import "./app.css";
import Header from "./components/layout/header";
import Footer from "./components/layout/footer";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap",
  },
];

// ✅ Root layout component
export default function Root() {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const handleMenuClick = () => setMenuOpen(!isMenuOpen);

  // --- ✅ Global unhandled rejection handler ---
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (import.meta.env.MODE === "development") {
        console.warn("⚠️ Unhandled promise rejection:", event.reason);
      } else {
        console.info("%c⚠️ Something went wrong (handled gracefully)", "color: orange");
      }
      event.preventDefault();
    };

    window.addEventListener("unhandledrejection", handleRejection);
    return () => window.removeEventListener("unhandledrejection", handleRejection);
  }, []);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Meta />
        <Links />
      </head>

      <body className="min-h-screen flex flex-col relative">
        {/* Header */}
        <Header onMenuClick={handleMenuClick} />

        {/* ✅ Mobile Sidebar Overlay */}
        {isMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex bg-black bg-opacity-50">
            {/* Sidebar Drawer */}
            <div className="bg-white w-64 p-6 shadow-xl border-r border-gray-200 flex flex-col justify-between">
              <nav className="flex flex-col space-y-4">
                <a
                  href="/"
                  className="text-gray-800 hover:text-yellow-600 transition-colors"
                >
                  Home
                </a>
                <a
                  href="/destinations"
                  className="text-gray-800 hover:text-yellow-600 transition-colors"
                >
                  Destinations
                </a>
                <a
                  href="/guides"
                  className="text-gray-800 hover:text-yellow-600 transition-colors"
                >
                  Guides
                </a>
                <a
                  href="/bookings"
                  className="text-gray-800 hover:text-yellow-600 transition-colors"
                >
                  My Bookings
                </a>
              </nav>

              <button
                onClick={() => setMenuOpen(false)}
                className="mt-6 w-full text-sm text-gray-600 border border-gray-300 rounded-lg py-2 hover:bg-gray-100 transition"
              >
                Close
              </button>
            </div>

            {/* Click outside area to close */}
            <div
              className="flex-1"
              onClick={() => setMenuOpen(false)}
            />
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 pt-16">
          <Outlet />
        </main>

        {/* Footer */}
        <Footer />

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// Optional — fallback during hydration
export function HydrateFallback() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-lg">Loading...</div>
    </div>
  );
}
