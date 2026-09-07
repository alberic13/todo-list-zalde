import { and, asc, desc, isNotNull, lte, ne } from "drizzle-orm";
import { db } from "../config/db";
import { tasks } from "../models/schema";
import { EmailService } from "./email.service";
import { getJakartaDateBounds, JakartaDateBounds } from "../utils/dateBounds";
import { ReminderGrouperService } from "./reminderGrouper.service";
import { DailyReminderSummary } from "./reminder.types";

export * from "./reminder.types";
export type { JakartaDateBounds } from "../utils/dateBounds";

// ponytail: daily reminder orchestrator. timezone math in dateBounds, task categorization in reminderGrouper.
export class ReminderService {
  static getJakartaDateBounds(referenceDate = new Date()): JakartaDateBounds {
    return getJakartaDateBounds(referenceDate);
  }

  static async processDailyReminders(referenceDate = new Date()): Promise<DailyReminderSummary> {
    const bounds = this.getJakartaDateBounds(referenceDate);

    console.log(`[Cron Daily Reminder] Starting for date: ${bounds.jakartaDateStr} (${bounds.dateFormatted})`);
    console.log(`[Cron Daily Reminder] Window UTC: ${bounds.startOfJakartaDay.toISOString()} -> ${bounds.endOfH3JakartaDay.toISOString()}`);

    const pendingTasks = await db.query.tasks.findMany({
      where: and(
        ne(tasks.status, "done"),
        isNotNull(tasks.dueDate),
        lte(tasks.dueDate, bounds.endOfH3JakartaDay)
      ),
      with: {
        category: true,
        subtasks: true,
        user: true,
      },
      orderBy: [asc(tasks.dueDate), desc(tasks.priority)],
    });

    console.log(`[Cron Daily Reminder] Found ${pendingTasks.length} candidate tasks within H-3 window.`);

    const userGroups = ReminderGrouperService.group(pendingTasks, bounds);

    const summary: DailyReminderSummary = {
      date: bounds.jakartaDateStr,
      totalUsersChecked: userGroups.size,
      totalEmailsSent: 0,
      totalDueTodayTasks: 0,
      totalOverdueTasks: 0,
      totalUpcomingTasks: 0,
      errors: [],
    };

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
          dateFormatted: bounds.dateFormatted,
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
