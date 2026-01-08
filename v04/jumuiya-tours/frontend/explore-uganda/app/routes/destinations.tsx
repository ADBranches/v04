import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { destinationService } from "../services/destination-service";
import { authService } from "../services/auth.service";
import type { Destination, FilterParams } from "../services/destination.types";

// ✅ Optional shared UI components (create if not existing)
import Loader from "../components/ui/loader";
import ErrorBanner from "../components/ui/error-banner";
import EmptyState from "../components/ui/empty-state";

export default function DestinationsPage() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [filters, setFilters] = useState<FilterParams>({
    page: 1,
    limit: 12,
    search: "",
    region: "",
    difficulty: "",
    featured: false,
    sort: "created_at",
    order: "desc",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 12,
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // ================= Load destinations =================
  useEffect(() => {
    const loadDestinations = async () => {
      setLoading(true);
      setMessage(null);
      try {
        const response = await destinationService.getFilteredDestinations({
          query: filters.search,
          region: filters.region,
          difficulty: filters.difficulty,
          page: filters.page,
          limit: filters.limit,
        });

        const data: Destination[] = response?.destinations || response?.data?.destinations || [];
        setDestinations(Array.isArray(data) ? data : []);
        setPagination(response.pagination || { page: 1, pages: 1, total: 0, limit: 12 });
      } catch (err: any) {
        setMessage({ type: "error", text: err.message || "Failed to load destinations" });
      } finally {
        setLoading(false);
      }
    };

    loadDestinations();
  }, [filters]);

  // ================= Filter Handlers =================
  const handleFilterChange = (field: keyof FilterParams, value: any) => {
    setFilters((prev) => ({ ...prev, page: 1, [field]: value }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, page: 1, search: e.target.value.trim() }));
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
  };

  // ================= CRUD / Moderation =================
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this destination?")) return;
    try {
      await destinationService.deleteDestination(id);
      setMessage({ type: "success", text: "Destination deleted successfully" });
      setDestinations((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to delete" });
    }
  };

  const handleApprove = async (id: number) => {
    const notes = prompt("Approval notes (optional):");
    try {
      await destinationService.approveDestination(id, notes || "");
      setMessage({ type: "success", text: "Destination approved successfully" });
      refreshList();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    try {
      await destinationService.rejectDestination(id, reason);
      setMessage({ type: "success", text: "Destination rejected" });
      refreshList();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleFeatureToggle = async (id: number, isFeatured: boolean) => {
    try {
      if (isFeatured) {
        await destinationService.unfeatureDestination(id);
        setMessage({ type: "success", text: "Destination unfeatured" });
      } else {
        await destinationService.featureDestination(id);
        setMessage({ type: "success", text: "Destination featured" });
      }
      refreshList();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const refreshList = async () => {
    const response = await destinationService.getFilteredDestinations({
      query: filters.search,
      region: filters.region,
      difficulty: filters.difficulty,
      page: filters.page,
      limit: filters.limit,
    });
    setDestinations(response.destinations);
    setPagination(response.pagination || pagination);
  };

  const isAdmin = user?.role === "admin";
  const isAuditor = user?.role === "auditor";
  const isGuide = user?.role === "guide";

  // ================= UI Rendering =================
  return (
    <div className="min-h-screen bg-safari-sand">
      <div className="container mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-uganda-black">Explore Uganda</h1>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/search")}
              className="bg-white border border-uganda-yellow text-uganda-black px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-yellow-50 transition"
            >
              🔍 Advanced Search
            </button>
            {(isAdmin || isGuide) && (
              <Link to="/destinations/create" className="btn-uganda px-4 py-2 text-sm">
                + Add Destination
              </Link>
            )}
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Filters */}
        <form
          onSubmit={handleFilterSubmit}
          className="bg-white p-6 rounded-2xl shadow-lg mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={handleSearchChange}
              placeholder="Search destinations..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
            <select
              value={filters.region}
              onChange={(e) => handleFilterChange("region", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-uganda-yellow"
            >
              <option value="">All Regions</option>
              <option value="Central">Central Uganda</option>
              <option value="Eastern">Eastern Uganda</option>
              <option value="Northern">Northern Uganda</option>
              <option value="Western">Western Uganda</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
            <select
              value={filters.difficulty}
              onChange={(e) => handleFilterChange("difficulty", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-uganda-yellow"
            >
              <option value="">All Levels</option>
              <option value="Easy">Easy</option>
              <option value="Moderate">Moderate</option>
              <option value="Difficult">Difficult</option>
            </select>
          </div>

          <div className="flex items-end justify-end">
            <button type="submit" className="btn-uganda px-6 py-2">
              Apply Filters
            </button>
          </div>
        </form>

        {/* Loading */}
        {loading && <Loader text="Loading destinations..." />}

        {/* Error State */}
        {message?.type === "error" && <ErrorBanner message={message.text} />}

        {/* Empty State */}
        {!loading && !message?.text && destinations.length === 0 && (
          <EmptyState
            title="No destinations found"
            subtitle="Try adjusting your search filters or keywords."
            icon="/images/empty-state.svg"
          />
        )}

        {/* Grid */}
        {!loading && destinations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {destinations.map((dest) => (
              <div
                key={dest.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1"
              >
                <img
                  src={dest.images?.[0] || "/images/uganda-placeholder.jpg"}
                  alt={dest.name}
                  className="w-full h-48 object-cover rounded-t-2xl"
                />
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-uganda-black">{dest.name}</h3>
                  <p className="text-gray-600 mb-3 line-clamp-2">
                    {dest.short_description || dest.description || "No description."}
                  </p>
                  <p className="text-sm text-gray-500">
                    Region: {dest.region} • Difficulty: {dest.difficulty_level || "N/A"}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => navigate(`/destinations/${dest.id}`)}
                      className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-400"
                    >
                      View
                    </button>

                    {(isAdmin || isGuide) && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // prevent parent card or image from catching the click
                            navigate(`/destinations/${dest.id}/edit`);
                          }}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(dest.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </>
                    )}

                    {(isAdmin || isAuditor) && (
                      <>
                        {dest.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(dest.id)}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(dest.id)}
                              className="bg-red-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-800"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleFeatureToggle(dest.id, !!dest.featured)}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700"
                        >
                          {dest.featured ? "Unfeature" : "Feature"}
                        </button>
                      </>
                    )}
                  </div>

                  {dest.status && (
                    <p className="text-xs text-gray-500 mt-2">Status: {dest.status}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-8">
            {pagination.page > 1 && (
              <button
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page! - 1 }))}
                className="btn-uganda px-4 py-2"
              >
                Prev
              </button>
            )}
            <span className="text-sm text-gray-700">
              Page {pagination.page} of {pagination.pages}
            </span>
            {pagination.page < pagination.pages && (
              <button
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page! + 1 }))}
                className="btn-uganda px-4 py-2"
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
