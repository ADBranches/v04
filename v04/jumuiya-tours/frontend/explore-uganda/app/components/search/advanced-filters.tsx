import React from "react";
import type { Filters } from "../../hooks/use-filters";

interface Props {
  filters: Filters;
  onChange: (key: keyof Filters, value: any) => void;
}

export default function AdvancedFilters({ filters, onChange }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Region */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Region
        </label>
        <select
          value={filters.region}
          onChange={(e) => onChange("region", e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-uganda-yellow focus:border-uganda-yellow"
        >
          <option value="">All Regions</option>
          <option value="Central">Central Uganda</option>
          <option value="Eastern">Eastern Uganda</option>
          <option value="Northern">Northern Uganda</option>
          <option value="Western">Western Uganda</option>
        </select>
      </div>

      {/* Difficulty */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Difficulty
        </label>
        <select
          value={filters.difficulty}
          onChange={(e) => onChange("difficulty", e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-uganda-yellow focus:border-uganda-yellow"
        >
          <option value="">All Levels</option>
          <option value="Easy">Easy</option>
          <option value="Moderate">Moderate</option>
          <option value="Difficult">Difficult</option>
        </select>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Price Range
        </label>
        <select
          value={filters.priceRange}
          onChange={(e) => onChange("priceRange", e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-uganda-yellow focus:border-uganda-yellow"
        >
          <option value="">All Prices</option>
          <option value="budget">Budget</option>
          <option value="midrange">Mid-range</option>
          <option value="luxury">Luxury</option>
        </select>
      </div>

      {/* Featured */}
      <div className="flex items-center space-x-2 md:col-span-2 lg:col-span-1">
        <input
          type="checkbox"
          checked={filters.featured}
          onChange={(e) => onChange("featured", e.target.checked)}
          className="h-4 w-4 text-uganda-yellow border-gray-300 rounded focus:ring-uganda-yellow"
        />
        <label className="text-sm text-gray-700">Featured only</label>
      </div>

      {/* Sorting */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sort by
        </label>
        <select
          value={filters.sort}
          onChange={(e) => onChange("sort", e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-uganda-yellow focus:border-uganda-yellow"
        >
          <option value="created_at">Newest</option>
          <option value="name">Alphabetical</option>
          <option value="price_range">Price</option>
        </select>
      </div>

      {/* Order */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Order
        </label>
        <select
          value={filters.order}
          onChange={(e) => onChange("order", e.target.value as "asc" | "desc")}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-uganda-yellow focus:border-uganda-yellow"
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>
    </div>
  );
}
