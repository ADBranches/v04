// app/routes/bookings.tsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service";
import { bookingService } from "../services/booking.service";
import type { Booking } from "../services/booking.types";
import type { BookingStatus } from "../services/booking.types";

/**
 * My Bookings Page — Displays all bookings for the logged-in user,
 * allows filtering, and supports booking actions like confirm/cancel.
 */
export default function Bookings() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filters, setFilters] = useState({ status: "", page: 1, limit: 9 });
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 9,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ─── Auth Redirect ──────────────────────────────
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate("/auth/login");
      return;
    }

    // 🧩 Defensive check: prevent null user IDs before loading bookings
    if (!user?.id) {
      console.warn("⚠️ No user ID detected, aborting bookings load.");
      setError("Please log in again to view bookings.");
      return;
    }

    loadBookings();
  }, [filters]);

  // ─── Load Bookings ──────────────────────────────
  const loadBookings = async () => {
  setLoading(true);
  try {
    const response = await bookingService.getBookings({
      ...filters,
      user_id: user?.id,
      status: filters.status as BookingStatus, // Cast the status property to BookingStatus
    });
    setBookings(response.bookings);
    if (response.pagination) setPagination(response.pagination);
  } catch (err: any) {
    setError(err.message || "Failed to load bookings");
  } finally {
    setLoading(false);
  }
};

  // ─── Handle Filter Submit ───────────────────────
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData(e.target as HTMLFormElement);
    setFilters((prev) => ({
      ...prev,
      status: form.get("status") as string,
      page: 1,
    }));
  };

  // ─── Booking Actions ────────────────────────────
  const handleConfirmBooking = async (id: number) => {
    try {
      await bookingService.confirmBooking(id);
      setSuccess("Booking confirmed successfully");
      loadBookings();
    } catch (err: any) {
      setError(err.message || "Failed to confirm booking");
    }
  };

  const handleCancelBooking = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await bookingService.cancelBooking(id);
      setSuccess("Booking cancelled successfully");
      loadBookings();
    } catch (err: any) {
      setError(err.message || "Failed to cancel booking");
    }
  };

  const userRole = user?.role;

  // ─── Render ─────────────────────────────────────
  return (
    <div className="min-h-screen bg-safari-sand">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold font-display text-uganda-black">
            My Bookings
          </h1>
          <button
            onClick={() => navigate("/bookings/create")}
            className="bg-uganda-yellow text-uganda-black px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors font-african"
          >
            + New Booking
          </button>
        </div>

        {/* Feedback Messages */}
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

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <form
            onSubmit={handleFilterSubmit}
            className="flex flex-wrap gap-4 items-end"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <button
              type="submit"
              className="bg-uganda-yellow text-uganda-black px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors font-african"
            >
              Filter
            </button>
          </form>
        </div>

        {/* Bookings List */}
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
                d="M4 12a8 8 0 018-8V0C5.3 0 0 5.3 0 12h4z"
              ></path>
            </svg>
            <p className="mt-4 text-gray-600">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 mb-4">
              No bookings found for your account.
            </p>
            <Link
              to="/bookings/create"
              className="bg-uganda-yellow text-uganda-black px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors font-african"
            >
              Create Your First Booking
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold font-display text-uganda-black">
                    {booking.destination?.name || "Destination"}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {booking.destination?.district ||
                      booking.destination?.region ||
                      "—"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Traveler: {booking.user?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Guide: {booking.guide?.user?.name || "Unassigned"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Duration:{" "}
                    {new Date(booking.start_date).toLocaleDateString()} –{" "}
                    {new Date(booking.end_date).toLocaleDateString()}
                  </p>
                  <p
                    className={`text-sm mt-1 font-medium ${
                      booking.status === "pending"
                        ? "text-gray-600"
                        : booking.status === "confirmed"
                        ? "text-green-600"
                        : booking.status === "cancelled"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  >
                    Status: {booking.status}
                  </p>

                  {booking.notes && (
                    <p className="text-sm text-gray-500 mt-2">
                      Notes: {booking.notes}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      onClick={() =>
                        navigate(`/bookings/manage/${booking.id}`)
                      }
                      className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-african"
                    >
                      View
                    </button>

                    {userRole === "guide" && booking.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleConfirmBooking(booking.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-african"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-african"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {userRole === "user" &&
                      !["cancelled", "completed"].includes(booking.status) && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-african"
                        >
                          Cancel
                        </button>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className="flex justify-center space-x-2 mt-6">
            {pagination.page > 1 && (
              <button
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                className="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 font-african"
              >
                Previous
              </button>
            )}
            <span className="px-4 py-2 text-uganda-black font-african">
              Page {pagination.page} of {pagination.pages}
            </span>
            {pagination.page < pagination.pages && (
              <button
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                }
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
