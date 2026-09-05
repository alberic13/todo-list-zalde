import { eq, and, desc, asc, ilike, or, sql } from "drizzle-orm";
import { db } from "../config/db";
import { tasks, subtasks, categories } from "../models/schema";
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
    const conditions = [eq(tasks.userId, userId)];

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

    return await db.query.tasks.findMany({
      where: and(...conditions),
      with: {
        category: true,
        subtasks: {
          orderBy: [asc(subtasks.createdAt)],
        },
      },
      orderBy: [orderByClause, desc(tasks.createdAt)],
    });
  }

  static async getById(id: string, userId: string) {
    const task = await db.query.tasks.findFirst({
      where: and(eq(tasks.id, id), eq(tasks.userId, userId)),
      with: {
        category: true,
        subtasks: {
          orderBy: [asc(subtasks.createdAt)],
        },
      },
    });
    return task || null;
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
    const [updated] = await db
      .update(tasks)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();

    if (updated) {
      await EmbeddingService.syncTaskEmbedding(id, userId).catch(console.error);
    }

    return updated ? await this.getById(id, userId) : null;
  }

  static async delete(id: string, userId: string) {
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
    // Verify user owns the parent task
    const parentTask = await db.query.tasks.findFirst({
      where: and(eq(tasks.id, taskId), eq(tasks.userId, userId)),
    });
    if (!parentTask) throw new Error("Task not found or unauthorized");

    const [newSubtask] = await db
      .insert(subtasks)
      .values({
        taskId,
        title: title.trim(),
        isCompleted: false,
      })
      .returning();

    return newSubtask;
  }

  static async toggleSubtask(subtaskId: string, userId: string) {
    // Join with parent task to verify ownership
    const [subtask] = await db
      .select({
        id: subtasks.id,
        isCompleted: subtasks.isCompleted,
        taskId: subtasks.taskId,
      })
      .from(subtasks)
      .innerJoin(tasks, eq(subtasks.taskId, tasks.id))
      .where(and(eq(subtasks.id, subtaskId), eq(tasks.userId, userId)))
      .limit(1);

    if (!subtask) throw new Error("Subtask not found or unauthorized");

    const [updated] = await db
      .update(subtasks)
      .set({ isCompleted: !subtask.isCompleted })
      .where(eq(subtasks.id, subtaskId))
      .returning();

    return updated;
  }

  static async deleteSubtask(subtaskId: string, userId: string) {
    const [subtask] = await db
      .select({
        id: subtasks.id,
        taskId: subtasks.taskId,
      })
      .from(subtasks)
      .innerJoin(tasks, eq(subtasks.taskId, tasks.id))
      .where(and(eq(subtasks.id, subtaskId), eq(tasks.userId, userId)))
      .limit(1);

    if (!subtask) throw new Error("Subtask not found or unauthorized");

    const [deleted] = await db
      .delete(subtasks)
      .where(eq(subtasks.id, subtaskId))
      .returning();

    return deleted;
  }
}
