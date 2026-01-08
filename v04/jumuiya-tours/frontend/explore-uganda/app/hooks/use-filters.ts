import { useState } from "react";

export interface Filters {
  region?: string;
  difficulty?: string;
  priceRange?: string;
  featured?: boolean;
  sort?: string;
  order?: "asc" | "desc";
}

export function useFilters() {
  const [filters, setFilters] = useState<Filters>({
    region: "",
    difficulty: "",
    priceRange: "",
    featured: false,
    sort: "created_at",
    order: "desc",
  });

  const updateFilter = (key: keyof Filters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      region: "",
      difficulty: "",
      priceRange: "",
      featured: false,
      sort: "created_at",
      order: "desc",
    });
  };

  return { filters, updateFilter, resetFilters };
}
