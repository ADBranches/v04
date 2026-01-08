import { useState, useEffect } from "react";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { guideService } from "../services/guide.service";
import type { Guide, GuideFilterParams } from "../services/guide.types";
import { authService } from "../services/auth.service";

// ✅ Shared UI components
import Loader from "../components/ui/loader";
import ErrorBanner from "../components/ui/error-banner";
import EmptyState from "../components/ui/empty-state";

export default function Guides() {
  const navigate = useNavigate();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [filters, setFilters] = useState<GuideFilterParams>({
    page: 1,
    limit: 9,
    region: "",
    status: "",
    // language: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 9,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ================= Load Guides =================
  useEffect(() => {
    loadGuides();
  }, [filters]);

  const loadGuides = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await guideService.getGuides(filters);
      const data = response?.guides || response?.data?.guides || [];
      setGuides(Array.isArray(data) ? data : []);
      setPagination(response.pagination || { page: 1, pages: 1, total: 0, limit: 9 });
    } catch (err: any) {
      console.error("❌ getGuides error:", err);
      if (err.response?.status === 401) {
        setError("⚠️ Please log in to view registered guides.");
      } else {
        setError(err.message || "Failed to load guides.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ================= Filter & Search =================
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, page: 1, search: e.target.value.trim() }));
  };

  const handleFilterChange = (field: keyof GuideFilterParams, value: string) => {
    setFilters((prev) => ({ ...prev, page: 1, [field]: value }));
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // ================= UI Rendering =================
  return (
    <div className="min-h-screen bg-safari-sand">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold font-display text-uganda-black mb-8">
          Our Tour Guides
        </h1>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadGuides();
            }}
            className="grid grid-cols-1 md:grid-cols-5 gap-4"
          >
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Guides
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={handleSearchChange}
                placeholder="Search by name, specialty, or language..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
              />
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Region
              </label>
              <select
                value={filters.region}
                onChange={(e) => handleFilterChange("region", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-uganda-yellow"
              >
                <option value="">All Regions</option>
                <option value="Central">Central Uganda</option>
                <option value="Northern">Northern Uganda</option>
                <option value="Western">Western Uganda</option>
                <option value="Eastern">Eastern Uganda</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={filters.language}
                onChange={(e) => handleFilterChange("language", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-uganda-yellow"
              >
                <option value="">Any</option>
                <option value="English">English</option>
                <option value="Swahili">Swahili</option>
                <option value="French">French</option>
                <option value="Luganda">Luganda</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-uganda-yellow"
              >
                <option value="">All</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Apply */}
            <div className="flex items-end justify-end">
              <button
                type="submit"
                className="bg-uganda-yellow text-uganda-black px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors font-african"
              >
                Apply
              </button>
            </div>
          </form>
        </div>

        {/* ✅ Harmonized UI States */}
        {loading && <Loader text="Loading guides..." />}

        {error && !loading && <ErrorBanner message={error} />}

        {!loading && !error && guides.length === 0 && (
          <EmptyState
            title="No guides found"
            subtitle="Try adjusting your filters or search terms."
            icon="/images/empty-state.svg"
          />
        )}

        {/* Guides Grid */}
        {!loading && guides.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {guides.map((guide) => (
              <div
                key={guide.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                <img
                  src={guide.user?.avatar || "/images/guide-placeholder.jpg"}
                  alt={guide.user?.name || "Guide"}
                  className="w-full h-48 object-cover rounded-t-2xl"
                />
                <div className="p-6">
                  <h3 className="text-xl font-bold font-display text-uganda-black mb-2">
                    {guide.user?.name || "Unknown Guide"}
                  </h3>
                  <p className="text-gray-600 mb-3 line-clamp-2">
                    {guide.bio || "Experienced guide ready to show you the best of Uganda."}
                  </p>

                  <div className="space-y-1 mb-4 text-sm text-gray-600">
                    {guide.languages?.length > 0 && (
                      <p>
                        <span className="font-semibold">Languages:</span>{" "}
                        {guide.languages.join(", ")}
                      </p>
                    )}
                    {guide.experience_years && (
                      <p>
                        <span className="font-semibold">Experience:</span>{" "}
                        {guide.experience_years} years
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        guide.verification_status
                      )}`}
                    >
                      {guide.verification_status || "unverified"}
                    </span>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/guides/${guide.id}`)}
                        className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors text-sm font-african"
                      >
                        View
                      </button>

                      {authService.isAuthenticated() && (
                        <button
                          onClick={() => navigate(`/bookings/create?guide_id=${guide.id}`)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-african"
                        >
                          Book
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-8">
            {pagination.page > 1 && (
              <button
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page! - 1 }))}
                className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors font-african"
              >
                Previous
              </button>
            )}
            <span className="font-african text-uganda-black">
              Page {pagination.page} of {pagination.pages}
            </span>
            {pagination.page < pagination.pages && (
              <button
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page! + 1 }))}
                className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors font-african"
              >
                Next
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
