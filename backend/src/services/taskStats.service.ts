import { eq, sql } from "drizzle-orm";
import { db } from "../config/db";
import { tasks } from "../models/schema";

export class TaskStatsService {
  static async get(userId: string) {
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
}
