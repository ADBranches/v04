import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Mountain, Star } from "lucide-react";
import type { Destination } from "../../services/destination.types";
import { Link } from "react-router-dom";

interface ResultsGridProps {
  results: Destination[];
  loading: boolean;
  error?: string;
}

export default function ResultsGrid({ results, loading, error }: ResultsGridProps) {
  if (loading)
    return (
      <div className="text-center py-12">
        <svg
          className="animate-spin h-10 w-10 text-uganda-yellow mx-auto"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p className="mt-3 text-gray-600 font-african">Searching destinations...</p>
      </div>
    );

  if (error)
    return (
      <div className="text-center py-8 text-red-600 font-african">
        {error}
      </div>
    );

  if (!results || results.length === 0)
    return (
      <div className="text-center py-12 text-gray-600 font-african">
        No results found. Try adjusting filters.
      </div>
    );

  return (
    <AnimatePresence>
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 font-african"
      >
        {results.map((dest) => (
          <motion.div
            key={dest.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <img
              src={dest.images?.[0] || "/images/uganda-placeholder.jpg"}
              alt={dest.name}
              className="w-full h-48 object-cover rounded-t-2xl"
            />
            <div className="p-6">
              <h3 className="text-lg font-semibold text-uganda-black mb-1">
                {dest.name}
              </h3>
              <p className="text-gray-600 mb-2 line-clamp-2">
                {dest.short_description || dest.description || "No description available."}
              </p>

              <div className="flex items-center text-sm text-gray-500 mb-3 space-x-3">
                <span className="flex items-center gap-1">
                  <MapPin size={14} className="text-uganda-yellow" />
                  {dest.region}
                </span>
                <span className="flex items-center gap-1">
                  <Mountain size={14} className="text-gray-400" />
                  {dest.difficulty_level || "N/A"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <Link
                  to={`/destinations/${dest.id}`}
                  className="bg-uganda-yellow text-uganda-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-400 transition-colors"
                >
                  View
                </Link>

                {dest.featured && (
                  <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md uppercase">
                    <Star size={12} />
                    Featured
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
