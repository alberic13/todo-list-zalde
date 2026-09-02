import { eq } from "drizzle-orm";
import { db } from "../config/db";
import { tasks, taskEmbeddings, categories } from "../models/schema";
import { GeminiClient } from "../config/ai";

export class EmbeddingService {
  /**
   * Constructs standardized textual chunk for vector representation
   */
  static buildChunk(task: {
    title: string;
    description?: string | null;
    status: string;
    priority: string;
    categoryName?: string | null;
  }): string {
    const parts = [
      `Title: ${task.title}`,
      task.description ? `Description: ${task.description}` : null,
      task.categoryName ? `Category: ${task.categoryName}` : null,
      `Priority: ${task.priority}`,
      `Status: ${task.status}`,
    ].filter(Boolean);

    return parts.join(" | ");
  }

  /**
   * Generates embedding and upserts into task_embeddings table
   */
  static async syncTaskEmbedding(taskId: string, userId: string): Promise<void> {
    try {
      // 1. Fetch task details with category
      const task = await db.query.tasks.findFirst({
        where: eq(tasks.id, taskId),
        with: { category: true },
      });

      if (!task) return;

      // 2. Build text chunk
      const contentChunk = this.buildChunk({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        categoryName: task.category?.name,
      });

      // 3. Generate embedding vector (768 dimensions)
      const embeddingVector = await GeminiClient.generateEmbedding(contentChunk);

      // 4. Check if embedding row already exists
      const existing = await db
        .select({ id: taskEmbeddings.id })
        .from(taskEmbeddings)
        .where(eq(taskEmbeddings.taskId, taskId))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(taskEmbeddings)
          .set({
            embedding: embeddingVector,
            contentChunk,
            updatedAt: new Date(),
          })
          .where(eq(taskEmbeddings.taskId, taskId));
      } else {
        await db.insert(taskEmbeddings).values({
          taskId,
          userId,
          embedding: embeddingVector,
          contentChunk,
        });
      }
    } catch (err) {
      console.error(`[EmbeddingService] Failed to sync embedding for task ${taskId}:`, err);
    }
  }

  /**
   * Removes embedding when task is deleted
   */
  static async removeTaskEmbedding(taskId: string): Promise<void> {
    try {
      await db.delete(taskEmbeddings).where(eq(taskEmbeddings.taskId, taskId));
    } catch (err) {
      console.error(`[EmbeddingService] Failed to remove embedding for task ${taskId}:`, err);
    }
  }
}
