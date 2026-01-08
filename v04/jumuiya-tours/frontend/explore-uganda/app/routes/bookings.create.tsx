import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service";
import { bookingService } from "../services/booking.service";
import { destinationService } from "../services/destination-service";
import type { Destination } from "../services/types/destinations";

interface BookingFormData {
  destination_id: number;
  start_date: string;
  end_date: string;
  num_people: number;
  notes: string;
}

export default function CreateBooking() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const [formData, setFormData] = useState<BookingFormData>({
    destination_id: 0,
    start_date: "",
    end_date: "",
    num_people: 1,
    notes: "",
  });

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [filteredDestinations, setFilteredDestinations] = useState<Destination[]>([]);
  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ─── Auth Guard ───────────────────────────────────
  useEffect(() => {
    // Prevent duplicate API calls
    let mounted = true;

    const init = async () => {
      if (!user || user.role !== "user") {
        navigate("/auth/login");
        return;
      }
      if (mounted) {
        await loadDestinations();
      }
    };

    init();

    return () => {
      mounted = false;
    };
    // Only run once when component mounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Filter destinations by region ────────────────
  useEffect(() => {
    if (region) {
      setFilteredDestinations(destinations.filter((d) => d.region === region));
    } else {
      setFilteredDestinations(destinations);
    }
  }, [region, destinations]);

  // ─── Load Destinations ────────────────────────────
  const loadDestinations = async () => {
    if (loading) return; // Prevent parallel fetches
    setLoading(true);
    setError("");

    try {
      const response = await destinationService.getDestinations();
      setDestinations(response.destinations);
      setFilteredDestinations(response.destinations);
    } catch (err: any) {
      if (err.status === 429) {
        setError("Too many requests. Please wait a few seconds and try again.");
      } else {
        setError("Failed to load destinations");
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Handle Form Inputs ───────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "region") setRegion(value);
  };

  // ─── Submit Form ──────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.destination_id || !formData.start_date || !formData.end_date) {
      setError("Please complete all required fields");
      return;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      setError("End date must be after start date");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await bookingService.createBooking({
        destination_id: formData.destination_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        num_people: formData.num_people,
        notes: formData.notes.trim(),
      });

      setSuccess("Booking created successfully! Awaiting guide confirmation.");
      setTimeout(() => navigate("/bookings"), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-safari-sand">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold font-display text-uganda-black mb-8">
            Create a New Booking
          </h1>

          {/* Feedback */}
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

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Region Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Region
                </label>
                <select
                  name="region"
                  value={region}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
                >
                  <option value="">All Regions</option>
                  <option value="Central">Central Uganda</option>
                  <option value="Northern">Northern Uganda</option>
                  <option value="Western">Western Uganda</option>
                  <option value="Eastern">Eastern Uganda</option>
                </select>
              </div>

              {/* Destination Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination *
                </label>
                <select
                  id="destination_id"
                  name="destination_id"
                  required
                  value={formData.destination_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
                >
                  <option value="">Select a destination</option>
                  {filteredDestinations.map((dest) => (
                    <option key={dest.id} value={dest.id}>
                      {dest.name} — {dest.region || "Unknown Region"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={formData.start_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    required
                    min={formData.start_date || new Date().toISOString().split("T")[0]}
                    value={formData.end_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
                  />
                </div>
              </div>

              {/* Number of People */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of People *
                </label>
                <input
                  type="number"
                  id="num_people"
                  name="num_people"
                  min="1"
                  max="20"
                  required
                  value={formData.num_people}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  placeholder="Any special requirements or preferences..."
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-uganda-yellow text-uganda-black px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors font-display disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-uganda-black inline mr-2"
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
                    Submitting...
                  </>
                ) : (
                  "Create Booking"
                )}
              </button>
            </form>
          </div>

          {/* Back Link */}
          <div className="text-center mt-6">
            <Link
              to="/bookings"
              className="text-uganda-yellow hover:underline font-african"
            >
              ← Back to My Bookings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
