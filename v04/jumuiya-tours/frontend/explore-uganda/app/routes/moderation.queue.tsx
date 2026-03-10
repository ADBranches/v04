// app/routes/moderation.queue.tsx
import DashboardLayout from "../components/layout/dashboard-layout";
import ProtectedRoute from "../components/navigation/protected-route";
import ModerationQueue from "../components/auditor/moderation-queue";

export default function ModerationQueueRoute() {
  return (
    <ProtectedRoute allowedRoles={["auditor", "admin"]}>
      <DashboardLayout>
        <ModerationQueue />
      </DashboardLayout>
    </ProtectedRoute>
  );
}