export interface DailyReminderSummary {
  date: string;
  totalUsersChecked: number;
  totalEmailsSent: number;
  totalDueTodayTasks: number;
  totalOverdueTasks: number;
  totalUpcomingTasks: number;
  errors: Array<{ userId: string; email: string; error: string }>;
}

export interface ReminderTaskItem {
  id: string;
  title: string;
  priority: string;
  categoryName?: string | null;
  categoryColor?: string | null;
  dueDateFormatted?: string | null;
  completedSubtasks: number;
  totalSubtasks: number;
  daysRemaining?: number;
}

export interface UserReminderGroup {
  user: { id: string; email: string; name: string };
  dueTodayTasks: ReminderTaskItem[];
  overdueTasks: ReminderTaskItem[];
  upcomingTasks: ReminderTaskItem[];
}
