import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import authService from "../services/auth.service";
import adminService from "../services/admin-service";
import AnalyticsDashboard from "../components/admin/analytics-dashboard";

interface AnalyticsData {
  total_users?: number;
  totalUsers?: number;
  total_bookings?: number;
  totalBookings?: number;
  total_destinations?: number;
  totalDestinations?: number;
  pending_moderations?: number;
  pendingModerations?: number;
  users?: Array<{ role: string; count: number }>;
  destinations?: Array<{ status: string; count: number }>;
  bookingsByRegion?: Array<{ region: string; count: number }>;
}

export default function SystemAnalytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!authService.isAuthenticated() || user?.role !== "admin") {
      navigate("/auth/login");
      return;
    }
    loadAnalytics();
  }, [navigate]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await adminService.getAnalytics();
      const analyticsData = response.analytics || response.data || response;
      setAnalytics(analyticsData);
    } catch (err: any) {
      setError(err.message || "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="min-h-screen bg-safari-sand flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-uganda-yellow mx-auto"
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
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
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

  const overview = analytics?.overview || analytics || {};
  const usersByRole = analytics?.users || [];
  const destinationsByStatus = analytics?.destinations || [];
  const bookingsByRegion = analytics?.bookingsByRegion || [];

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

      {/* ✅ Overview Stats using AnalyticsDashboard */}
      <div className="mb-8">
        <AnalyticsDashboard
          metrics={[
            {
              title: "Total Users",
              value: overview.total_users || overview.totalUsers || 0,
            },
            {
              title: "Total Bookings",
              value: overview.total_bookings || overview.totalBookings || 0,
            },
            {
              title: "Total Destinations",
              value:
                overview.total_destinations || overview.totalDestinations || 0,
            },
            {
              title: "Pending Moderations",
              value:
                overview.pending_moderations || overview.pendingModerations || 0,
            },
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
