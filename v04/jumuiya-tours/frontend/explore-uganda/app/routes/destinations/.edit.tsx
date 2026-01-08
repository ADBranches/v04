import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { authService } from "../../services/auth.service";
import { destinationService } from "../../services/destination-service";
import type { Destination, UpdateDestinationRequest } from "../../services/destination.types";

type DestinationFormData = Partial<UpdateDestinationRequest> & {
  short_description?: string;
  district?: string;
  price_range?: string;
  difficulty_level?: string;
  best_season?: string;
  highlights?: string[];
  included?: string[];
  not_included?: string[];
  requirements?: string;
};


const regionsAndDistricts = {
  Central: ["Kampala", "Wakiso", "Mukono", "Masaka", "Mpigi", "Luwero"],
  Northern: ["Gulu", "Lira", "Arua", "Kitgum", "Nebbi", "Adjumani"],
  Western: ["Kasese", "Fort Portal", "Mbarara", "Kabale", "Hoima", "Bushenyi"],
  Eastern: ["Jinja", "Mbale", "Tororo", "Iganga", "Soroti", "Busia"],
};

export default function EditDestination() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [formData, setFormData] = useState<DestinationFormData>({});
  const [districts, setDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const user = authService.getCurrentUser();

  /** Authorization check and data load **/
  useEffect(() => {
    if (!authService.isAuthenticated() || !["admin", "auditor", "guide"].includes(user?.role || "")) {
      navigate("/auth/login");
      return;
    }

    if (id) loadDestination(parseInt(id));
  }, [id]);

  /** Load region districts **/
  useEffect(() => {
    if (formData.region) {
      setDistricts(regionsAndDistricts[formData.region as keyof typeof regionsAndDistricts] || []);
    } else {
      setDistricts([]);
    }
  }, [formData.region]);

  /** Fetch the destination **/
  const loadDestination = async (destinationId: number) => {
    setLoading(true);
    try {
      const res = await destinationService.getDestination(destinationId);
      const dest = res.destination;

      // Permission: admin/auditor or owner guide only
      const isAdminOrAuditor = user && ["admin", "auditor"].includes(user.role);
      const isOwner = user && user.role === "guide" && dest.created_by === user.id;

      if (!isAdminOrAuditor && !isOwner) {
        setError("You do not have permission to edit this destination");
        navigate("/destinations");
        return;
      }

      setDestination(dest);
      setFormData({
        name: dest.name,
        description: dest.description,
        location: dest.location,
        region: dest.region,
        district: dest.district || "",
        price_range: dest.price_range,
        duration: dest.duration,
        difficulty_level: dest.difficulty_level,
        best_season: dest.best_season,
        highlights: dest.highlights || [],
        included: dest.included || [],
        not_included: dest.not_included || [],
        requirements: dest.requirements || "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to load destination");
      navigate("/destinations");
    } finally {
      setLoading(false);
    }
  };

  /** Form handlers **/
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleArrayFieldChange = (field: "highlights" | "included" | "not_included", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value.split("\n").filter((item) => item.trim()),
    }));
  };

  /** Validation **/
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

  /** Submit update **/
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !id) return;

    setSaving(true);
    try {
      await destinationService.updateDestination(parseInt(id), formData);
      setSuccess("Destination updated successfully");
      setTimeout(() => navigate(`/destinations/${id}`), 1500);
    } catch (err: any) {
      setError(err.message || "Failed to update destination");
    } finally {
      setSaving(false);
    }
  };

  /** UI Rendering **/
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-safari-sand">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-uganda-yellow mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.3 0 0 5.3 0 12h4z" />
          </svg>
          <p className="mt-3 text-gray-600">Loading destination...</p>
        </div>
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="min-h-screen bg-safari-sand">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-uganda-black mb-3">Destination not found</h1>
          <Link to="/destinations" className="text-uganda-yellow hover:underline">
            ← Back to Destinations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-safari-sand">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-uganda-black mb-6">Edit Destination</h1>

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

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description || ""}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>

              {/* Region + Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Region *</label>
                  <select
                    name="region"
                    value={formData.region || ""}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location || ""}
                    onChange={handleChange}
                    required
                    className="input-field"
                  />
                </div>
              </div>

              {/* District */}
              {districts.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                  <select
                    name="district"
                    value={formData.district || ""}
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

              {/* Price / Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price per Person (USD)</label>
                  <input
                    type="number"
                    name="price_per_person"
                    value={formData.price_per_person || ""}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (days)</label>
                  <input
                    type="number"
                    name="duration_days"
                    value={formData.duration_days || ""}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Highlights */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Highlights</label>
                <textarea
                  name="highlights"
                  rows={3}
                  value={(formData.highlights || []).join("\n")}
                  onChange={(e) => handleArrayFieldChange("highlights", e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Included / Not Included */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Included</label>
                  <textarea
                    name="included"
                    rows={3}
                    value={(formData.included || []).join("\n")}
                    onChange={(e) => handleArrayFieldChange("included", e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Not Included</label>
                  <textarea
                    name="not_included"
                    rows={3}
                    value={(formData.not_included || []).join("\n")}
                    onChange={(e) => handleArrayFieldChange("not_included", e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
                <textarea
                  name="requirements"
                  rows={2}
                  value={formData.requirements || ""}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              {/* Save */}
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-uganda-yellow text-uganda-black px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors font-display disabled:opacity-50"
              >
                {saving ? "Updating..." : "Update Destination"}
              </button>
            </form>
          </div>

          <div className="text-center mt-6">
            <Link to={`/destinations/${id}`} className="text-uganda-yellow hover:underline font-african">
              ← Back to Destination
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
