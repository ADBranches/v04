import React from "react";
import { Outlet } from "react-router";
import AuditorSidebar from "../components/auditor-sidebar";

/**
 * 🧭 AuditorLayout
 * Base layout for all Auditor routes.
 * Provides a two-column responsive interface:
 * - Left: Persistent sidebar navigation
 * - Right: Main content area (scrollable with dynamic outlet)
 *
 * Used for pages like:
 *  - /auditor/dashboard
 *  - /auditor/content-queue
 *  - /auditor/guide-approvals
 */

export default function AuditorLayout() {
  return (
    <div className="bg-safari-sand min-h-screen font-african text-uganda-black flex">
      {/* ── Sidebar Navigation ─────────────────────── */}
      <AuditorSidebar />

      {/* ── Main Content Area ──────────────────────── */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
