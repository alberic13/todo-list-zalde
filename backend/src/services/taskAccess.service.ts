import { eq, and } from "drizzle-orm";
import { db } from "../config/db";
import { tasks, taskCollaborators } from "../models/schema";
import type { TaskAccessCheckResult } from "./collaboration.types";

export class TaskAccessService {
  /**
   * Checks if user is owner or collaborator of task
   */
  static async checkAccess(taskId: string, userId: string): Promise<TaskAccessCheckResult> {
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    });

    if (!task) return { isOwner: false, isCollaborator: false };
    if (task.userId === userId) return { isOwner: true, isCollaborator: true };

    const member = await db.query.taskCollaborators.findFirst({
      where: and(eq(taskCollaborators.taskId, taskId), eq(taskCollaborators.userId, userId)),
    });

    return {
      isOwner: false,
      isCollaborator: Boolean(member),
    };
  }
}
