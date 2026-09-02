export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  colorHex: string;
  createdAt?: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  createdAt?: string;
}

export interface Task {
  id: string;
  userId: string;
  categoryId: string | null;
  category?: Category | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  orderIndex: number;
  subtasks?: Subtask[];
  similarityScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
  completionRate: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors: any | null;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  categoryId?: string;
  search?: string;
  sortBy?: "dueDate" | "priority" | "createdAt" | "orderIndex";
  sortOrder?: "asc" | "desc";
}
