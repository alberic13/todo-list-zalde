import { useState, useEffect, useCallback } from "react";
import { Task, TaskStats, TaskFilters } from "../types";
import { taskService, CreateTaskPayload, UpdateTaskPayload } from "../services/taskService";
import { aiService } from "../services/aiService";
import { useAuth } from "./useAuth";
import { useTaskSync } from "./useTaskSync";
import { useCategories } from "./useCategories";

export function useTasks() {
  const { isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSemanticSearch, setIsSemanticSearch] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const {
    categories,
    loadCategories,
    createCategory,
    deleteCategory,
  } = useCategories(isAuthenticated);

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

  // Shared fetcher for tasks & stats
  const fetchTasksData = useCallback(async () => {
    const activeFilters: TaskFilters = {
      ...filters,
      search: debouncedSearch,
    };

    let fetchedTasks: Task[] = [];
    if (isSemanticSearch && debouncedSearch && debouncedSearch.trim()) {
      fetchedTasks = await aiService.search(debouncedSearch.trim());
    } else {
      fetchedTasks = await taskService.list(activeFilters);
    }

    const fetchedStats = await taskService.getStats();
    return { fetchedTasks, fetchedStats };
  }, [
    filters,
    debouncedSearch,
    isSemanticSearch,
  ]);

  const loadTasks = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      setError(null);
      const { fetchedTasks, fetchedStats } = await fetchTasksData();
      setTasks(fetchedTasks);
      setStats(fetchedStats);
    } catch (err: any) {
      console.error("Error loading tasks:", err);
      setError(err.message || "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchTasksData]);

  const silentSyncTasks = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { fetchedTasks, fetchedStats } = await fetchTasksData();

      setTasks((prev) => {
        if (prev.length !== fetchedTasks.length) return fetchedTasks;
        const hasChange = prev.some((pt, i) => {
          const ft = fetchedTasks[i];
          if (!ft || pt.id !== ft.id || pt.status !== ft.status) return true;
          const pSubs = pt.subtasks || [];
          const fSubs = ft.subtasks || [];
          if (pSubs.length !== fSubs.length) return true;
          return pSubs.some((ps, sI) => {
            const fs = fSubs[sI];
            return !fs || ps.id !== fs.id || ps.isCompleted !== fs.isCompleted || ps.title !== fs.title;
          });
        });
        return hasChange ? fetchedTasks : prev;
      });

      setStats((prev) => {
        if (!prev) return fetchedStats;
        if (
          prev.total !== fetchedStats.total ||
          prev.completed !== fetchedStats.completed ||
          prev.pending !== fetchedStats.pending ||
          prev.inProgress !== fetchedStats.inProgress
        ) {
          return fetchedStats;
        }
        return prev;
      });
    } catch {
      // Silent sync catches errors without disrupting active UI
    }
  }, [isAuthenticated, fetchTasksData]);

  const { broadcastEvent } = useTaskSync({
    enabled: isAuthenticated,
    onSilentSync: silentSyncTasks,
    pollIntervalMs: 2500,
  });

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadTasks(), loadCategories()]);
  }, [loadTasks, loadCategories]);

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
    broadcastEvent({ type: "TASK_UPDATE", taskId: id });
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
    broadcastEvent({ type: "SUBTASK_ADD", taskId });
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
    broadcastEvent({ type: "SUBTASK_TOGGLE", taskId, subtaskId });
    try {
      await taskService.toggleSubtask(subtaskId);
      const newStats = await taskService.getStats();
      setStats(newStats);
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
    broadcastEvent({ type: "SUBTASK_DELETE", taskId, subtaskId });
    try {
      await taskService.deleteSubtask(subtaskId);
      const newStats = await taskService.getStats();
      setStats(newStats);
    } catch (err) {
      await loadTasks();
      throw err;
    }
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id);
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
    refresh: refreshAll,
    createTask,
    updateTask,
    updateStatus,
    deleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    createCategory,
    deleteCategory: handleDeleteCategory,
  };
}
