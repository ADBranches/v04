import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { authService } from "../services/auth.service";
import { bookingService } from "../services/booking.service";
import type { Booking, BookingStatus } from "../services/types/booking";
import { format } from "date-fns";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";

export default function ManageBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const user = authService.getCurrentUser();
  const userRole = user?.role;

  // ─── Load Booking on Mount ──────────────────────────────
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate("/auth/login");
      return;
    }
    if (id) loadBooking(parseInt(id));
  }, [id]);

  const loadBooking = async (bookingId: number) => {
    setLoading(true);
    try {
      const response = await bookingService.getBooking(bookingId);
      setBooking(response);
      setNotes(response.notes || "");
    } catch (err: any) {
      console.error(err);
      setError("Failed to load booking");
    } finally {
      setLoading(false);
    }
  };


  // ─── Update Notes ───────────────────────────────────────
  const handleNotesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    setUpdating(true);
    try {
      await bookingService.updateStatus(booking.id, { status: booking.status, admin_notes: notes });
      setSuccess("Notes updated successfully");
      loadBooking(booking.id);
    } catch (err: any) {
      setError(err.message || "Failed to update notes");
    } finally {
      setUpdating(false);
    }
  };

  // ─── Booking Actions ────────────────────────────────────
  const updateStatus = async (status: BookingStatus) => {
    if (!booking) return;
    try {
      await bookingService.updateStatus(booking.id, { status });
      setSuccess(`Booking status updated to "${status}"`);
      loadBooking(booking.id);
    } catch (err: any) {
      setError(err.message || "Failed to update booking");
    }
  };

  const handleCancelBooking = async () => {
    if (!booking || !confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await bookingService.cancelBooking(booking.id);
      setSuccess("Booking cancelled successfully");
      loadBooking(booking.id);
    } catch (err: any) {
      setError(err.message || "Failed to cancel booking");
    }
  };

  // ─── Render Loading State ───────────────────────────────
  if (loading) {
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
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-safari-sand">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-uganda-black mb-4">
            Booking not found
          </h1>
          <Link
            to="/bookings"
            className="text-uganda-yellow hover:underline font-african"
          >
            ← Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  // ─── Main Render ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-safari-sand">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          to="/bookings"
          className="text-uganda-yellow hover:underline mb-6 inline-block font-african"
        >
          ← Back to My Bookings
        </Link>

        {/* Alerts */}
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

        {/* Booking Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-uganda-black">
              Booking #{booking.id}
            </h1>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                booking.status === "confirmed"
                  ? "bg-green-100 text-green-800"
                  : booking.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : booking.status === "cancelled"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {booking.status.replace("-", " ")}
            </span>
          </div>

          {/* Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-uganda-black">Destination</h3>
              <Link
                to={`/destinations/${booking.destination_id}`}
                className="text-uganda-red hover:underline"
              >
                {booking.destination?.name}
              </Link>
              <p className="text-sm text-gray-600">
                {booking.destination?.location}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-uganda-black">Dates</h3>
              <p>
                {booking.start_date && !isNaN(Date.parse(booking.start_date))
                  ? format(new Date(booking.start_date), "MMM d, yyyy")
                  : "—"}{" "}
                →{" "}
                {booking.end_date && !isNaN(Date.parse(booking.end_date))
                  ? format(new Date(booking.end_date), "MMM d, yyyy")
                  : "—"}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-uganda-black">Travelers</h3>
              <p>{booking.num_people} people</p>
            </div>

            <div>
              <h3 className="font-semibold text-uganda-black">Total Paid</h3>
              <p className="text-2xl font-bold text-uganda-red">
                ${booking.total_price}
              </p>
            </div>
          </div>

          {/* Guide Section */}
          {booking.guide && booking.guide.user ? (
            <div>
              <h3 className="font-semibold text-uganda-black">Guide</h3>
              <div className="flex items-center mt-2">
                <img
                  src={booking.guide.user.avatar ?? "/avatar-placeholder.jpg"}
                  alt={booking.guide.user.name ?? "Guide"}
                  className="w-10 h-10 rounded-full mr-3 object-cover"
                />
                <Link
                  to={`/guides/${booking.guide.id}`}
                  className="text-uganda-red hover:underline"
                >
                  {booking.guide.user.name ?? "Unnamed Guide"}
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold text-uganda-black">Guide</h3>
              <p className="text-gray-600 mt-1">No guide assigned yet.</p>
            </div>
          )}


          {/* Notes */}
          {booking.notes && (
            <div>
              <h3 className="font-semibold text-uganda-black">Special Requests</h3>
              <p className="mt-1 text-gray-700">{booking.notes}</p>
            </div>
          )}

          {/* Role-Based Actions */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-uganda-black mb-3">
              {userRole === "admin"
                ? "Admin Actions"
                : userRole === "guide"
                ? "Guide Actions"
                : "User Actions"}
            </h3>
            <div className="flex flex-wrap gap-2">
              {userRole === "admin" && (
                <>
                  {booking.status === "pending" && (
                    <>
                      <button
                        onClick={() => updateStatus("confirmed")}
                        className="flex items-center bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700"
                      >
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Confirm
                      </button>
                      <button
                        onClick={() => updateStatus("rejected")}
                        className="flex items-center bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700"
                      >
                        <XCircleIcon className="w-4 h-4 mr-1" />
                        Reject
                      </button>
                    </>
                  )}
                  {booking.status === "confirmed" && (
                    <button
                      onClick={() => updateStatus("in-progress")}
                      className="btn-uganda text-sm px-3 py-1"
                    >
                      Start Trip
                    </button>
                  )}
                  {booking.status === "in-progress" && (
                    <button
                      onClick={() => updateStatus("completed")}
                      className="btn-uganda text-sm px-3 py-1"
                    >
                      Mark Complete
                    </button>
                  )}
                </>
              )}

              {userRole === "guide" && booking.status === "pending" && (
                <>
                  <button
                    onClick={() => updateStatus("confirmed")}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-african"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => updateStatus("cancelled")}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-african"
                  >
                    Reject
                  </button>
                </>
              )}

              {userRole === "user" &&
                !["cancelled", "completed"].includes(booking.status) && (
                  <button
                    onClick={handleCancelBooking}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-african"
                  >
                    Cancel Booking
                  </button>
                )}
            </div>
          </div>

          {/* Notes Update Form (for admin/guide) */}
          {(userRole === "admin" || userRole === "guide") && (
            <form
              onSubmit={handleNotesSubmit}
              className="mt-6 border-t pt-6 space-y-3"
            >
              <h3 className="font-semibold text-uganda-black">Update Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Enter internal or trip notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
              />
              <button
                type="submit"
                disabled={updating}
                className="bg-uganda-yellow text-uganda-black px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors font-display disabled:opacity-50"
              >
                {updating ? "Saving..." : "Save Notes"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
