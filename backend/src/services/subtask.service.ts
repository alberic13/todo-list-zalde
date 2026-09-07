import { eq, and } from "drizzle-orm";
import { db } from "../config/db";
import { tasks, subtasks } from "../models/schema";

export class SubtaskService {
  /**
   * Helper to verify if a user has access to task (owner or collaborator)
   */
  private static async verifyTaskAccess(taskId: string, userId: string) {
    const parentTask = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
      with: { collaborators: true },
    });
    if (!parentTask) throw new Error("Task not found or unauthorized");

    const isOwner = parentTask.userId === userId;
    const isCollaborator = isOwner || (parentTask.collaborators || []).some((c) => c.userId === userId);
    if (!isCollaborator) throw new Error("Task not found or unauthorized");

    return parentTask;
  }

  static async add(taskId: string, userId: string, title: string) {
    await this.verifyTaskAccess(taskId, userId);

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

  static async toggle(subtaskId: string, userId: string) {
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

  static async delete(subtaskId: string, userId: string) {
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
