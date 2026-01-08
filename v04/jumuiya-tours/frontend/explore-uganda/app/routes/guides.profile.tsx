import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service";
import { guideService, type Guide } from "../services/guide.service";
import type { GuideVerification } from "../services/guide.types";
import { format } from "date-fns";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";

export default function MyGuideProfile() {
  const navigate = useNavigate();
  const [guide, setGuide] = useState<Guide | null>(null);
  const [verification, setVerification] = useState<GuideVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = authService.getCurrentUser();

  useEffect(() => {
    if (!user || user.role !== "guide") {
      navigate("/auth/login");
      return;
    }

    const loadProfile = async () => {
      setLoading(true);
      try {
        const profileData = await guideService.getMyProfile();
        setGuide(profileData.guide);
        const verificationData = await guideService.getVerification(user.id);
        setVerification(verificationData.verification);
      } catch (err: any) {
        console.error(err);
        // Only show real errors, not "Verification not found"
        if (err.message !== "Verification not found") {
          setError(err.message || "Failed to load guide profile");
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, navigate]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "verified":
      case "approved":
        return "text-green-600";
      case "pending":
        return "text-yellow-600";
      case "rejected":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-safari-sand flex flex-col items-center justify-center">
        <svg
          className="animate-spin h-12 w-12 text-uganda-yellow mb-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.3 0 0 5.3 0 12h4z"
          />
        </svg>
        <p className="text-gray-600">Loading your profile...</p>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="min-h-screen bg-safari-sand text-center py-20">
        <p className="text-gray-700 mb-4">No guide profile found.</p>
        <Link to="/guides" className="text-uganda-yellow hover:underline">
          ← Back to Guides
        </Link>
      </div>
    );
  }

  const credentials = verification ? JSON.parse(verification.credentials as any) : null;

  return (
    <div className="min-h-screen bg-safari-sand">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-bold font-display text-uganda-black mb-8">My Guide Profile</h1>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Alerts */}
        {guide.verification_status === "pending" && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-6">
            Your verification request is under review.
          </div>
        )}
        {guide.verification_status === "rejected" && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
            Your verification was rejected. Please resubmit your documents.
          </div>
        )}

        {/* Profile */}
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          {/* Personal Info */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-uganda-black">Profile Details</h2>
            <button
              onClick={() => navigate("/guides/verification")}
              className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors text-sm font-african"
            >
              {guide.verification_status === "unverified" ? "Apply for Verification" : "Update Verification"}
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{user.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Hourly Rate</p>
              <p className="font-medium">${guide.hourly_rate}/hr</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className={`font-medium capitalize ${getStatusColor(guide.verification_status)}`}>
                {guide.verification_status}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Bio</p>
            <p className="text-gray-700 leading-relaxed">
              {guide.bio || "No bio added yet."}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Languages</p>
            <p>{guide.languages.length ? guide.languages.join(", ") : "None"}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Specialties</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {guide.specialties.length ? (
                guide.specialties.map((s) => (
                  <span
                    key={s}
                    className="bg-uganda-yellow bg-opacity-20 text-uganda-black text-sm px-3 py-1 rounded-full"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-gray-500">None</span>
              )}
            </div>
          </div>
        </div>

        {/* Verification Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mt-8">
          <h2 className="text-xl font-semibold text-uganda-black mb-4">Verification Details</h2>

          {verification ? (
            <div className="space-y-4 text-gray-700">
              <p>
                <strong>Status:</strong>{" "}
                <span className={getStatusColor(verification.status)}>
                  {verification.status}
                </span>
              </p>
              <p>
                <strong>Submitted:</strong>{" "}
                {new Date(verification.submitted_at).toLocaleDateString()}
              </p>

              {credentials && (
                <>
                  <p>
                    <strong>Experience:</strong> {credentials.experience} years
                  </p>
                  <p>
                    <strong>Certifications:</strong>{" "}
                    {Array.isArray(credentials.certifications)
                      ? credentials.certifications.join(", ")
                      : credentials.certifications}
                  </p>
                </>
              )}

              {verification.documents?.length > 0 && (
                <div>
                  <p><strong>Documents:</strong></p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {verification.documents.map((doc, index) => (
                      <li key={index}>
                        <a
                          href={doc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-uganda-yellow hover:text-yellow-400 transition-colors"
                        >
                          View Document {index + 1}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {verification.notes && (
                <div>
                  <p><strong>Review Notes:</strong></p>
                  <p className="text-gray-600 mt-1">{verification.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-600 mb-4">You haven’t submitted any verification yet.</p>
              <Link
                to="/guides/verification"
                className="bg-uganda-yellow text-uganda-black px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors font-african inline-block"
              >
                Submit Verification
              </Link>
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="text-center mt-8">
          <Link
            to="/dashboard/guide"
            className="text-uganda-yellow hover:underline font-african transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
