import { and, asc, desc, isNotNull, lte, ne } from "drizzle-orm";
import { db } from "../config/db";
import { tasks } from "../models/schema";
import { EmailService } from "./email.service";

export interface DailyReminderSummary {
  date: string;
  totalUsersChecked: number;
  totalEmailsSent: number;
  totalDueTodayTasks: number;
  totalOverdueTasks: number;
  errors: Array<{ userId: string; email: string; error: string }>;
}

export class ReminderService {
  /**
   * Calculate start and end UTC timestamps corresponding to the current date in Asia/Jakarta (WIB = UTC+7)
   */
  static getJakartaDateBounds(referenceDate = new Date()): {
    startOfJakartaDay: Date;
    endOfJakartaDay: Date;
    jakartaDateStr: string;
    dateFormatted: string;
  } {
    // Format YYYY-MM-DD in Asia/Jakarta
    const jakartaDateStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(referenceDate);

    const [year, month, day] = jakartaDateStr.split("-").map(Number);

    // Asia/Jakarta is strictly UTC+7 without DST (UTC = WIB - 7 hours)
    // 00:00:00.000 WIB
    const startOfJakartaDay = new Date(
      Date.UTC(year, month - 1, day, 0, 0, 0, 0) - 7 * 60 * 60 * 1000
    );
    // 23:59:59.999 WIB
    const endOfJakartaDay = new Date(
      Date.UTC(year, month - 1, day, 23, 59, 59, 999) - 7 * 60 * 60 * 1000
    );

    const dateFormatted = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(referenceDate);

    return {
      startOfJakartaDay,
      endOfJakartaDay,
      jakartaDateStr,
      dateFormatted,
    };
  }

  /**
   * Main cron job processor to scan and dispatch daily task reminder emails
   */
  static async processDailyReminders(referenceDate = new Date()): Promise<DailyReminderSummary> {
    const { startOfJakartaDay, endOfJakartaDay, jakartaDateStr, dateFormatted } =
      this.getJakartaDateBounds(referenceDate);

    console.log(`[Cron Daily Reminder] Starting for date: ${jakartaDateStr} (${dateFormatted})`);
    console.log(`[Cron Daily Reminder] Bounds UTC: ${startOfJakartaDay.toISOString()} -> ${endOfJakartaDay.toISOString()}`);

    // Query all uncompleted tasks that have a dueDate up to end of today in Jakarta
    const pendingTasks = await db.query.tasks.findMany({
      where: and(
        ne(tasks.status, "done"),
        isNotNull(tasks.dueDate),
        lte(tasks.dueDate, endOfJakartaDay)
      ),
      with: {
        category: true,
        subtasks: true,
        user: true,
      },
      orderBy: [asc(tasks.dueDate), desc(tasks.priority)],
    });

    console.log(`[Cron Daily Reminder] Found ${pendingTasks.length} candidate tasks needing attention.`);

    // Group tasks by user
    const userGroups = new Map<
      string,
      {
        user: { id: string; email: string; name: string };
        dueTodayTasks: Array<{
          id: string;
          title: string;
          priority: string;
          categoryName?: string | null;
          categoryColor?: string | null;
          dueDateFormatted?: string | null;
          completedSubtasks: number;
          totalSubtasks: number;
        }>;
        overdueTasks: Array<{
          id: string;
          title: string;
          priority: string;
          categoryName?: string | null;
          categoryColor?: string | null;
          dueDateFormatted?: string | null;
          completedSubtasks: number;
          totalSubtasks: number;
        }>;
      }
    >();

    const taskDateFormatter = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "numeric",
      month: "short",
    });

    for (const t of pendingTasks) {
      if (!t.user || !t.user.email) continue;

      if (!userGroups.has(t.userId)) {
        userGroups.set(t.userId, {
          user: {
            id: t.user.id,
            email: t.user.email,
            name: t.user.name || "Pengguna",
          },
          dueTodayTasks: [],
          overdueTasks: [],
        });
      }

      const group = userGroups.get(t.userId)!;
      const dueDate = new Date(t.dueDate!);
      const isDueToday = dueDate >= startOfJakartaDay && dueDate <= endOfJakartaDay;
      const isOverdue = dueDate < startOfJakartaDay;

      const completedSubtasks = (t.subtasks || []).filter((s) => s.isCompleted).length;
      const totalSubtasks = (t.subtasks || []).length;

      const item = {
        id: t.id,
        title: t.title,
        priority: t.priority,
        categoryName: t.category?.name || null,
        categoryColor: t.category?.colorHex || null,
        dueDateFormatted: isDueToday ? "Hari Ini" : taskDateFormatter.format(dueDate),
        completedSubtasks,
        totalSubtasks,
      };

      if (isDueToday) {
        group.dueTodayTasks.push(item);
      } else if (isOverdue) {
        group.overdueTasks.push(item);
      }
    }

    const summary: DailyReminderSummary = {
      date: jakartaDateStr,
      totalUsersChecked: userGroups.size,
      totalEmailsSent: 0,
      totalDueTodayTasks: 0,
      totalOverdueTasks: 0,
      errors: [],
    };

    // Dispatch email to each eligible user
    for (const [userId, group] of userGroups) {
      if (group.dueTodayTasks.length === 0 && group.overdueTasks.length === 0) {
        continue;
      }

      summary.totalDueTodayTasks += group.dueTodayTasks.length;
      summary.totalOverdueTasks += group.overdueTasks.length;

      try {
        await EmailService.sendDailyTaskReminderEmail({
          to: group.user.email,
          name: group.user.name,
          dateFormatted,
          dueTodayTasks: group.dueTodayTasks,
          overdueTasks: group.overdueTasks,
        });

        summary.totalEmailsSent++;
        console.log(`[Cron Daily Reminder] Email dispatched to ${group.user.email} (${group.dueTodayTasks.length} today, ${group.overdueTasks.length} overdue)`);
      } catch (err: any) {
        console.error(`[Cron Daily Reminder] Failed to send to ${group.user.email}:`, err);
        summary.errors.push({
          userId,
          email: group.user.email,
          error: err.message || String(err),
        });
      }
    }

    console.log(`[Cron Daily Reminder] Completed. Sent: ${summary.totalEmailsSent}/${summary.totalUsersChecked}`);
    return summary;
  }
}
