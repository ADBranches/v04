import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Link } from "react-router";
import authService from "../services/auth.service";
import ModerationService from "../services/moderation.service";
import ModerationQueue from "../components/auditor/moderation-queue";

/**
 * 🧾 ContentQueue
 * Auditor interface for reviewing and moderating submitted content.
 * Supports:
 * - Filtering by content type
 * - Approve / Reject / Request Revision actions
 * - Unified ModerationService API integration
 */

export default function ContentQueue() {
  const navigate = useNavigate();
  const [content, setContent] = useState<any[]>([]);
  const [filters, setFilters] = useState({ content_type: "destination" });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // 🔐 Role Verification & Initial Load
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!authService.isAuthenticated() || user?.role !== "auditor") {
      navigate("/auth/login");
      return;
    }
    loadContent();
  }, [navigate]);

  // 🔄 Load Pending Content
  const loadContent = async (filterParams = {}) => {
    setLoading(true);
    try {
      const response = await ModerationService.getPendingContent({
        ...filters,
        ...filterParams,
      });
      setContent(response.content || []);
    } catch (err: any) {
      console.error("Error loading content:", err);
      setMessage(err.message || "Failed to load pending content.");
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Filter Form Submit
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadContent();
  };

  // ⚙️ Handle Moderation Action
  const handleAction = async (id: number, action: string) => {
    try {
      await ModerationService.moderateContent(id, action);
      setMessage(`Content ${action} successfully.`);
      loadContent();
      setTimeout(() => setMessage(""), 2500);
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "Action failed. Please try again.");
    }
  };

  // 🕓 Loading State
  if (loading)
    return (
      <div className="min-h-screen bg-safari-sand flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-10 w-10 text-uganda-yellow mx-auto"
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
          <p className="mt-4 text-gray-600">Loading moderation queue...</p>
        </div>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 font-african">
      {/* ── Header ─────────────────────────────── */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-uganda-black">
              Content Moderation Queue
            </h1>
            <p className="text-gray-600">
              Review, approve, or reject submitted destinations and other user-generated content.
            </p>
          </div>
          <Link
            to="/auditor/dashboard"
            className="text-sm text-uganda-yellow hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      {/* ── Filters ─────────────────────────────── */}
      <form
        onSubmit={handleFilterSubmit}
        className="bg-white p-6 rounded-xl shadow mb-8 border border-gray-100"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label
              htmlFor="content_type"
              className="block text-sm font-medium text-uganda-black"
            >
              Filter by Content Type
            </label>
            <select
              id="content_type"
              name="content_type"
              value={filters.content_type}
              onChange={(e) =>
                setFilters({ ...filters, content_type: e.target.value })
              }
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-uganda-yellow focus:border-uganda-yellow"
            >
              <option value="">All Types</option>
              <option value="destination">Destinations</option>
              <option value="guide_verification">Guide Verifications</option>
            </select>
          </div>

          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-display"
            >
              Apply Filter
            </button>
            <button
              type="button"
              onClick={() => {
                setFilters({ content_type: "" });
                loadContent({ content_type: "" });
              }}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 font-display"
            >
              Reset
            </button>
          </div>
        </div>
      </form>

      {/* ── Flash Message ───────────────────────── */}
      {message && (
        <div className="mb-4 bg-safari-sand/50 text-uganda-black px-4 py-2 rounded-lg shadow">
          {message}
        </div>
      )}

      {/* ── Moderation Queue ────────────────────── */}
      <ModerationQueue
        destinations={content}
        onApprove={(id) => handleAction(id, "approve")}
        onReject={(id) => handleAction(id, "reject")}
        onRequestRevision={(id) => handleAction(id, "request-revision")}
      />
    </div>
  );
}
