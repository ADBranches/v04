import type { Booking } from "../../types/booking";

interface Props {
  data: Booking;
}

export default function BookingSummary({ data }: Props) {
  return (
    <div className="space-y-4 text-gray-700 dark:text-gray-300">
      <h3 className="text-xl font-semibold text-green-700 dark:text-green-400">
        Review Your Booking
      </h3>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2 border border-gray-200 dark:border-gray-700">
        <p>
          <strong>Name:</strong> {data.fullName}
        </p>
        <p>
          <strong>Email:</strong> {data.email}
        </p>
        {data.phone && (
          <p>
            <strong>Phone:</strong> {data.phone}
          </p>
        )}
        <p>
          <strong>Travelers:</strong> {data.travelers}
        </p>
        <p>
          <strong>Tour:</strong> {data.tourName || "Custom Trip"}
        </p>
        <p>
          <strong>Dates:</strong> {data.startDate} → {data.endDate}
        </p>
        <p>
          <strong>Accommodation:</strong> {data.accommodation}
        </p>
        <p>
          <strong>Transport:</strong> {data.transport}
        </p>
        {data.requests && (
          <p>
            <strong>Requests:</strong> {data.requests}
          </p>
        )}
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        By confirming, you agree to Jumuiya Tours’ terms and consent to be
        contacted for trip planning.
      </p>
    </div>
  );
}
