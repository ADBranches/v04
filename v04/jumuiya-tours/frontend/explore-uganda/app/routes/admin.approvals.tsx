// app/routes/admin.approvals.tsx
import { Link, Navigate } from "react-router-dom";
import authService from "../services/auth.service";
import { ROUTES } from "../config/routes-config";

export default function AdminApprovalsPage() {
  const user = authService.getCurrentUser();

  // Not logged in → go to login
  if (!user) {
    return <Navigate to={ROUTES.auth.login} replace />;
  }

  // Logged in but not admin → show 403 UX
  if (user.role !== "admin") {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-semibold">Access Denied</h2>
          <p className="text-red-600 mt-2">
            You don&apos;t have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <h1 className="text-3xl font-bold font-display text-uganda-black mb-2">
          Approvals Center
        </h1>
        <p className="text-gray-600">
          Central place for moderation and approval workflows.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Moderation Queue
          </h2>
          <p className="text-gray-600 mb-4">
            Open the moderation queue to inspect pending review items.
          </p>
          <Link
            to={ROUTES.moderation.queue}
            className="inline-flex items-center bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors font-medium"
          >
            Open Queue
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Pending Review Items
          </h2>
          <p className="text-gray-600 mb-4">
            Review items that are still waiting for an approval decision.
          </p>
          <Link
            to={ROUTES.moderation.pending}
            className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            View Pending Items
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes</h2>
        <p className="text-gray-600 leading-relaxed">
          This page ensures the route{" "}
          <code className="bg-gray-100 px-2 py-1 rounded">/admin/approvals</code>{" "}
          exists and aligns with your{" "}
          <code className="bg-gray-100 px-2 py-1 rounded ml-1">
            ROUTES.admin.approvals
          </code>{" "}
          constant.
        </p>
      </div>
    </div>
  );
}