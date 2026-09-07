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
  totalUpcomingTasks: number;
  errors: Array<{ userId: string; email: string; error: string }>;
}

export class ReminderService {
  /**
   * Calculate start, end, and 3-days-ahead (H-3) UTC timestamps corresponding to Asia/Jakarta (WIB = UTC+7)
   */
  static getJakartaDateBounds(referenceDate = new Date()): {
    startOfJakartaDay: Date;
    endOfJakartaDay: Date;
    endOfH3JakartaDay: Date;
    year: number;
    month: number;
    day: number;
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
    // 00:00:00.000 WIB today
    const startOfJakartaDay = new Date(
      Date.UTC(year, month - 1, day, 0, 0, 0, 0) - 7 * 60 * 60 * 1000
    );
    // 23:59:59.999 WIB today
    const endOfJakartaDay = new Date(
      Date.UTC(year, month - 1, day, 23, 59, 59, 999) - 7 * 60 * 60 * 1000
    );
    // 23:59:59.999 WIB 3 days later (H-3 window)
    const endOfH3JakartaDay = new Date(
      Date.UTC(year, month - 1, day + 3, 23, 59, 59, 999) - 7 * 60 * 60 * 1000
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
      endOfH3JakartaDay,
      year,
      month,
      day,
      jakartaDateStr,
      dateFormatted,
    };
  }

  /**
   * Main cron job processor to scan and dispatch daily task reminder emails (Due Today, Overdue, H-3 Upcoming)
   */
  static async processDailyReminders(referenceDate = new Date()): Promise<DailyReminderSummary> {
    const {
      startOfJakartaDay,
      endOfJakartaDay,
      endOfH3JakartaDay,
      year,
      month,
      day,
      jakartaDateStr,
      dateFormatted,
    } = this.getJakartaDateBounds(referenceDate);

    console.log(`[Cron Daily Reminder] Starting for date: ${jakartaDateStr} (${dateFormatted})`);
    console.log(`[Cron Daily Reminder] Window UTC: ${startOfJakartaDay.toISOString()} -> ${endOfH3JakartaDay.toISOString()}`);

    // Query uncompleted tasks with dueDate up to 3 days ahead in Jakarta (including overdue)
    const pendingTasks = await db.query.tasks.findMany({
      where: and(
        ne(tasks.status, "done"),
        isNotNull(tasks.dueDate),
        lte(tasks.dueDate, endOfH3JakartaDay)
      ),
      with: {
        category: true,
        subtasks: true,
        user: true,
      },
      orderBy: [asc(tasks.dueDate), desc(tasks.priority)],
    });

    console.log(`[Cron Daily Reminder] Found ${pendingTasks.length} candidate tasks within H-3 window.`);

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
        upcomingTasks: Array<{
          id: string;
          title: string;
          priority: string;
          categoryName?: string | null;
          categoryColor?: string | null;
          dueDateFormatted?: string | null;
          daysRemaining: number;
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
          upcomingTasks: [],
        });
      }

      const group = userGroups.get(t.userId)!;
      const dueDate = new Date(t.dueDate!);
      const isDueToday = dueDate >= startOfJakartaDay && dueDate <= endOfJakartaDay;
      const isOverdue = dueDate < startOfJakartaDay;
      const isUpcoming = dueDate > endOfJakartaDay && dueDate <= endOfH3JakartaDay;

      const completedSubtasks = (t.subtasks || []).filter((s) => s.isCompleted).length;
      const totalSubtasks = (t.subtasks || []).length;

      const baseItem = {
        id: t.id,
        title: t.title,
        priority: t.priority,
        categoryName: t.category?.name || null,
        categoryColor: t.category?.colorHex || null,
        completedSubtasks,
        totalSubtasks,
      };

      if (isDueToday) {
        group.dueTodayTasks.push({
          ...baseItem,
          dueDateFormatted: "Hari Ini",
        });
      } else if (isOverdue) {
        group.overdueTasks.push({
          ...baseItem,
          dueDateFormatted: taskDateFormatter.format(dueDate),
        });
      } else if (isUpcoming) {
        const taskDateJakartaStr = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Jakarta",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(dueDate);

        const [tYear, tMonth, tDay] = taskDateJakartaStr.split("-").map(Number);
        const todayUtc = Date.UTC(year, month - 1, day);
        const taskUtc = Date.UTC(tYear, tMonth - 1, tDay);
        const diffDays = Math.round((taskUtc - todayUtc) / (24 * 60 * 60 * 1000));
        const daysRemaining = Math.max(1, diffDays);

        group.upcomingTasks.push({
          ...baseItem,
          dueDateFormatted: `${taskDateFormatter.format(dueDate)} (${
            daysRemaining === 1 ? "Besok / H-1" : `H-${daysRemaining}`
          })`,
          daysRemaining,
        });
      }
    }

    const summary: DailyReminderSummary = {
      date: jakartaDateStr,
      totalUsersChecked: userGroups.size,
      totalEmailsSent: 0,
      totalDueTodayTasks: 0,
      totalOverdueTasks: 0,
      totalUpcomingTasks: 0,
      errors: [],
    };

    // Dispatch email to each eligible user
    for (const [userId, group] of userGroups) {
      if (
        group.dueTodayTasks.length === 0 &&
        group.overdueTasks.length === 0 &&
        group.upcomingTasks.length === 0
      ) {
        continue;
      }

      summary.totalDueTodayTasks += group.dueTodayTasks.length;
      summary.totalOverdueTasks += group.overdueTasks.length;
      summary.totalUpcomingTasks += group.upcomingTasks.length;

      try {
        await EmailService.sendDailyTaskReminderEmail({
          to: group.user.email,
          name: group.user.name,
          dateFormatted,
          dueTodayTasks: group.dueTodayTasks,
          overdueTasks: group.overdueTasks,
          upcomingTasks: group.upcomingTasks,
        });

        summary.totalEmailsSent++;
        console.log(
          `[Cron Daily Reminder] Email dispatched to ${group.user.email} (${group.dueTodayTasks.length} today, ${group.overdueTasks.length} overdue, ${group.upcomingTasks.length} H-3)`
        );
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
