export interface TaskFilters {
  status?: string;
  priority?: string;
  categoryId?: string;
  search?: string;
  sortBy?: "dueDate" | "priority" | "createdAt" | "orderIndex";
  sortOrder?: "asc" | "desc";
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  categoryId?: string;
  status?: string;
  priority?: string;
  dueDate?: string | null;
  orderIndex?: number;
  subtaskTitles?: string[];
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  categoryId?: string | null;
  status?: string;
  priority?: string;
  dueDate?: string | null;
  orderIndex?: number;
}
