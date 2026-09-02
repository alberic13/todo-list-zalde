import { eq, and } from "drizzle-orm";
import { db } from "../config/db";
import { categories } from "../models/schema";

export class CategoryService {
  static async listByUser(userId: string) {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(categories.name);
  }

  static async create(userId: string, name: string, colorHex?: string) {
    const [created] = await db
      .insert(categories)
      .values({
        userId,
        name: name.trim(),
        colorHex: colorHex || "#6366f1",
      })
      .returning();
    return created;
  }

  static async delete(id: string, userId: string) {
    const [deleted] = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();
    return deleted || null;
  }
}
