import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import authService from "../services/auth.service";
import adminService from "../services/admin-service";
import AnalyticsDashboard from "../components/admin/analytics-dashboard";
import { ROUTES } from "../config/routes-config";

interface AnalyticsData {
  // Flat totals (preferred shape)
  totalUsers?: number;
  totalBookings?: number;
  totalDestinations?: number;
  pendingModerations?: number;

  // Legacy/alt keys sometimes returned by older endpoints
  total_users?: number;
  total_bookings?: number;
  total_destinations?: number;
  pending_moderations?: number;

  // Optional groupings
  users?: Array<{ role: string; count: number }>;
  destinations?: Array<{ status: string; count: number }>;
  bookingsByRegion?: Array<{ region: string; count: number }>;

  // Optional nested stats (e.g., stats: { users: ..., destinations: ... })
  stats?: {
    users?: Array<{ role: string; count: number }>;
    destinations?: Array<{ status: string; count: number }>;
    bookingsByRegion?: Array<{ region: string; count: number }>;
    totalUsers?: number;
    totalBookings?: number;
    totalDestinations?: number;
    pendingModerations?: number;
  };

  // Optional overview object
  overview?: {
    totalUsers?: number;
    totalBookings?: number;
    totalDestinations?: number;
    pendingModerations?: number;
    // legacy aliases
    total_users?: number;
    total_bookings?: number;
    total_destinations?: number;
    pending_moderations?: number;
  };
}

export default function SystemAnalytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!authService.isAuthenticated() || user?.role !== "admin") {
      navigate(ROUTES.auth.login);
      return;
    }
    void loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // ✅ adminService.getAnalytics() now hits /admin/stats (correct)
      const response = await adminService.getAnalytics();
      // Defensive unwrapping
      const analyticsData: AnalyticsData =
        (response as any)?.analytics ??
        (response as any)?.data ??
        (response as any) ??
        {};

      setAnalytics(analyticsData);
    } catch (err: any) {
      setError(err.message || "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  // Derive a normalized overview object:
  // Prefer explicit overview; else flatten from root/stats, with legacy alias support.
  const overview = (() => {
    const src: any =
      analytics?.overview ??
      analytics?.stats ??
      analytics ??
      {};

    return {
      totalUsers:
        src.totalUsers ??
        src.total_users ??
        0,
      totalBookings:
        src.totalBookings ??
        src.total_bookings ??
        0,
      totalDestinations:
        src.totalDestinations ??
        src.total_destinations ??
        0,
      pendingModerations:
        src.pendingModerations ??
        src.pending_moderations ??
        0,
    };
  })();

  // Derive groupings (support nested stats or top-level arrays)
  const usersByRole =
    analytics?.users ??
    analytics?.stats?.users ??
    [];

  const destinationsByStatus =
    analytics?.destinations ??
    analytics?.stats?.destinations ??
    [];

  const bookingsByRegion =
    analytics?.bookingsByRegion ??
    analytics?.stats?.bookingsByRegion ??
    [];

  const regionStats = bookingsByRegion.reduce(
    (acc: Record<string, number>, stat) => {
      const regionName = stat.region || "";
      const count = stat.count || 0;
      if (regionName) {
        acc[regionName] = (acc[regionName] || 0) + count;
      }
      return acc;
    },
    {}
  );

  if (loading && !analytics) {
    return (
      <div className="min-h-screen bg-safari-sand flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-uganda-yellow mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.3 0 0 5.3 0 12h4z"
            />
          </svg>
        </div>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="min-h-screen bg-safari-sand flex items-center justify-center">
        <div className="text-center">
          <div className="text-uganda-red text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-uganda-black mb-2">
            Unable to Load Analytics
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadAnalytics}
            className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-display"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold font-display text-uganda-black">
          System Analytics
        </h1>
        <p className="text-gray-600">View key metrics for Jumuiya Tours.</p>
      </header>

      <div className="flex justify-end mb-6">
        <button
          onClick={loadAnalytics}
          className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-display"
        >
          Refresh Analytics
        </button>
      </div>

      {/* ✅ Overview Stats using AnalyticsDashboard with normalized overview */}
      <div className="mb-8">
        <AnalyticsDashboard
          metrics={[
            { title: "Total Users", value: overview.totalUsers || 0 },
            { title: "Total Bookings", value: overview.totalBookings || 0 },
            { title: "Total Destinations", value: overview.totalDestinations || 0 },
            { title: "Pending Moderations", value: overview.pendingModerations || 0 },
          ]}
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Users by Role */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold font-display text-uganda-black mb-4">
            Users by Role
          </h3>
          <div className="space-y-3">
            {usersByRole.map((userStat, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-safari-sand/20 rounded-lg"
              >
                <span className="text-uganda-black font-african capitalize">
                  {userStat.role}
                </span>
                <span className="text-uganda-yellow font-bold">
                  {userStat.count}
                </span>
              </div>
            ))}
            {usersByRole.length === 0 && (
              <div className="text-gray-500 text-sm">No user role breakdown available.</div>
            )}
          </div>
        </div>

        {/* Destinations by Status */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold font-display text-uganda-black mb-4">
            Destinations by Status
          </h3>
          <div className="space-y-3">
            {destinationsByStatus.map((destStat, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-safari-sand/20 rounded-lg"
              >
                <span className="text-uganda-black font-african capitalize">
                  {destStat.status}
                </span>
                <span className="text-uganda-yellow font-bold">
                  {destStat.count}
                </span>
              </div>
            ))}
            {destinationsByStatus.length === 0 && (
              <div className="text-gray-500 text-sm">No destination status breakdown available.</div>
            )}
          </div>
        </div>
      </div>

      {/* Bookings by Region */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold font-display text-uganda-black mb-4">
          Bookings by Region
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(regionStats).map(([region, count]) => (
            <div
              key={region}
              className="flex items-center justify-between p-4 bg-safari-sand/20 rounded-lg"
            >
              <span className="text-uganda-black font-african">{region}</span>
              <span className="text-uganda-yellow font-bold">
                {count} Bookings
              </span>
            </div>
          ))}

          {Object.keys(regionStats).length === 0 && (
            <div className="col-span-2 text-center py-8 text-gray-500">
              No regional booking data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
