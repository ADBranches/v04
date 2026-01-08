// app/routes/search.tsx
import React, { useEffect, useState } from "react";
import SearchBar from "../components/search/search-bar";
import AdvancedFilters from "../components/search/advanced-filters";
import ResultsGrid from "../components/search/results-grid";
import { useSearch } from "../hooks/use-search";
import { useFilters } from "../hooks/use-filters";
import { motion } from "framer-motion";

export default function SearchPage() {
  const { results, loading, error, pagination, performSearch } = useSearch();
  const { filters, updateFilter, resetFilters } = useFilters();
  const [lastQuery, setLastQuery] = useState("");

  // 🔍 Load initial destinations
  useEffect(() => {
    performSearch({ query: "", page: 1, limit: 12 }, filters);
  }, []);

  // === Handlers ===
  const handleSearch = (query: string) => {
    setLastQuery(query);
    performSearch({ query, page: 1, limit: 12 }, filters);
  };

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    updateFilter(key, value);
    performSearch({ query: lastQuery, page: 1, limit: 12 }, { ...filters, [key]: value });
  };

  const handleReset = () => {
    resetFilters();
    setLastQuery("");
    performSearch({ query: "", page: 1, limit: 12 }, {});
  };

  const handlePagination = (direction: "next" | "prev") => {
    const newPage =
      direction === "next" ? pagination.page + 1 : pagination.page - 1;
    performSearch({ query: lastQuery, page: newPage, limit: pagination.limit }, filters);
  };

  // === UI ===
  return (
    <div className="min-h-screen bg-safari-sand font-african pt-24 pb-20">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto px-4"
      >
        {/* Header */}
        <header className="text-center mb-10">
          <motion.h1
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="text-3xl font-bold text-uganda-black font-display"
          >
            Explore Destinations Across Uganda
          </motion.h1>
          <p className="text-gray-600 mt-2">
            Search and filter experiences by region, difficulty, or popularity
          </p>
        </header>

        {/* Search Bar (with history) */}
        <SearchBar onSearch={handleSearch} />

        {/* Filters */}
        <div className="mb-8">
          <AdvancedFilters filters={filters} onChange={handleFilterChange} />
          <div className="flex justify-end mt-4">
            <button
              onClick={handleReset}
              className="text-sm text-gray-600 hover:text-uganda-yellow transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Animated Results */}
        <ResultsGrid results={results} loading={loading} error={error} />

        {/* Pagination */}
        {!loading && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center items-center gap-4 mt-10"
          >
            {pagination.page > 1 && (
              <button
                onClick={() => handlePagination("prev")}
                className="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 font-african"
              >
                ← Prev
              </button>
            )}
            <span className="text-gray-700 text-sm">
              Page {pagination.page} of {pagination.pages}
            </span>
            {pagination.page < pagination.pages && (
              <button
                onClick={() => handlePagination("next")}
                className="px-4 py-2 bg-uganda-yellow text-uganda-black rounded-lg hover:bg-yellow-400 font-african"
              >
                Next →
              </button>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
