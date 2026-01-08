// app/components/bookings/booking-form.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { destinationService } from '../../services/destination-service';
import { guideService } from '../../services/guide.service';
import type { CreateBookingRequest } from '../../services/booking.types';
import { bookingService } from '../../services/booking.service';
import { authService } from '../../services/auth.service';
import { format, differenceInDays } from 'date-fns';

interface DestinationOption {
  id: number;
  name: string;
  price_per_person: number;
  duration_days: number;
}

interface GuideOption {
  id: number;
  name: string;
  hourly_rate: number;
}

export default function BookingForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = authService.getCurrentUser();
  const [loading, setLoading] = useState(false);

  const [destinations, setDestinations] = useState<DestinationOption[]>([]);
  const [guides, setGuides] = useState<GuideOption[]>([]);
  const [selectedDest, setSelectedDest] = useState<DestinationOption | null>(null);

  const [form, setForm] = useState<CreateBookingRequest>({
    destination_id: Number(searchParams.get('destination')) || 0,
    guide_id: Number(searchParams.get('guide')) || undefined,
    start_date: '',
    end_date: '',
    num_people: 1,
    notes: '',
  });

  useEffect(() => {
    const load = async () => {
      const [destData, guideData] = await Promise.all([
        destinationService.list(),
        guideService.list({ verified: true }),
      ]);
      setDestinations(
        destData.map((d) => ({
          id: d.id,
          name: d.name,
          price_per_person: d.price_per_person,
          duration_days: d.duration_days,
        }))
      );
      setGuides(
        guideData.map((g) => ({
          id: g.id,
          name: g.user?.name || 'Unknown',
          hourly_rate: g.hourly_rate,
        }))
      );

      if (form.destination_id) {
        const dest = destData.find((d) => d.id === form.destination_id);
        setSelectedDest(dest || null);
      }
    };
    load();
  }, [form.destination_id]);

  useEffect(() => {
    const dest = destinations.find((d) => d.id === form.destination_id);
    setSelectedDest(dest || null);
  }, [form.destination_id, destinations]);

  const calculateTotal = () => {
    if (!selectedDest || !form.start_date || !form.end_date) return 0;
    const days = differenceInDays(new Date(form.end_date), new Date(form.start_date)) + 1;
    const destCost = selectedDest.price_per_person * form.num_people * days;
    const guideCost =
      form.guide_id && form.start_date && form.end_date
        ? guides.find((g) => g.id === form.guide_id)?.hourly_rate || 0 * days * 8
        : 0;
    return destCost + guideCost;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('Please log in');
    if (!form.start_date || !form.end_date) return alert('Select dates');
    if (new Date(form.start_date) >= new Date(form.end_date))
      return alert('End date must be after start date');

    setLoading(true);
    try {
      const payload: CreateBookingRequest = {
        ...form,
        guide_id: form.guide_id || undefined,
      };
      const booking = await bookingService.create(payload, user);
      navigate(`/bookings/manage/${booking.id}`);
    } catch (err: any) {
      alert(err.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-lg max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-uganda-black">Create Booking</h2>

      <div>
        <label className="block font-medium mb-2">Destination</label>
        <select
          required
          value={form.destination_id}
          onChange={(e) => setForm((f) => ({ ...f, destination_id: Number(e.target.value) }))}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
        >
          <option value="">Select destination</option>
          {destinations.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} (${d.price_per_person}/person/day)
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-medium mb-2">Guide (Optional)</label>
        <select
          value={form.guide_id || ''}
          onChange={(e) =>
            setForm((f) => ({ ...f, guide_id: e.target.value ? Number(e.target.value) : undefined }))
          }
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
        >
          <option value="">No guide</option>
          {guides.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} (${g.hourly_rate}/hr)
            </option>
          ))}
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-2">Start Date</label>
          <input
            type="date"
            required
            min={new Date().toISOString().split('T')[0]}
            value={form.start_date}
            onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
          />
        </div>
        <div>
          <label className="block font-medium mb-2">End Date</label>
          <input
            type="date"
            required
            min={form.start_date || new Date().toISOString().split('T')[0]}
            value={form.end_date}
            onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
          />
        </div>
      </div>

      <div>
        <label className="block font-medium mb-2">Number of People</label>
        <input
          type="number"
          min="1"
          max="20"
          required
          value={form.num_people}
          onChange={(e) => setForm((f) => ({ ...f, num_people: Number(e.target.value) }))}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
        />
      </div>

      <div>
        <label className="block font-medium mb-2">Special Requests (Optional)</label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
        />
      </div>

      {selectedDest && form.start_date && form.end_date && (
        <div className="bg-uganda-yellow/10 p-4 rounded-lg">
          <p className="font-semibold">Total Estimate:</p>
          <p className="text-2xl font-bold text-uganda-red">${calculateTotal()}</p>
          <p className="text-sm text-gray-600 mt-1">
            Includes destination fee + guide (if selected)
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !selectedDest}
        className="w-full btn-uganda disabled:opacity-50 text-lg py-3"
      >
        {loading ? 'Creating...' : 'Confirm Booking'}
      </button>
    </form>
  );
}