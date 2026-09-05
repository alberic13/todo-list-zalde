import { request } from "./api";

export interface CalendarTokenData {
  token: string;
  path: string;
}

export const calendarService = {
  /**
   * Get user's calendar subscription token and path
   */
  async getCalendarToken(): Promise<CalendarTokenData> {
    return request<CalendarTokenData>("/api/calendar/token");
  },

  /**
   * Regenerate user's calendar subscription token
   */
  async regenerateCalendarToken(): Promise<CalendarTokenData> {
    return request<CalendarTokenData>("/api/calendar/regenerate", {
      method: "POST",
    });
  },

  /**
   * Generate 1-click Google Calendar URL for a specific task
   */
  generateGoogleCalendarUrl(task: {
    title: string;
    description?: string | null;
    dueDate?: string | null;
    priority?: string;
  }): string {
    if (!task.dueDate) return "";

    const startDate = new Date(task.dueDate);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

    const formatGCalDate = (date: Date) =>
      date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

    const datesParam = `${formatGCalDate(startDate)}/${formatGCalDate(endDate)}`;
    const priorityLabel = task.priority === "urgent" ? "[URGENT] " : task.priority === "high" ? "[HIGH] " : "";
    const title = `${priorityLabel}${task.title}`;
    const details = task.description || `Tugas dari Zalde Todo AI | Prioritas: ${task.priority || "Normal"}`;

    const baseUrl = "https://calendar.google.com/calendar/render";
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      dates: datesParam,
      details: details,
    });

    return `${baseUrl}?${params.toString()}`;
  },

  /**
   * Convert HTTP feed URL to Webcal protocol URL (for Apple Calendar & native OS)
   */
  getWebcalUrl(httpFeedUrl: string): string {
    return httpFeedUrl.replace(/^https?:\/\//i, "webcal://");
  },

  /**
   * Generate 1-click Google Calendar subscription URL via web
   */
  getGoogleCalendarSubscribeUrl(httpFeedUrl: string): string {
    return `https://calendar.google.com/calendar/r/settings/addbyurl?url=${encodeURIComponent(
      httpFeedUrl
    )}`;
  },
};
