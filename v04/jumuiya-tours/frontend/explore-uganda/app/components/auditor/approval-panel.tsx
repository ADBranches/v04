import React from "react";

interface Guide {
  id: number;
  name: string;
  email: string;
  documents: string[];
  guide_status: string;
}

interface Props {
  guides: Guide[];
  onVerify: (id: number) => void;
  onReject: (id: number) => void;
}

export default function ApprovalPanel({ guides, onVerify, onReject }: Props) {
  if (guides.length === 0)
    return (
      <div className="text-center text-gray-500 py-12">
        No pending guide applications.
      </div>
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {guides.map((g) => (
        <div
          key={g.id}
          className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition"
        >
          <h3 className="text-lg font-semibold text-uganda-black">{g.name}</h3>
          <p className="text-sm text-gray-600">{g.email}</p>
          <p className="text-xs text-gray-500 mb-3">
            Status: {g.guide_status}
          </p>

          <div className="space-y-2 mb-3">
            {g.documents?.map((doc, i) => (
              <a
                key={i}
                href={doc}
                target="_blank"
                rel="noopener noreferrer"
                className="text-uganda-yellow text-sm underline block"
              >
                Document {i + 1}
              </a>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onVerify(g.id)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Verify
            </button>
            <button
              onClick={() => onReject(g.id)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
