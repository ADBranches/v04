import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service";
import { moderationService } from "../services/moderation.service";
import type { ModerationLog } from "../services/moderation.types";
import ReviewPanel from "../components/moderation/review-panel";

export default function ModerationReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [moderation, setModeration] = useState<ModerationLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processing, setProcessing] = useState<"approve" | "reject" | "revision" | null>(null);

  /* ─────────── AUTH & FETCH ─────────── */
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!authService.isAuthenticated() || !["admin", "auditor"].includes(user?.role || "")) {
      navigate("/auth/login");
      return;
    }
    if (id) loadModeration();
  }, [id]);

  const loadModeration = async () => {
    setLoading(true);
    try {
      const res = await moderationService.getModerationRequest(Number(id));
      setModeration(res.moderationLog);
    } catch (err: any) {
      setError(err.message || "Failed to load moderation details.");
    } finally {
      setLoading(false);
    }
  };

  /* ─────────── ACTION HANDLER ─────────── */
  const handleAction = async (action: "approve" | "reject" | "request-revision", note?: string) => {
    if (!moderation) return;
    setProcessing(action);
    setError("");
    setSuccess("");

    try {
      if (action === "approve") {
        await moderationService.approveContent(moderation.id, note);
        setSuccess("✅ Content approved successfully");
      } else if (action === "reject") {
        await moderationService.rejectContent(moderation.id, note || "No reason provided");
        setSuccess("❌ Content rejected successfully");
      } else {
        await moderationService.requestRevision(moderation.id, note);
        setSuccess("✏️ Revision requested successfully");
      }

      setTimeout(() => navigate("/moderation/pending"), 1500);
    } catch (err: any) {
      setError(err.message || "Action failed");
    } finally {
      setProcessing(null);
    }
  };

  /* ─────────── LOADING STATES ─────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-safari-sand flex flex-col items-center justify-center font-african">
        <svg
          className="animate-spin h-12 w-12 text-uganda-yellow mb-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          ></path>
        </svg>
        <p className="text-gray-600">Loading moderation request...</p>
      </div>
    );
  }

  if (!moderation) {
    return (
      <div className="min-h-screen bg-safari-sand flex flex-col items-center justify-center font-african">
        <h1 className="text-2xl font-bold text-uganda-black mb-4">Moderation request not found</h1>
        <button
          onClick={() => navigate("/moderation/pending")}
          className="text-uganda-yellow hover:underline font-african"
        >
          ← Back to Pending Content
        </button>
      </div>
    );
  }

  /* ─────────── MAIN CONTENT ─────────── */
  return (
    <div className="min-h-screen bg-safari-sand">
      <div className="max-w-5xl mx-auto px-4 py-8 font-african">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold font-display text-uganda-black">
            Review: {moderation.content_type.toUpperCase()} #{moderation.content_id}
          </h1>
          <p className="text-gray-600 mt-1">
            Submitted by {moderation.submitter?.name || "Unknown"} ({moderation.submitter?.email})
          </p>
        </header>

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

        {/* Review Panel */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <ReviewPanel moderation={moderation} onAction={handleAction} />
        </div>

        {/* Loading Overlay when approving/rejecting */}
        {processing && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center">
              <svg
                className="animate-spin h-8 w-8 text-uganda-yellow mx-auto mb-3"
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
              <p className="text-gray-700">
                {processing === "approve"
                  ? "Approving content..."
                  : processing === "reject"
                  ? "Rejecting content..."
                  : "Requesting revision..."}
              </p>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={() => navigate("/moderation/pending")}
            className="text-uganda-yellow hover:underline font-african"
          >
            ← Back to Pending Content
          </button>
        </div>
      </div>
    </div>
  );
}
