import { eq, and, desc, asc, ilike, or, sql, inArray } from "drizzle-orm";
import { db } from "../config/db";
import { tasks, subtasks, categories, taskCollaborators } from "../models/schema";
import { EmbeddingService } from "./embedding.service";

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

export class TaskService {
  static async list(userId: string, filters: TaskFilters = {}) {
    // 1. Find task IDs where user is invited as collaborator
    const userCollabs = await db.query.taskCollaborators.findMany({
      where: eq(taskCollaborators.userId, userId),
      columns: { taskId: true },
    });
    const collabTaskIds = userCollabs.map((c) => c.taskId);

    const accessCondition =
      collabTaskIds.length > 0
        ? or(eq(tasks.userId, userId), inArray(tasks.id, collabTaskIds))!
        : eq(tasks.userId, userId);

    const conditions = [accessCondition];

    if (filters.status && filters.status !== "all") {
      conditions.push(eq(tasks.status, filters.status));
    }

    if (filters.priority && filters.priority !== "all") {
      conditions.push(eq(tasks.priority, filters.priority));
    }

    if (filters.categoryId && filters.categoryId !== "all") {
      conditions.push(eq(tasks.categoryId, filters.categoryId));
    }

    if (filters.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(
        or(ilike(tasks.title, q), ilike(tasks.description, q))!
      );
    }

    let orderByClause = desc(tasks.createdAt);
    if (filters.sortBy === "dueDate") {
      orderByClause = filters.sortOrder === "asc" ? asc(tasks.dueDate) : desc(tasks.dueDate);
    } else if (filters.sortBy === "priority") {
      orderByClause = desc(tasks.priority);
    } else if (filters.sortBy === "orderIndex") {
      orderByClause = asc(tasks.orderIndex);
    }

    const taskList = await db.query.tasks.findMany({
      where: and(...conditions),
      with: {
        category: true,
        user: {
          columns: { id: true, name: true, email: true },
        },
        subtasks: {
          orderBy: [asc(subtasks.createdAt)],
        },
        collaborators: {
          with: {
            user: {
              columns: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: [orderByClause, desc(tasks.createdAt)],
    });

    return taskList.map((t) => ({
      ...t,
      isOwner: t.userId === userId,
      collaboratorCount: (t.collaborators || []).length,
    }));
  }

  static async getById(id: string, userId: string) {
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, id),
      with: {
        category: true,
        user: {
          columns: { id: true, name: true, email: true },
        },
        subtasks: {
          orderBy: [asc(subtasks.createdAt)],
        },
        collaborators: {
          with: {
            user: {
              columns: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!task) return null;

    const isOwner = task.userId === userId;
    const isCollaborator = isOwner || (task.collaborators || []).some((c) => c.userId === userId);

    if (!isCollaborator) return null;

    return {
      ...task,
      isOwner,
      collaboratorCount: (task.collaborators || []).length,
    };
  }

  static async create(userId: string, data: CreateTaskDTO) {
    const [newTask] = await db
      .insert(tasks)
      .values({
        userId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        categoryId: data.categoryId || null,
        status: data.status || "todo",
        priority: data.priority || "medium",
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        orderIndex: data.orderIndex || 0,
      })
      .returning();

    if (data.subtaskTitles && data.subtaskTitles.length > 0) {
      const subtaskValues = data.subtaskTitles
        .map((title) => title.trim())
        .filter(Boolean)
        .map((title) => ({
          taskId: newTask.id,
          title,
          isCompleted: false,
        }));

      if (subtaskValues.length > 0) {
        await db.insert(subtasks).values(subtaskValues);
      }
    }

    // Await embedding sync to guarantee execution in serverless environments (Vercel)
    await EmbeddingService.syncTaskEmbedding(newTask.id, userId).catch((err) =>
      console.error("Auto embedding sync error:", err)
    );

    return await this.getById(newTask.id, userId);
  }

  static async update(id: string, userId: string, data: UpdateTaskDTO) {
    const updatePayload: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updatePayload.title = data.title.trim();
    if (data.description !== undefined) updatePayload.description = data.description?.trim() || null;
    if (data.categoryId !== undefined) updatePayload.categoryId = data.categoryId || null;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.priority !== undefined) updatePayload.priority = data.priority;
    if (data.dueDate !== undefined) updatePayload.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.orderIndex !== undefined) updatePayload.orderIndex = data.orderIndex;

    const [updated] = await db
      .update(tasks)
      .set(updatePayload)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();

    if (!updated) return null;

    // Await re-embedding sync to guarantee execution in serverless environments
    await EmbeddingService.syncTaskEmbedding(id, userId).catch((err) =>
      console.error("Auto re-embedding sync error:", err)
    );

    return await this.getById(id, userId);
  }

  static async updateStatus(id: string, userId: string, status: string) {
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, id),
      with: { collaborators: true },
    });

    if (!task) return null;

    const isOwner = task.userId === userId;
    const isCollaborator = isOwner || (task.collaborators || []).some((c) => c.userId === userId);
    if (!isCollaborator) return null;

    const [updated] = await db
      .update(tasks)
      .set({ status, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();

    if (updated) {
      // ponytail: non-blocking embedding sync to keep Kanban drag-drop instant. upgrade to background queue if serverless execution freeze drops tasks.
      EmbeddingService.syncTaskEmbedding(id, task.userId).catch(console.error);
    }

    return updated ? await this.getById(id, userId) : null;
  }

  static async delete(id: string, userId: string) {
    // Only owner can delete task
    // Remove embedding first
    await EmbeddingService.removeTaskEmbedding(id);

    const [deleted] = await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();

    return deleted || null;
  }

  static async getStats(userId: string) {
    const stats = await db
      .select({
        total: sql<number>`count(*)`,
        todo: sql<number>`count(*) filter (where ${tasks.status} = 'todo')`,
        inProgress: sql<number>`count(*) filter (where ${tasks.status} = 'in_progress')`,
        done: sql<number>`count(*) filter (where ${tasks.status} = 'done')`,
        overdue: sql<number>`count(*) filter (where ${tasks.status} != 'done' and ${tasks.dueDate} < now())`,
      })
      .from(tasks)
      .where(eq(tasks.userId, userId));

    const s = stats[0] || { total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0 };
    const total = Number(s.total) || 0;
    const done = Number(s.done) || 0;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

    return {
      total,
      todo: Number(s.todo) || 0,
      inProgress: Number(s.inProgress) || 0,
      done,
      overdue: Number(s.overdue) || 0,
      completionRate,
    };
  }

  // Subtask operations
  static async addSubtask(taskId: string, userId: string, title: string) {
    // Verify user is owner or collaborator of parent task
    const parentTask = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
      with: { collaborators: true },
    });
    if (!parentTask) throw new Error("Task not found or unauthorized");

    const isOwner = parentTask.userId === userId;
    const isCollaborator = isOwner || (parentTask.collaborators || []).some((c) => c.userId === userId);
    if (!isCollaborator) throw new Error("Task not found or unauthorized");

    const [newSubtask] = await db
      .insert(subtasks)
      .values({
        taskId,
        title: title.trim(),
        isCompleted: false,
      })
      .returning();

    await db
      .update(tasks)
      .set({ updatedAt: new Date() })
      .where(eq(tasks.id, taskId));

    return newSubtask;
  }

  static async toggleSubtask(subtaskId: string, userId: string) {
    const subtask = await db.query.subtasks.findFirst({
      where: eq(subtasks.id, subtaskId),
      with: {
        task: {
          with: { collaborators: true },
        },
      },
    });

    if (!subtask || !subtask.task) throw new Error("Subtask not found or unauthorized");

    const isOwner = subtask.task.userId === userId;
    const isCollaborator = isOwner || (subtask.task.collaborators || []).some((c) => c.userId === userId);
    if (!isCollaborator) throw new Error("Subtask not found or unauthorized");

    const [updated] = await db
      .update(subtasks)
      .set({ isCompleted: !subtask.isCompleted })
      .where(eq(subtasks.id, subtaskId))
      .returning();

    await db
      .update(tasks)
      .set({ updatedAt: new Date() })
      .where(eq(tasks.id, subtask.taskId));

    return updated;
  }

  static async deleteSubtask(subtaskId: string, userId: string) {
    const subtask = await db.query.subtasks.findFirst({
      where: eq(subtasks.id, subtaskId),
      with: {
        task: {
          with: { collaborators: true },
        },
      },
    });

    if (!subtask || !subtask.task) throw new Error("Subtask not found or unauthorized");

    const isOwner = subtask.task.userId === userId;
    const isCollaborator = isOwner || (subtask.task.collaborators || []).some((c) => c.userId === userId);
    if (!isCollaborator) throw new Error("Subtask not found or unauthorized");

    const [deleted] = await db
      .delete(subtasks)
      .where(eq(subtasks.id, subtaskId))
      .returning();

    await db
      .update(tasks)
      .set({ updatedAt: new Date() })
      .where(eq(tasks.id, subtask.taskId));

    return deleted;
  }
}
