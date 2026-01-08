// app/hooks/use-api.ts
import { useState, useEffect, useCallback } from "react";

interface ApiOptions extends RequestInit {
  cacheKey?: string;
  skip?: boolean;
  deps?: any[];
}

export function useApi<T = any>(url: string, options: ApiOptions = {}) {
  const { cacheKey, skip = false, deps = [], ...fetchOptions } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!skip);

  const fetchData = useCallback(async () => {
    if (skip) return;
    setLoading(true);
    setError(null);

    // ⚡ simple cache
    if (cacheKey) {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setData(JSON.parse(cached));
        setLoading(false);
        return;
      }
    }

    try {
      const controller = new AbortController();
      const res = await fetch(url, { ...fetchOptions, signal: controller.signal });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setData(json);
      if (cacheKey) sessionStorage.setItem(cacheKey, JSON.stringify(json));
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }, [url, ...deps]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, loading, refetch: fetchData };
}

// export default useApi;