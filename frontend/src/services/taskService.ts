import { request } from "./api";
import { Task, TaskStats, TaskFilters, Subtask } from "../types";

export interface CreateTaskPayload {
  title: string;
  description?: string;
  categoryId?: string | null;
  status?: string;
  priority?: string;
  dueDate?: string | null;
  orderIndex?: number;
  subtasks?: string[];
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  categoryId?: string | null;
  status?: string;
  priority?: string;
  dueDate?: string | null;
  orderIndex?: number;
}

export const taskService = {
  async list(filters: TaskFilters = {}): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== "all") params.append("status", filters.status);
    if (filters.priority && filters.priority !== "all") params.append("priority", filters.priority);
    if (filters.categoryId && filters.categoryId !== "all") params.append("categoryId", filters.categoryId);
    if (filters.search && filters.search.trim()) params.append("search", filters.search.trim());
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

    const queryStr = params.toString() ? `?${params.toString()}` : "";
    return request<Task[]>(`/api/tasks${queryStr}`, {
      method: "GET",
    });
  },

  async getStats(): Promise<TaskStats> {
    return request<TaskStats>("/api/tasks/stats", {
      method: "GET",
    });
  },

  async getById(id: string): Promise<Task> {
    return request<Task>(`/api/tasks/${id}`, {
      method: "GET",
    });
  },

  async create(payload: CreateTaskPayload): Promise<Task> {
    return request<Task>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async update(id: string, payload: UpdateTaskPayload): Promise<Task> {
    return request<Task>(`/api/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async updateStatus(id: string, status: string): Promise<Task> {
    return request<Task>(`/api/tasks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  async delete(id: string): Promise<Task> {
    return request<Task>(`/api/tasks/${id}`, {
      method: "DELETE",
    });
  },

  async addSubtask(taskId: string, title: string): Promise<Subtask> {
    return request<Subtask>(`/api/tasks/${taskId}/subtasks`, {
      method: "POST",
      body: JSON.stringify({ title }),
    });
  },

  async toggleSubtask(subtaskId: string): Promise<Subtask> {
    return request<Subtask>(`/api/subtasks/${subtaskId}/toggle`, {
      method: "PATCH",
    });
  },

  async deleteSubtask(subtaskId: string): Promise<Subtask> {
    return request<Subtask>(`/api/subtasks/${subtaskId}`, {
      method: "DELETE",
    });
  },
};
