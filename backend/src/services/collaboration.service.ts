import { eq, and, desc, asc, inArray } from "drizzle-orm";
import { db } from "../config/db";
import { tasks, taskCollaborators, taskMessages, users } from "../models/schema";
import crypto from "crypto";

export class CollaborationService {
  /**
   * Checks if user is owner or collaborator of task
   */
  static async checkAccess(taskId: string, userId: string): Promise<{ isOwner: boolean; isCollaborator: boolean }> {
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

  /**
   * Generates or retrieves unique shareable invite code for a task (Owner only)
   */
  static async getOrCreateInviteCode(taskId: string, userId: string): Promise<{ inviteCode: string }> {
    const task = await db.query.tasks.findFirst({
      where: and(eq(tasks.id, taskId), eq(tasks.userId, userId)),
    });

    if (!task) {
      throw new Error("Tugas tidak ditemukan atau Anda bukan pemilik tugas.");
    }

    if (task.inviteCode) {
      return { inviteCode: task.inviteCode };
    }

    // Generate unique 10-char alphanumeric code
    const inviteCode = crypto.randomBytes(5).toString("hex");

    await db
      .update(tasks)
      .set({ inviteCode })
      .where(eq(tasks.id, taskId));

    return { inviteCode };
  }

  /**
   * Joins a task using invite code
   */
  static async joinTaskByInviteCode(inviteCode: string, userId: string) {
    const cleanCode = inviteCode.trim();
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.inviteCode, cleanCode),
      with: {
        user: {
          columns: { id: true, name: true, email: true },
        },
      },
    });

    if (!task) {
      throw new Error("Tautan undangan tidak valid atau tugas sudah tidak tersedia.");
    }

    // If user is already owner
    if (task.userId === userId) {
      return {
        task,
        message: "Anda adalah pemilik tugas ini.",
        alreadyJoined: true,
      };
    }

    // Check if already a collaborator
    const existing = await db.query.taskCollaborators.findFirst({
      where: and(eq(taskCollaborators.taskId, task.id), eq(taskCollaborators.userId, userId)),
    });

    if (!existing) {
      await db.insert(taskCollaborators).values({
        taskId: task.id,
        userId,
        role: "collaborator",
      });

      await db
        .update(tasks)
        .set({ updatedAt: new Date() })
        .where(eq(tasks.id, task.id));
    }

    return {
      task,
      message: "Berhasil bergabung ke tugas kolaborasi.",
      alreadyJoined: Boolean(existing),
    };
  }

  /**
   * Retrieves all members of a task (owner + collaborators)
   */
  static async getCollaborators(taskId: string, userId: string) {
    const access = await this.checkAccess(taskId, userId);
    if (!access.isCollaborator) {
      throw new Error("Akses ditolak: Anda bukan anggota tugas ini.");
    }

    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
      with: {
        user: {
          columns: { id: true, name: true, email: true },
        },
      },
    });

    if (!task) throw new Error("Tugas tidak ditemukan.");

    const rawCollaborators = await db.query.taskCollaborators.findMany({
      where: eq(taskCollaborators.taskId, taskId),
      with: {
        user: {
          columns: { id: true, name: true, email: true },
        },
      },
      orderBy: [asc(taskCollaborators.joinedAt)],
    });

    const members = [
      {
        id: task.user.id,
        userId: task.user.id,
        name: task.user.name,
        email: task.user.email,
        role: "owner",
        isOwner: true,
        user: {
          id: task.user.id,
          name: task.user.name,
          email: task.user.email,
        },
      },
      ...rawCollaborators.map((c) => ({
        id: c.id,
        userId: c.user.id,
        name: c.user.name,
        email: c.user.email,
        role: c.role,
        isOwner: false,
        joinedAt: c.joinedAt,
        user: {
          id: c.user.id,
          name: c.user.name,
          email: c.user.email,
        },
      })),
    ];

    return members;
  }

  /**
   * Removes collaborator from task (Owner can kick, collaborator can leave)
   */
  static async removeCollaborator(taskId: string, targetUserId: string, requestingUserId: string) {
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    });

    if (!task) throw new Error("Tugas tidak ditemukan.");

    const isOwner = task.userId === requestingUserId;
    const isSelfLeaving = targetUserId === requestingUserId;

    if (!isOwner && !isSelfLeaving) {
      throw new Error("Hanya pemilik tugas yang dapat mengeluarkan kolaborator.");
    }

    if (targetUserId === task.userId) {
      throw new Error("Pemilik tugas tidak dapat keluar dari tugas miliknya.");
    }

    await db
      .delete(taskCollaborators)
      .where(and(eq(taskCollaborators.taskId, taskId), eq(taskCollaborators.userId, targetUserId)));

    await db
      .update(tasks)
      .set({ updatedAt: new Date() })
      .where(eq(tasks.id, taskId));

    return { success: true, message: isSelfLeaving ? "Anda telah keluar dari tugas ini." : "Kolaborator berhasil dihapus." };
  }

  /**
   * Retrieves messages for a task
   */
  static async getMessages(taskId: string, userId: string, limit = 50) {
    const access = await this.checkAccess(taskId, userId);
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
    const access = await this.checkAccess(taskId, userId);
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
