import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service";
import { moderationService } from "../services/moderation.service";
import type { ModerationLog, ModerationFilterParams } from "../services/moderation.types";
import ModerationItem from "../components/moderation/moderation-item";

export default function ModerationPending() {
  const navigate = useNavigate();
  const [moderationLogs, setModerationLogs] = useState<ModerationLog[]>([]);
  const [filters, setFilters] = useState<ModerationFilterParams>({
    content_type: "destination",
    status: "pending",
    page: 1,
    limit: 9,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 9,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!authService.isAuthenticated() || !["admin", "auditor"].includes(user?.role || "")) {
      navigate("/auth/login");
      return;
    }
    loadPendingContent();
  }, [filters.page, filters.content_type]);

  const loadPendingContent = async () => {
    setLoading(true);
    try {
      const response = await moderationService.getPendingContent(filters);
      setModerationLogs(response.content);
      setPagination({ ...response.pagination, limit: filters.limit || 9 });
    } catch (err: any) {
      setError(err.message || "Failed to load pending content");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({
      ...prev,
      content_type: e.target.value,
      page: 1,
    }));
  };

  return (
    <div className="min-h-screen bg-safari-sand font-african">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display text-uganda-black mb-2">
            Pending Content Moderation
          </h1>
          <p className="text-gray-600">Manage all submissions awaiting review and approval.</p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Filter Controls */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
          <form className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Content Type
              </label>
              <select
                name="content_type"
                value={filters.content_type}
                onChange={handleFilterChange}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
              >
                <option value="destination">Destinations</option>
                <option value="guide">Guides</option>
                <option value="booking">Bookings</option>
                <option value="user">Users</option>
              </select>
            </div>
          </form>
        </div>

        {/* Content List */}
        {loading ? (
          <div className="text-center py-12">
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
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              ></path>
            </svg>
            <p className="mt-4 text-gray-600">Loading pending content...</p>
          </div>
        ) : moderationLogs.length === 0 ? (
          <p className="text-gray-600 text-center py-8 font-african">
            No pending content available 🎉
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {moderationLogs.map((log) => (
              <ModerationItem key={log.id} item={log} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-10">
            {pagination.page > 1 && (
              <button
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page! - 1 }))}
                className="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 font-african"
              >
                Previous
              </button>
            )}
            <span className="px-4 py-2 text-uganda-black font-semibold">
              Page {pagination.page} of {pagination.pages}
            </span>
            {pagination.page < pagination.pages && (
              <button
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page! + 1 }))}
                className="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 font-african"
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
