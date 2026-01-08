import { useState } from "react";
import { destinationService } from "../services/destination-service";
import type { Destination } from "../services/destination.types";

interface SearchParams {
  query?: string;
  page?: number;
  limit?: number;
}

export function useSearch() {
  const [results, setResults] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 12,
  });
  const [searchParams, setSearchParams] = useState<SearchParams>({
    query: "",
    page: 1,
    limit: 12,
  });

  const performSearch = async (params: SearchParams, filters: Record<string, any>) => {
    setLoading(true);
    setError("");
    setSearchParams(params);
    try {
      const response = await destinationService.getFilteredDestinations({
        search: params.query || "",
        page: params.page || 1,
        limit: params.limit || 12,
        ...filters,
      });
      setResults(response.destinations || []);
      setPagination(response.pagination || pagination);
    } catch (err: any) {
      setError(err.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setPagination({ page: 1, pages: 1, total: 0, limit: 12 });
  };

  return {
    results,
    loading,
    error,
    pagination,
    searchParams,
    performSearch,
    clearResults,
  };
}
