import { useState, useEffect } from "react";
import { TaskFilters } from "../types";

export function useTaskFilters() {
  const [filters, setFilters] = useState<TaskFilters>({
    status: "all",
    priority: "all",
    categoryId: "all",
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [isSemanticSearch, setIsSemanticSearch] = useState<boolean>(false);
  // ponytail: 350ms native debounce to conserve Gemini AI quota and prevent UI flickering. upgrade to AbortController signal if backend latency spikes.
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search || "");

  useEffect(() => {
    if (!filters.search) {
      setDebouncedSearch("");
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search || "");
    }, 350);

    return () => clearTimeout(timer);
  }, [filters.search]);

  const toggleSemanticSearch = () => {
    setIsSemanticSearch((prev) => !prev);
  };

  return {
    filters,
    setFilters,
    debouncedSearch,
    isSemanticSearch,
    toggleSemanticSearch,
  };
}
