import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service";
import { guideService } from "../services/guide.service";
import { VerificationCredentials } from "../services/guide.service";

export default function GuideVerification() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    experience: "",
    certifications: [""],
    documents: [] as File[],
  });
  const [guideId, setGuideId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const user = authService.getCurrentUser();

  useEffect(() => {
    if (!user || user.role !== "guide") {
      navigate("/auth/login");
      return;
    }

    const loadProfile = async () => {
      try {
        const data = await guideService.getMyProfile();
        setGuideId(data.guide.id || data.id);
      } catch (err) {
        console.error("Error loading guide:", err);
        setError("Unable to load your profile details.");
      } finally {
        setInitializing(false);
      }
    };
    loadProfile();
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleCertificationChange = (index: number, value: string) => {
    const newCerts = [...formData.certifications];
    newCerts[index] = value;
    setFormData((prev) => ({ ...prev, certifications: newCerts }));
  };

  const addCertificationField = () => {
    setFormData((prev) => ({
      ...prev,
      certifications: [...prev.certifications, ""],
    }));
  };

  const removeCertificationField = (index: number) => {
    if (formData.certifications.length > 1) {
      const filtered = formData.certifications.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, certifications: filtered }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData((prev) => ({
        ...prev,
        documents: Array.from(e.target.files),
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.experience || parseInt(formData.experience) < 1) {
      setError("Please enter valid years of experience.");
      return false;
    }

    if (formData.certifications.every((c) => !c.trim())) {
      setError("Please add at least one certification.");
      return false;
    }

    if (formData.documents.length === 0) {
      setError("Please upload at least one supporting document.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const credentials: VerificationCredentials = {
        experience: formData.experience,
        certifications: formData.certifications.filter((c) => c.trim()),
      };

      await guideService.submitVerification(credentials, formData.documents);
      setSuccess("Verification request submitted successfully.");
      setTimeout(() => navigate("/guides/profile"), 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to submit verification request.");
    } finally {
      setLoading(false);
    }
  };

  if (initializing)
    return <p className="text-center py-20 text-gray-600">Loading profile...</p>;
  if (!guideId) return null;

  return (
    <div className="min-h-screen bg-safari-sand">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold font-display text-uganda-black mb-8">
            Guide Verification Application
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

          {/* Verification Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience *
                </label>
                <input
                  type="number"
                  id="experience"
                  name="experience"
                  min="1"
                  max="50"
                  required
                  value={formData.experience}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
                />
              </div>

              {/* Certifications */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certifications *
                </label>
                <div className="space-y-2">
                  {formData.certifications.map((cert, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={cert}
                        onChange={(e) =>
                          handleCertificationChange(i, e.target.value)
                        }
                        placeholder="e.g., Tour Guide License, First Aid Certificate"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
                      />
                      {formData.certifications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCertificationField(i)}
                          className="px-3 py-2 text-red-600 hover:text-red-800 transition-colors"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addCertificationField}
                  className="mt-2 text-uganda-yellow hover:text-yellow-400 text-sm font-african transition-colors"
                >
                  + Add Another Certification
                </button>
              </div>

              {/* Documents */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supporting Documents *
                </label>
                <input
                  type="file"
                  id="documents"
                  name="documents"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload relevant documents (licenses, certificates, ID copies).
                  Max 5 files.
                </p>
                {formData.documents.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected files:{" "}
                    {formData.documents.map((doc) => doc.name).join(", ")}
                  </p>
                )}
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
                  "Submit Verification Request"
                )}
              </button>
            </form>
          </div>

          {/* Back Link */}
          <div className="text-center mt-6">
            <Link
              to="/guides/profile"
              className="text-uganda-yellow hover:underline font-african transition-colors"
            >
              ← Back to Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
