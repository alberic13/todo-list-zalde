import { useState, useEffect, useCallback } from "react";
import { Task, TaskStats, Category, TaskFilters } from "../types";
import { taskService, CreateTaskPayload, UpdateTaskPayload } from "../services/taskService";
import { categoryService } from "../services/categoryService";
import { aiService } from "../services/aiService";
import { useAuth } from "./useAuth";

export function useTasks() {
  const { isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSemanticSearch, setIsSemanticSearch] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<TaskFilters>({
    status: "all",
    priority: "all",
    categoryId: "all",
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

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

  const loadTasks = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      setError(null);

      const activeFilters: TaskFilters = {
        ...filters,
        search: debouncedSearch,
      };

      // Check if semantic search is active with a query
      let fetchedTasks: Task[] = [];
      if (isSemanticSearch && debouncedSearch && debouncedSearch.trim()) {
        fetchedTasks = await aiService.search(debouncedSearch.trim());
      } else {
        fetchedTasks = await taskService.list(activeFilters);
      }

      const [fetchedStats, fetchedCategories] = await Promise.all([
        taskService.getStats(),
        categoryService.list(),
      ]);

      setTasks(fetchedTasks);
      setStats(fetchedStats);
      setCategories(fetchedCategories);
    } catch (err: any) {
      console.error("Error loading tasks:", err);
      setError(err.message || "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  }, [
    isAuthenticated,
    filters.status,
    filters.priority,
    filters.categoryId,
    filters.sortBy,
    filters.sortOrder,
    debouncedSearch,
    isSemanticSearch,
  ]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const toggleSemanticSearch = () => {
    setIsSemanticSearch((prev) => !prev);
  };

  const createTask = async (payload: CreateTaskPayload) => {
    const newTask = await taskService.create(payload);
    await loadTasks();
    return newTask;
  };

  const updateTask = async (id: string, payload: UpdateTaskPayload) => {
    const updated = await taskService.update(id, payload);
    await loadTasks();
    return updated;
  };

  const updateStatus = async (id: string, status: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: status as any } : t))
    );
    try {
      await taskService.updateStatus(id, status);
      const newStats = await taskService.getStats();
      setStats(newStats);
    } catch (err) {
      await loadTasks();
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await taskService.delete(id);
      const newStats = await taskService.getStats();
      setStats(newStats);
    } catch (err) {
      await loadTasks();
      throw err;
    }
  };

  const addSubtask = async (taskId: string, title: string) => {
    const subtask = await taskService.addSubtask(taskId, title);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: [...(t.subtasks || []), subtask] }
          : t
      )
    );
    return subtask;
  };

  const toggleSubtask = async (subtaskId: string, taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks?.map((s) =>
                s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
              ),
            }
          : t
      )
    );
    try {
      await taskService.toggleSubtask(subtaskId);
    } catch (err) {
      await loadTasks();
      throw err;
    }
  };

  const deleteSubtask = async (subtaskId: string, taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks?.filter((s) => s.id !== subtaskId),
            }
          : t
      )
    );
    try {
      await taskService.deleteSubtask(subtaskId);
    } catch (err) {
      await loadTasks();
      throw err;
    }
  };

  const createCategory = async (name: string, colorHex?: string) => {
    const newCategory = await categoryService.create(name, colorHex);
    setCategories((prev) => [...prev, newCategory]);
    return newCategory;
  };

  const deleteCategory = async (id: string) => {
    await categoryService.delete(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    await loadTasks();
  };

  return {
    tasks,
    stats,
    categories,
    isLoading,
    isSemanticSearch,
    toggleSemanticSearch,
    error,
    filters,
    setFilters,
    refresh: loadTasks,
    createTask,
    updateTask,
    updateStatus,
    deleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    createCategory,
    deleteCategory,
  };
}
