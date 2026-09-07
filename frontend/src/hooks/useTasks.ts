import { useState, useEffect, useCallback } from "react";
import { Task, TaskStats, TaskFilters } from "../types";
import { taskService, CreateTaskPayload, UpdateTaskPayload } from "../services/taskService";
import { aiService } from "../services/aiService";
import { collaborationService } from "../services/collaborationService";
import { useAuth } from "./useAuth";
import { useTaskSync } from "./useTaskSync";
import { useCategories } from "./useCategories";
import { useTaskFilters } from "./useTaskFilters";
import { useSubtasks } from "./useSubtasks";
import { hasTaskDifferences, hasStatDifferences } from "../utils/taskSyncUtils";

// ponytail: unified task orchestrator hook. subtasks, categories, and filters factored into sub-hooks.
export function useTasks() {
  const { isAuthenticated, user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { categories, loadCategories, createCategory, deleteCategory } = useCategories(isAuthenticated);
  const { filters, setFilters, debouncedSearch, isSemanticSearch, toggleSemanticSearch } = useTaskFilters();

  const fetchTasksData = useCallback(async () => {
    const activeFilters: TaskFilters = { ...filters, search: debouncedSearch };
    const fetchedTasks = (isSemanticSearch && debouncedSearch?.trim())
      ? await aiService.search(debouncedSearch.trim())
      : await taskService.list(activeFilters);

    const fetchedStats = await taskService.getStats();
    return { fetchedTasks, fetchedStats };
  }, [filters, debouncedSearch, isSemanticSearch]);

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
      setTasks((prev) => (hasTaskDifferences(prev, fetchedTasks) ? fetchedTasks : prev));
      setStats((prev) => (hasStatDifferences(prev, fetchedStats) ? fetchedStats : prev));
    } catch {
      // Silent sync catches errors without disrupting active UI
    }
  }, [isAuthenticated, fetchTasksData]);

  const { broadcastEvent } = useTaskSync({
    enabled: isAuthenticated,
    onSilentSync: silentSyncTasks,
    pollIntervalMs: 2500,
  });

  const { addSubtask, toggleSubtask, deleteSubtask } = useSubtasks({
    setTasks,
    setStats,
    loadTasks,
    broadcastEvent,
  });

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadTasks(), loadCategories()]);
  }, [loadTasks, loadCategories]);

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
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: status as any } : t)));
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

  const leaveTask = async (id: string) => {
    if (!user?.id) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await collaborationService.removeCollaborator(id, user.id);
      const newStats = await taskService.getStats();
      setStats(newStats);
      broadcastEvent({ type: "TASK_UPDATE", taskId: id });
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
    leaveTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    createCategory,
    deleteCategory: handleDeleteCategory,
  };
}
