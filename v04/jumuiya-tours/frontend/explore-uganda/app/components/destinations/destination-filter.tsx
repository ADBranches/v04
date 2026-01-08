// app/components/destinations/destination-filters.tsx
import { useState, useEffect } from 'react';
import type { DestinationFilters } from '../../services/destination-service';

interface Props {
  onFilterChange: (filters: DestinationFilters) => void;
}

const regions = ['Central', 'Eastern', 'Western', 'Northern'];

export default function DestinationFilters({ onFilterChange }: Props) {
  const [filters, setFilters] = useState<DestinationFilters>({});

  useEffect(() => {
    const timer = setTimeout(() => onFilterChange(filters), 300);
    return () => clearTimeout(timer);
  }, [filters, onFilterChange]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
      <h3 className="font-semibold text-lg text-uganda-black">Filter Destinations</h3>

      <input
        type="text"
        placeholder="Search by name..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
        onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
      />

      <select
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
        onChange={(e) => setFilters((f) => ({ ...f, region: e.target.value || undefined }))}
      >
        <option value="">All Regions</option>
        {regions.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          placeholder="Min price"
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
          onChange={(e) =>
            setFilters((f) => ({ ...f, minPrice: e.target.value ? Number(e.target.value) : undefined }))
          }
        />
        <input
          type="number"
          placeholder="Max price"
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-uganda-yellow"
          onChange={(e) =>
            setFilters((f) => ({ ...f, maxPrice: e.target.value ? Number(e.target.value) : undefined }))
          }
        />
      </div>

      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          className="w-4 h-4 text-uganda-yellow rounded focus:ring-uganda-yellow"
          onChange={(e) => setFilters((f) => ({ ...f, featured: e.target.checked }))}
        />
        <span className="text-sm">Featured only</span>
      </label>
    </div>
  );
}