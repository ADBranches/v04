import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { destinationService } from "../../services/destination-service";
import { authService } from "../../services/auth.service";
import type { Destination } from "../../services/dashboard.types";
import { StarIcon } from "@heroicons/react/24/solid";

export default function DestinationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    setUser(authService.getCurrentUser());
  }, []);

  const [destination, setDestination] = useState<Destination | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // Load destination
  useEffect(() => {
    const fetchDestination = async () => {
      if (!id) return;
      try {
        const response = await destinationService.getDestination(Number(id));
        setDestination(response.destination);
      } catch {
        if (typeof window !== "undefined") navigate("/404");
      } finally {
        setLoading(false);
      }
    };
    fetchDestination();
  }, [id, navigate]);

  const refresh = async () => {
    if (!id) return;
    const response = await destinationService.getDestination(Number(id));
    setDestination(response.destination);
  };

  // Moderation handlers
  const handleDelete = async () => {
    if (!destination || !confirm("Are you sure you want to delete this destination?")) return;
    try {
      await destinationService.deleteDestination(destination.id);
      setMessage({ type: "success", text: "Destination deleted successfully" });
      setTimeout(() => navigate("/destinations"), 2000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleApprove = async () => {
    const notes = prompt("Approval notes (optional):");
    try {
      await destinationService.approveDestination(destination!.id, notes || "");
      setMessage({ type: "success", text: "Destination approved" });
      refresh();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleReject = async () => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    try {
      await destinationService.rejectDestination(destination!.id, reason);
      setMessage({ type: "success", text: "Destination rejected" });
      refresh();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleFeatureToggle = async () => {
    try {
      if (destination!.featured) {
        await destinationService.unfeatureDestination(destination!.id);
        setMessage({ type: "success", text: "Destination unfeatured" });
      } else {
        await destinationService.featureDestination(destination!.id);
        setMessage({ type: "success", text: "Destination featured" });
      }
      refresh();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const isAdminOrAuditor = user && ["admin", "auditor"].includes(user.role);
  const isGuide = user?.role === "guide";
  const canEdit = isAdminOrAuditor || (isGuide && destination?.created_by === user?.id);

  // Loading / error states
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-safari-sand">
        <div className="text-center">
          <svg
            className="animate-spin h-10 w-10 text-uganda-yellow mx-auto mb-3"
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
              d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4zm2 5.29A7.96 7.96 0 014 12H0c0 3.04 1.13 5.82 3 7.94l3-2.65z"
            />
          </svg>
          <p className="text-gray-600">Loading destination details...</p>
        </div>
      </div>
    );

  if (!destination)
    return (
      <div className="text-center py-20">
        <h1 className="text-xl font-semibold text-uganda-black mb-3">
          Destination not found
        </h1>
        <Link to="/destinations" className="text-uganda-yellow hover:underline">
          ← Back to Destinations
        </Link>
      </div>
    );

  return (
    <div className="min-h-screen bg-safari-sand">
      <div className="container mx-auto px-4 py-10">
        <Link
          to="/destinations"
          className="text-uganda-yellow hover:underline mb-8 inline-block"
        >
          ← Back to Destinations
        </Link>

        {message && (
          <div
            className={`mb-6 px-4 py-3 rounded-lg text-sm ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Content Layout */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <img
            src={destination.images?.[0] || "/images/uganda-placeholder.jpg"}
            alt={destination.name}
            className="w-full h-72 object-cover"
          />

          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-uganda-black">
                {destination.name}
              </h1>
              {destination.featured && (
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                  Featured
                </span>
              )}
            </div>

            <p className="text-gray-700 mb-6">{destination.description}</p>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>Location:</strong> {destination.location}
                </p>
                <p>
                  <strong>Region:</strong> {destination.region}
                </p>
                <p>
                  <strong>Duration:</strong> {destination.duration_days} days
                </p>
                <p>
                  <strong>Group Size:</strong> Up to {destination.max_group_size} people
                </p>
              </div>

              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>Price:</strong>{" "}
                  <span className="text-2xl font-bold text-uganda-red">
                    ${destination.price_per_person}
                  </span>{" "}
                  / person
                </p>
                <div>
                  <strong>Rating:</strong>{" "}
                  <span className="inline-flex items-center">
                    <span className="flex text-uganda-yellow mr-1">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.floor(destination.rating || 0)
                              ? "fill-current"
                              : "fill-gray-300"
                          }`}
                        />
                      ))}
                    </span>
                    {destination.rating ? destination.rating.toFixed(1) : "0.0"} ({destination.review_count || 0})
                  </span>
                </div>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`font-medium ${
                      destination.status === "approved"
                        ? "text-green-600"
                        : destination.status === "pending"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {destination.status}
                  </span>
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-8 flex flex-wrap gap-4">
              {authService.isAuthenticated() && destination.status === "approved" && (
                <button
                  onClick={() =>
                    navigate(`/bookings/create?destination=${destination.id}`)
                  }
                  className="btn-uganda px-6 py-3"
                >
                  Book Now
                </button>
              )}

              {canEdit && (
                <>
                  <button
                    onClick={() => navigate(`/destinations/edit/${destination.id}`)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
                  >
                    Delete
                  </button>
                </>
              )}

              {isAdminOrAuditor && destination.status === "pending" && (
                <>
                  <button
                    onClick={handleApprove}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={handleReject}
                    className="bg-red-700 text-white px-6 py-3 rounded-lg hover:bg-red-800"
                  >
                    Reject
                  </button>
                </>
              )}

              {isAdminOrAuditor && (
                <button
                  onClick={handleFeatureToggle}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
                >
                  {destination.featured ? "Unfeature" : "Feature"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/destinations" className="text-uganda-yellow hover:underline">
            ← Back to Destinations
          </Link>
        </div>
      </div>
    </div>
  );
}
