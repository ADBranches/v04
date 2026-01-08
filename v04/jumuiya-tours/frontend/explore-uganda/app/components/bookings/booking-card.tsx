import { Link } from 'react-router-dom';
import type { Booking } from '../../services/booking.types';
import { bookingService } from '../../services/booking.service';
import { format } from 'date-fns';
import { CalendarIcon, UsersIcon, CurrencyDollarIcon } from '@heroicons/react/24/solid';

interface Props {
  booking: Booking;
  showActions?: boolean;
}

const statusColors: Record<Booking['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function BookingCard({ booking, showActions = true }: Props) {
  const primaryImage = '/placeholder.jpg'; // fallback if no image array
  const start = format(new Date(booking.start_date), 'MMM d, yyyy');
  const end = format(new Date(booking.end_date), 'MMM d, yyyy');

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="md:flex">
        <div className="md:w-48 h-48 md:h-auto relative">
          <img
            src={primaryImage}
            alt={booking.destination?.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-5 flex-1">
          <div className="flex justify-between items-start">
            <div>
              <Link
                to={`/destinations/${booking.destination_id}`}
                className="text-xl font-bold text-uganda-black hover:text-uganda-red"
              >
                {booking.destination?.name}
              </Link>
              <p className="text-sm text-gray-600">
                {booking.destination?.district || booking.destination?.region}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}
            >
              {booking.status.replace('-', ' ')}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center text-gray-700">
              <CalendarIcon className="w-5 h-5 mr-2 text-uganda-yellow" />
              <span>
                {start} → {end}
              </span>
            </div>
            <div className="flex items-center text-gray-700">
              <UsersIcon className="w-5 h-5 mr-2 text-uganda-yellow" />
              <span>{booking.num_people} people</span>
            </div>
            <div className="flex items-center text-gray-700">
              <CurrencyDollarIcon className="w-5 h-5 mr-2 text-uganda-yellow" />
              <span className="font-bold text-uganda-red">
                ${booking.total_price ?? '—'}
              </span>
            </div>
          </div>

          {booking.guide && (
            <div className="mt-3 flex items-center text-sm">
              <img
                src={booking.guide.user.avatar || '/avatar-placeholder.jpg'}
                alt={booking.guide.user.name}
                className="w-8 h-8 rounded-full mr-2"
              />
              <span>Guide: {booking.guide.user.name}</span>
            </div>
          )}

          {showActions && (
            <div className="mt-5 flex space-x-2">
              <Link
                to={`/bookings/manage/${booking.id}`}
                className="btn-uganda text-sm px-3 py-1"
              >
                Manage
              </Link>
              {booking.status === 'pending' && (
                <button
                  onClick={async () => {
                    if (confirm('Cancel this booking?')) {
                      await bookingService.cancelBooking(booking.id);
                      window.location.reload();
                    }
                  }}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
