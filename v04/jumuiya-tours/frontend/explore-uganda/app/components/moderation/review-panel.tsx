import React, { useState } from "react";
import type { ModerationLog } from "../../services/moderation.types";

interface Props {
  moderation: ModerationLog;
  onAction: (action: "approve" | "reject" | "request-revision", note?: string) => void;
}

export default function ReviewPanel({ moderation, onAction }: Props) {
  const [note, setNote] = useState("");

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-uganda-black mb-2">Content Preview</h2>
        {moderation.content_type === "destination" ? (
          <>
            <p className="text-gray-800 font-medium mb-1">{moderation.content?.name}</p>
            <p className="text-gray-600 mb-4">{moderation.content?.description}</p>
            <p className="text-sm text-gray-500">
              <strong>Location:</strong> {moderation.content?.region || "N/A"}
            </p>
          </>
        ) : (
          <p className="text-gray-700">User: {moderation.content?.name}</p>
        )}
      </section>

      <section className="mb-6">
        <label htmlFor="notes" className="block text-sm font-medium text-uganda-black mb-1">
          Reviewer Notes
        </label>
        <textarea
          id="notes"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add optional comments for this review..."
          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-uganda-yellow focus:border-uganda-yellow text-gray-800"
          rows={4}
        ></textarea>
      </section>

      <section className="flex justify-end space-x-4">
        <button
          onClick={() => onAction("approve", note)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-display"
        >
          Approve
        </button>
        <button
          onClick={() => onAction("reject", note)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-display"
        >
          Reject
        </button>
        <button
          onClick={() => onAction("request-revision", note)}
          className="bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-display"
        >
          Request Revision
        </button>
      </section>
    </div>
  );
}
