import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import authService from "../services/auth.service";
import ModerationService from "../services/moderation.service";
import AnalyticsDashboard from "../components/admin/analytics-dashboard";

/**
 * 🔍 AuditorDashboard
 * Provides auditors with a real-time overview of moderation statistics:
 * - Pending / Approved / Rejected destinations
 * - Pending / Verified guides
 * - Total items reviewed this cycle
 *
 * Data is aggregated from the ModerationService for consistency with backend APIs.
 */

export default function AuditorDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<{
    pendingDestinations: number;
    approvedDestinations: number;
    rejectedDestinations: number;
    pendingGuides: number;
    verifiedGuides: number;
    totalReviewed: number;
  } | null>(null);
  const [error, setError] = useState("");

  // 🔐 Verify role access & load dashboard data
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!authService.isAuthenticated() || user?.role !== "auditor") {
      navigate("/auth/login");
      return;
    }
    loadDashboard();
  }, [navigate]);

  // 🔄 Fetch moderation statistics
  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await ModerationService.getDashboardData();
      setDashboardData(data);
    } catch (err: any) {
      console.error("Error loading dashboard:", err);
      setError(err.message || "Failed to load auditor dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboard = () => loadDashboard();

  // ⏳ Loading UI
  if (loading && !dashboardData) {
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
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.3 0 0 5.3 0 12h4z"
            ></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ❌ Error UI
  if (error && !dashboardData) {
    return (
      <div className="min-h-screen bg-safari-sand flex items-center justify-center">
        <div className="text-center">
          <div className="text-uganda-red text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-uganda-black mb-2">
            Unable to Load Dashboard
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshDashboard}
            className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-display"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ✅ Render dashboard
  const stats = dashboardData || {
    pendingDestinations: 0,
    approvedDestinations: 0,
    rejectedDestinations: 0,
    pendingGuides: 0,
    verifiedGuides: 0,
    totalReviewed: 0,
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold font-display text-uganda-black">
          Auditor Dashboard
        </h1>
        <p className="text-gray-600">
          Overview of content moderation and guide verification activities.
        </p>
      </header>

      <div className="flex justify-end mb-6">
        <button
          onClick={refreshDashboard}
          className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-display"
        >
          Refresh Dashboard
        </button>
      </div>

      {/* Analytics summary */}
      <AnalyticsDashboard
        metrics={[
          { title: "Pending Destinations", value: stats.pendingDestinations },
          { title: "Approved Destinations", value: stats.approvedDestinations },
          { title: "Rejected Destinations", value: stats.rejectedDestinations },
          { title: "Pending Guides", value: stats.pendingGuides },
          { title: "Verified Guides", value: stats.verifiedGuides },
          { title: "Total Reviewed", value: stats.totalReviewed },
        ]}
      />

      {/* Optional details */}
      <div className="mt-10 bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-uganda-black mb-4">
          Moderation Insights
        </h3>
        <p className="text-gray-700 leading-relaxed">
          This panel helps auditors monitor the quality and compliance of
          content submitted by guides. Each pending destination or guide
          verification is reviewed for authenticity, accuracy, and adherence to
          Jumuiya’s tourism standards.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Use the <span className="font-semibold text-uganda-yellow">Content Queue</span> to review
          destinations awaiting approval, and the{" "}
          <span className="font-semibold text-uganda-yellow">Guide Approvals</span> panel
          to handle guide verification requests.
        </p>
      </div>
    </div>
  );
}
