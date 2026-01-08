import React from "react";
import SearchBar from "../components/search/search-bar";
import AdvancedFilters from "../components/search/advanced-filters";
import ResultsGrid from "../components/search/results-grid";
import { useSearch } from "../hooks/use-search";
import { useFilters } from "../hooks/use-filters";

export default function DestinationSearchPage() {
  const { filters, updateFilter, resetFilters } = useFilters({
    region: "",
    difficulty: "",
    max_price: "",
  });

  const { results, search, loading, error } = useSearch("/api/destinations", {
    limit: 9,
  });

  const handleApplyFilters = () => search({ filters });
  const handleQueryChange = (query: string) => search({ query });

  return (
    <div className="max-w-7xl mx-auto p-6 font-african">
      <SearchBar onSearch={handleQueryChange} placeholder="Search destinations..." />
      <AdvancedFilters
        filters={filters}
        onChange={updateFilter}
        onApply={handleApplyFilters}
        onReset={resetFilters}
      />
      <ResultsGrid
        data={results}
        loading={loading}
        error={error}
        renderItem={(item: any) => (
          <div className="p-6">
            <h3 className="text-xl font-bold font-display text-uganda-black mb-2">
              {item.name}
            </h3>
            <p className="text-gray-600 mb-2 line-clamp-2">{item.description}</p>
            <p className="text-sm text-gray-500">Region: {item.region}</p>
          </div>
        )}
      />
    </div>
  );
}
