import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service";
import { destinationService } from "../services/destination-service";
import type { CreateDestinationRequest } from "../services/destination.types";

interface DestinationFormData extends CreateDestinationRequest {
  short_description?: string;
  district?: string;
  price_range?: string;
  difficulty_level?: string;
  best_season?: string;
  highlights?: string[];
  included?: string[];
  not_included?: string[];
  requirements?: string;
}

const regionsAndDistricts = {
  Central: ["Kampala", "Wakiso", "Mukono", "Masaka", "Mpigi", "Luwero"],
  Northern: ["Gulu", "Lira", "Arua", "Kitgum", "Nebbi", "Adjumani"],
  Western: ["Kasese", "Fort Portal", "Mbarara", "Kabale", "Hoima", "Bushenyi"],
  Eastern: ["Jinja", "Mbale", "Tororo", "Iganga", "Soroti", "Busia"],
};

export default function CreateDestination() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  // Redirect unauthorized users
  useEffect(() => {
    if (!authService.isAuthenticated() || !["admin", "auditor", "guide"].includes(user?.role || "")) {
      navigate("/auth/login");
    }
  }, [user, navigate]);

  const [formData, setFormData] = useState<DestinationFormData>({
    name: "",
    description: "",
    location: "",
    region: "",
    price_per_person: 0,
    duration_days: 1,
    max_group_size: 10,
    images: [],
    featured: false,
  });
  const [districts, setDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Update districts based on region
  useEffect(() => {
    if (formData.region) {
      setDistricts(regionsAndDistricts[formData.region as keyof typeof regionsAndDistricts] || []);
    } else {
      setDistricts([]);
    }
  }, [formData.region]);

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleArrayFieldChange = (
    field: "highlights" | "included" | "not_included",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value.split("\n").filter((item) => item.trim()),
    }));
  };

  // Validate required fields
  const validateForm = (): boolean => {
    const required = ["name", "description", "location", "region"];
    for (const field of required) {
      // @ts-ignore
      if (!formData[field]) {
        setError(`${field.replace("_", " ")} is required`);
        return false;
      }
    }
    return true;
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      const response = await destinationService.createDestination(formData);
      const currentUser = authService.getCurrentUser();

      // Guide flow: optional moderation submission
      if (currentUser?.role === "guide") {
        const confirmSubmit = confirm(
          "Do you want to submit this destination for review?"
        );
        if (confirmSubmit) {
          try {
            await destinationService.submitDestination(response.destination.id);
            setSuccess("Destination created and submitted for moderation.");
          } catch {
            setSuccess("Destination created successfully (moderation failed).");
          }
        } else {
          setSuccess("Destination created successfully. You can submit later.");
        }
      } else {
        setSuccess("Destination created successfully.");
      }

      setTimeout(() => {
        navigate(
          currentUser?.role === "guide" ? "/dashboard/guide" : "/destinations"
        );
      }, 1800);
    } catch (err: any) {
      setError(err.message || "Failed to create destination");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-safari-sand">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-uganda-black mb-6">
            Create Destination
          </h1>

          {/* Messages */}
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
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>

              {/* Location / Region */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region *
                  </label>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    required
                    className="input-field"
                  >
                    <option value="">Select region</option>
                    {Object.keys(regionsAndDistricts).map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* District */}
              {districts.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    District
                  </label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Select district</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Price / Duration / Group */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price per Person (USD)
                  </label>
                  <input
                    type="number"
                    name="price_per_person"
                    value={formData.price_per_person}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    name="duration_days"
                    value={formData.duration_days}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Group Size
                  </label>
                  <input
                    type="number"
                    name="max_group_size"
                    value={formData.max_group_size}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Highlights / Included / Not Included */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Highlights
                  </label>
                  <textarea
                    name="highlights"
                    rows={3}
                    placeholder="One per line"
                    onChange={(e) => handleArrayFieldChange("highlights", e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Included
                  </label>
                  <textarea
                    name="included"
                    rows={3}
                    placeholder="One per line"
                    onChange={(e) => handleArrayFieldChange("included", e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Not Included
                  </label>
                  <textarea
                    name="not_included"
                    rows={3}
                    placeholder="One per line"
                    onChange={(e) => handleArrayFieldChange("not_included", e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requirements
                </label>
                <textarea
                  name="requirements"
                  rows={2}
                  placeholder="Any special requirements..."
                  value={formData.requirements}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-uganda-yellow text-uganda-black px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors font-display disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Destination"}
              </button>
            </form>
          </div>

          <div className="text-center mt-6">
            <Link
              to="/destinations"
              className="text-uganda-yellow hover:underline font-african"
            >
              ← Back to Destinations
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
