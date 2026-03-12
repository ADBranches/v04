// app/routes/admin.activity.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import adminService from "../services/admin-service";
import { ROUTES } from "../config/routes-config";

export default function AdminActivityPage() {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadActivity = async () => {
      try {
        const res = await adminService.getActivity();
        setActivity(res.logs || []);
      } catch (err: any) {
        setError(err.message || "Failed to load activity logs");
      } finally {
        setLoading(false);
      }
    };

    loadActivity();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <h1 className="text-3xl font-bold font-display text-uganda-black mb-2">
          Activity Center
        </h1>
        <p className="text-gray-600">
          Review platform moderation and admin activity.
        </p>
      </div>

      {/* Quick Access */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Access
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to={ROUTES.admin.analytics}
            className="p-4 rounded-xl border border-gray-200 hover:border-uganda-yellow hover:bg-yellow-50 transition-colors"
          >
            <div className="text-lg mb-2">📈</div>
            <div className="font-medium text-gray-900">Analytics</div>
            <div className="text-sm text-gray-600">Open platform analytics</div>
          </Link>

          <Link
            to={ROUTES.admin.users}
            className="p-4 rounded-xl border border-gray-200 hover:border-uganda-yellow hover:bg-yellow-50 transition-colors"
          >
            <div className="text-lg mb-2">👥</div>
            <div className="font-medium text-gray-900">Users</div>
            <div className="text-sm text-gray-600">Manage user accounts</div>
          </Link>

          <Link
            to={ROUTES.moderation.queue}
            className="p-4 rounded-xl border border-gray-200 hover:border-uganda-yellow hover:bg-yellow-50 transition-colors"
          >
            <div className="text-lg mb-2">📝</div>
            <div className="font-medium text-gray-900">Moderation Queue</div>
            <div className="text-sm text-gray-600">Inspect review workflows</div>
          </Link>
        </div>
      </div>

      {/* ACTIVITY LIST */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>

        {loading && <p className="text-gray-500">Loading activity...</p>}

        {error && (
          <div className="text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {!loading && activity.length === 0 && !error && (
          <p className="text-gray-500">No recent admin or moderation activity.</p>
        )}

        <ul className="space-y-3">
          {activity.map((log: any) => (
            <li
              key={log.id}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              <div className="font-medium text-gray-900">
                {log.action || log.status}
              </div>
              <div className="text-sm text-gray-500">
                {log.submitter?.name || "Unknown"} → {log.moderator?.name}
              </div>
              <div className="text-xs text-gray-400">
                {new Date(log.created_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}