import { useState } from "react";
import authService from "../services/auth.service";
import { destinationService } from "../services/destination-service";
import { bookingService } from "../services/booking.service";
import { moderationService } from "../services/moderation.service";
import adminService from "../services/admin-service";

type JsonValue = unknown;

export default function ApiDebug() {
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [result, setResult] = useState<JsonValue>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (label: string, fn: () => Promise<unknown>) => {
    setLoading(true);
    setLastAction(label);
    setError(null);
    setResult(null);

    try {
      const data = await fn();
      setResult(data);
    } catch (err: any) {
      console.error(`[API DEBUG] ${label} error:`, err);
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-2">API Debug Playground</h1>
      <p className="text-sm text-gray-600">
        Use these buttons to call your service layer directly and inspect responses.
      </p>

      {/* AUTH */}
      <section className="space-y-2">
        <h2 className="font-semibold text-lg">Auth</h2>
        <div className="flex flex-wrap gap-2">
          {/* adjust method names to your actual authService API, e.g. .login, .me, .getCurrentUser */}
          <button
            className="px-3 py-1 border rounded text-sm"
            disabled={loading}
            onClick={() =>
              run("auth.me", () =>
                // ⬇️ use whatever your "who am I" method is:
                authService.me?.() ?? authService.getCurrentUser?.()
              )
            }
          >
            /api/auth/me
          </button>
        </div>
      </section>

      {/* DESTINATIONS */}
      <section className="space-y-2">
        <h2 className="font-semibold text-lg">Destinations</h2>
        <div className="flex flex-wrap gap-2">
          <button
            className="px-3 py-1 border rounded text-sm"
            disabled={loading}
            onClick={() =>
              run("destinations.list", () =>
                destinationService.getDestinations?.({ limit: 5 }) ??
                destinationService.getFilteredDestinations?.({ limit: 5 })
              )
            }
          >
            List destinations (limit 5)
          </button>
        </div>
      </section>

      {/* BOOKINGS */}
      <section className="space-y-2">
        <h2 className="font-semibold text-lg">Bookings</h2>
        <div className="flex flex-wrap gap-2">
          <button
            className="px-3 py-1 border rounded text-sm"
            disabled={loading}
            onClick={() =>
              run("bookings.mine", () =>
                // adapt to your actual method, e.g. bookingService.getMyBookings()
                bookingService.getMyBookings?.()
              )
            }
          >
            My bookings
          </button>
        </div>
      </section>

      {/* MODERATION */}
      <section className="space-y-2">
        <h2 className="font-semibold text-lg">Moderation</h2>
        <div className="flex flex-wrap gap-2">
          <button
            className="px-3 py-1 border rounded text-sm"
            disabled={loading}
            onClick={() =>
              run("moderation.queue", () =>
                moderationService.getQueue?.()
              )
            }
          >
            Moderation queue
          </button>
        </div>
      </section>

      {/* ADMIN / USERS */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Admin / Users</h2>
        <div className="flex flex-wrap gap-2">
          <button
            className="px-3 py-1 border rounded text-sm"
            disabled={loading}
            onClick={() =>
              run("admin.users.list", () =>
                adminService.getUsers?.()
              )
            }
          >
            List users
          </button>
        </div>
      </section>

      {/* OUTPUT */}
      <section className="space-y-2">
        <h2 className="font-semibold text-lg">Result</h2>
        <p className="text-sm">
          Last action: <span className="font-mono">{lastAction ?? "—"}</span>
        </p>
        {loading && <p className="text-sm text-blue-600">Loading…</p>}
        {error && (
          <p className="text-sm text-red-600">
            Error: {error}
          </p>
        )}
        <pre className="bg-gray-100 text-xs p-3 rounded max-h-96 overflow-auto">
          {result ? JSON.stringify(result, null, 2) : "No data yet"}
        </pre>
      </section>
    </div>
  );
}