// app/components/auditor/moderation-queue.tsx
import React from "react";

interface ModerationQueueProps {
  destinations: any[];
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onRequestRevision: (id: number) => void;
}

/**
 * 📋 ModerationQueue Component
 * Displays pending content (destinations or guide verification requests)
 * for the Auditor to review and act upon.
 */
export default function ModerationQueue({
  destinations,
  onApprove,
  onReject,
  onRequestRevision,
}: ModerationQueueProps) {
  if (!destinations || destinations.length === 0)
    return (
      <div className="text-center text-gray-500 py-12">
        No pending content available for review.
      </div>
    );

  return (
    <div className="grid grid-cols-1 gap-6">
      {destinations.map((item) => (
        <div
          key={item.id}
          className="bg-white p-6 rounded-xl shadow-md border border-gray-100 transition hover:shadow-lg"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-lg font-bold text-uganda-black">
                {item.name || "Untitled Destination"}
              </h3>
              {item.description && (
                <p className="text-gray-600 mt-1">{item.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Submitted by: {item.submitted_by?.name || "Unknown User"}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                item.content_type === "destination"
                  ? "bg-uganda-yellow/20 text-uganda-yellow"
                  : "bg-safari-forest/10 text-safari-forest"
              }`}
            >
              {item.content_type.replace("_", " ")}
            </span>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={() => onApprove(item.id)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              ✅ Approve
            </button>
            <button
              onClick={() => onReject(item.id)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              ❌ Reject
            </button>
            <button
              onClick={() => onRequestRevision(item.id)}
              className="bg-yellow-400 hover:bg-yellow-500 text-uganda-black px-4 py-2 rounded-lg text-sm"
            >
              📝 Request Revision
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
