import { useState, useCallback, useEffect } from "react";
import { Category } from "../types";
import { categoryService } from "../services/categoryService";

// ponytail: dedicated hook for category CRUD. upgrade to SWR or query cache if categories mutate across multi-tabs.
export function useCategories(isAuthenticated: boolean) {
  const [categories, setCategories] = useState<Category[]>([]);

  const loadCategories = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const fetched = await categoryService.list();
      setCategories(fetched);
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const createCategory = async (name: string, colorHex?: string) => {
    const newCategory = await categoryService.create(name, colorHex);
    setCategories((prev) => [...prev, newCategory]);
    return newCategory;
  };

  const deleteCategory = async (id: string) => {
    await categoryService.delete(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  return {
    categories,
    loadCategories,
    createCategory,
    deleteCategory,
  };
}
