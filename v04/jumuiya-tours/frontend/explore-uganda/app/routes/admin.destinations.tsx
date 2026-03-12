import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../services/auth.service";
import { destinationService } from "../services/destination-service";
import { ROUTES } from "../config/routes-config";

interface Destination {
  id: number;
  name: string;
  region?: string;
  district?: string;
  status: "approved" | "pending" | "rejected";
  created_at?: string;
}

export default function AdminDestinations() {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const user = authService.getCurrentUser();

    // ✅ Role check is correct: no array passed to hasRole
    if (!authService.isAuthenticated() || user?.role !== "admin") {
      navigate(ROUTES.auth.login);
      return;
    }

    loadDestinations();
  }, [navigate]);

  const loadDestinations = async () => {
    setLoading(true);
    setError("");

    try {
      // ✅ Use the alias we added: getAll({ includePending: true })
      const response = await destinationService.getAll({
        includePending: true,
      });

      const items =
        (response as any)?.destinations ??
        (response as any)?.data ??
        response ??
        [];

      setDestinations(Array.isArray(items) ? items : []);
    } catch (err: any) {
      setError(err.message || "Failed to load destinations");
    } finally {
      setLoading(false);
    }
  };

  const approveDestination = async (id: number) => {
    try {
      // ✅ Use destinationService (not dashboardService)
      await destinationService.approveDestination(id, "Approved by admin");
      setSuccess("Destination approved successfully");
      setError("");
      await loadDestinations();
      setTimeout(() => setSuccess(""), 2500);
    } catch (err: any) {
      setError(err.message || "Failed to approve destination");
      setTimeout(() => setError(""), 4000);
    }
  };

  const rejectDestination = async (id: number) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) {
      setError("Rejection reason is required");
      setTimeout(() => setError(""), 4000);
      return;
    }

    try {
      // ✅ Use destinationService (not dashboardService)
      await destinationService.rejectDestination(id, reason);
      setSuccess("Destination rejected successfully");
      setError("");
      await loadDestinations();
      setTimeout(() => setSuccess(""), 2500);
    } catch (err: any) {
      setError(err.message || "Failed to reject destination");
      setTimeout(() => setError(""), 4000);
    }
  };

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
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.3 0 0 5.3 0 12h4z"
            />
          </svg>
          <p className="mt-4 text-gray-600">Loading destinations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-uganda-black font-display">
          Destination Management
        </h1>
        <p className="text-gray-600">
          Approve, reject, or inspect destinations submitted to Jumuiya Tours.
        </p>
      </header>

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {destinations.map((destination) => (
          <div
            key={destination.id}
            className="bg-white rounded-xl shadow p-6 hover:shadow-2xl transition"
          >
            <h3 className="text-lg font-semibold text-uganda-black mb-1">
              {destination.name}
            </h3>

            <p className="text-sm text-gray-600">
              {destination.region || "Unknown Region"}
              {destination.district ? ` — ${destination.district}` : ""}
            </p>

            <p
              className={`mt-2 text-sm font-medium ${
                destination.status === "approved"
                  ? "text-green-600"
                  : destination.status === "pending"
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              Status: {destination.status}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to={ROUTES.destinations.detail(destination.id)}
                className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition"
              >
                View
              </Link>

              {destination.status === "pending" && (
                <>
                  <button
                    onClick={() => approveDestination(destination.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => rejectDestination(destination.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {destinations.length === 0 && (
          <div className="text-center py-20 col-span-full text-gray-500">
            No destinations available.
          </div>
        )}
      </div>
    </div>
  );
}
