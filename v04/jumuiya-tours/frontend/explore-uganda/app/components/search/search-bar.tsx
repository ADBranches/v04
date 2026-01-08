import React, { useState, useEffect } from "react";
import { Search, History } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  onSearch,
  placeholder = "Search destinations, regions, or guides...",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load history
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("search_history") || "[]");
    setHistory(stored);
  }, []);

  // Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  // Perform search + save query
  useEffect(() => {
    if (debouncedQuery.trim() !== "") {
      onSearch(debouncedQuery.trim());
      if (!history.includes(debouncedQuery.trim())) {
        const updated = [debouncedQuery.trim(), ...history].slice(0, 5);
        setHistory(updated);
        localStorage.setItem("search_history", JSON.stringify(updated));
      }
    }
  }, [debouncedQuery]);

  return (
    <div className="relative w-full max-w-2xl mx-auto mb-8">
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowHistory(true)}
          onBlur={() => setTimeout(() => setShowHistory(false), 200)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-uganda-yellow text-gray-700 shadow-sm"
        />
      </div>

      {/* Search History */}
      {showHistory && history.length > 0 && (
        <div className="absolute bg-white border border-gray-200 rounded-lg shadow-md mt-2 w-full z-20">
          {history.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(item);
                onSearch(item);
                setShowHistory(false);
              }}
              className="w-full flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 text-left"
            >
              <History size={14} className="mr-2 text-gray-400" />
              {item}
            </button>
          ))}
          <button
            onClick={() => {
              localStorage.removeItem("search_history");
              setHistory([]);
            }}
            className="w-full text-xs text-red-500 hover:text-red-600 py-2 border-t border-gray-100"
          >
            Clear History
          </button>
        </div>
      )}
    </div>
  );
}
