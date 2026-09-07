import { eq, asc } from "drizzle-orm";
import { db } from "../config/db";
import { taskMessages, users } from "../models/schema";
import { TaskAccessService } from "./taskAccess.service";

// ponytail: task discussion chat messages. authorization handled via TaskAccessService.
export class TaskDiscussionService {
  /**
   * Retrieves messages for a task
   */
  static async getMessages(taskId: string, userId: string, limit = 50) {
    const access = await TaskAccessService.checkAccess(taskId, userId);
    if (!access.isCollaborator) {
      throw new Error("Akses ditolak: Anda bukan anggota tugas ini.");
    }

    const messages = await db.query.taskMessages.findMany({
      where: eq(taskMessages.taskId, taskId),
      with: {
        user: {
          columns: { id: true, name: true, email: true },
        },
      },
      orderBy: [asc(taskMessages.createdAt)],
      limit,
    });

    return messages;
  }

  /**
   * Sends a message in a task discussion room
   */
  static async sendMessage(taskId: string, userId: string, content: string) {
    const access = await TaskAccessService.checkAccess(taskId, userId);
    if (!access.isCollaborator) {
      throw new Error("Akses ditolak: Anda bukan anggota tugas ini.");
    }

    const cleanContent = content.trim();
    if (!cleanContent) {
      throw new Error("Isi pesan tidak boleh kosong.");
    }

    const [newMsg] = await db
      .insert(taskMessages)
      .values({
        taskId,
        userId,
        content: cleanContent,
      })
      .returning();

    const sender = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, name: true, email: true },
    });

    return {
      ...newMsg,
      user: sender || { id: userId, name: "User", email: "" },
    };
  }
}
