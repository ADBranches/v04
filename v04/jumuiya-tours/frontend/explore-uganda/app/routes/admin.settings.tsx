// app/routes/admin.settings.tsx
import React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../config/routes-config";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <h1 className="text-3xl font-bold font-display text-uganda-black mb-2">
          Admin Settings
        </h1>
        <p className="text-gray-600">
          Administrative configuration and access shortcuts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Role Configuration
          </h2>
          <p className="text-gray-600 mb-4">
            Manage platform roles and related permissions.
          </p>
          <Link
            to="/admin/roles"
            className="inline-flex items-center bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors font-medium"
          >
            Open Roles
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Profile Settings
          </h2>
          <p className="text-gray-600 mb-4">
            Open the currently signed-in profile settings page.
          </p>
          <Link
            to="/profile"
            className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Go to Profile
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <p className="text-gray-600 leading-relaxed">
          This page ensures the route{" "}
          <code className="bg-gray-100 px-2 py-1 rounded">/admin/settings</code>{" "}
          exists and no longer points to a missing frontend route.
        </p>
      </div>
    </div>
  );
}