import React from "react";
import { Link } from "react-router-dom";
import type { ModerationLog } from "../../services/moderation.types";

interface Props {
  item: ModerationLog;
}

export default function ModerationItem({ item }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 transition hover:shadow-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-uganda-black">
          {item.content?.name || `#${item.content_id}`}
        </h3>
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full ${
            item.status === "pending"
              ? "bg-yellow-100 text-yellow-800"
              : item.status === "approved"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {item.status}
        </span>
      </div>

      <p className="text-gray-600 mb-4 line-clamp-2">{item.content?.description}</p>

      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>
          <strong>Type:</strong> {item.content_type}
        </span>
        <span>
          <strong>Submitted:</strong> {new Date(item.submitted_at).toLocaleDateString()}
        </span>
      </div>

      <div className="mt-4 text-right">
        <Link
          to={`/moderation.review.${item.id}`}
          className="inline-block bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-display"
        >
          Review
        </Link>
      </div>
    </div>
  );
}
