import { JakartaDateBounds } from "../utils/dateBounds";
import { UserReminderGroup } from "./reminder.types";

export class ReminderGrouperService {
  static group(pendingTasks: any[], bounds: JakartaDateBounds): Map<string, UserReminderGroup> {
    const userGroups = new Map<string, UserReminderGroup>();
    const taskDateFormatter = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "numeric",
      month: "short",
    });

    for (const t of pendingTasks) {
      if (!t.user?.email) continue;

      if (!userGroups.has(t.userId)) {
        userGroups.set(t.userId, {
          user: { id: t.user.id, email: t.user.email, name: t.user.name || "Pengguna" },
          dueTodayTasks: [],
          overdueTasks: [],
          upcomingTasks: [],
        });
      }

      const group = userGroups.get(t.userId)!;
      const dueDate = new Date(t.dueDate!);
      const isDueToday = dueDate >= bounds.startOfJakartaDay && dueDate <= bounds.endOfJakartaDay;
      const isOverdue = dueDate < bounds.startOfJakartaDay;
      const isUpcoming = dueDate > bounds.endOfJakartaDay && dueDate <= bounds.endOfH3JakartaDay;

      const completedSubtasks = (t.subtasks || []).filter((s: any) => s.isCompleted).length;
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
        group.dueTodayTasks.push({ ...baseItem, dueDateFormatted: "Hari Ini" });
      } else if (isOverdue) {
        group.overdueTasks.push({ ...baseItem, dueDateFormatted: taskDateFormatter.format(dueDate) });
      } else if (isUpcoming) {
        const taskDateJakartaStr = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Jakarta",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(dueDate);

        const [tYear, tMonth, tDay] = taskDateJakartaStr.split("-").map(Number);
        const todayUtc = Date.UTC(bounds.year, bounds.month - 1, bounds.day);
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

    return userGroups;
  }
}
