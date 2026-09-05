import { eq, and, inArray, isNotNull } from "drizzle-orm";
import { db } from "../config/db";
import { users, tasks } from "../models/schema";
import crypto from "crypto";

export class CalendarService {
  /**
   * Escape text according to RFC 5545 (iCalendar) specification
   */
  private static escapeIcsText(text: string): string {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r?\n/g, "\\n");
  }

  /**
   * Format Date to iCalendar UTC string format: YYYYMMDDTHHMMSSZ
   */
  private static formatIcsDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  }

  /**
   * Map todo priority to RFC 5545 PRIORITY (1-9)
   */
  private static mapPriorityToIcs(priority: string): number {
    switch (priority) {
      case "urgent":
        return 1;
      case "high":
        return 2;
      case "medium":
        return 5;
      case "low":
        return 9;
      default:
        return 5;
    }
  }

  /**
   * Get existing calendar token or generate a new one if not set
   */
  static async getOrCreateCalendarToken(userId: string): Promise<string> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, calendarToken: true },
    });

    if (!user) {
      throw new Error("Pengguna tidak ditemukan");
    }

    if (user.calendarToken) {
      return user.calendarToken;
    }

    const newToken = crypto.randomBytes(24).toString("hex");
    await db.update(users).set({ calendarToken: newToken }).where(eq(users.id, userId));
    return newToken;
  }

  /**
   * Regenerate a new calendar token for user
   */
  static async regenerateCalendarToken(userId: string): Promise<string> {
    const newToken = crypto.randomBytes(24).toString("hex");
    await db.update(users).set({ calendarToken: newToken }).where(eq(users.id, userId));
    return newToken;
  }

  /**
   * Generate RFC 5545 standard .ics file feed for a specific calendar token
   */
  static async generateIcsFeedByToken(token: string): Promise<string | null> {
    if (!token || token.trim().length === 0) return null;

    const user = await db.query.users.findFirst({
      where: eq(users.calendarToken, token),
    });

    if (!user) return null;

    // Fetch active tasks only (todo, in_progress) with dueDate
    const activeTasks = await db.query.tasks.findMany({
      where: and(
        eq(tasks.userId, user.id),
        inArray(tasks.status, ["todo", "in_progress"]),
        isNotNull(tasks.dueDate)
      ),
      with: {
        category: true,
        subtasks: true,
      },
      orderBy: (tasks, { asc }) => [asc(tasks.dueDate)],
    });

    const nowUtc = this.formatIcsDate(new Date());
    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Zalde Todo AI//Calendar Feed//ID",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${this.escapeIcsText(`Zalde Tasks - ${user.name}`)}`,
      "X-WR-CALDESC:Jadwal tugas aktif dan tenggat waktu dari Zalde Todo AI",
      "X-WR-TIMEZONE:UTC",
      "REFRESH-INTERVAL;VALUE=DURATION:PT15M",
      "X-PUBLISHED-TTL:PT15M",
    ];

    for (const task of activeTasks) {
      if (!task.dueDate) continue;

      const startDate = new Date(task.dueDate);
      // End date 1 hour after start date for calendar block representation
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

      const dtStart = this.formatIcsDate(startDate);
      const dtEnd = this.formatIcsDate(endDate);

      // Build readable description with subtasks checklist
      const descParts: string[] = [];
      if (task.description) {
        descParts.push(task.description);
        descParts.push("");
      }
      descParts.push(`Status: ${task.status.toUpperCase()}`);
      descParts.push(`Prioritas: ${task.priority.toUpperCase()}`);
      if (task.category) {
        descParts.push(`Kategori: ${task.category.name}`);
      }

      if (task.subtasks && task.subtasks.length > 0) {
        descParts.push("");
        descParts.push("Daftar Subtask:");
        for (const sub of task.subtasks) {
          descParts.push(`[${sub.isCompleted ? "✓" : " "}] ${sub.title}`);
        }
      }

      const priorityPrefix = task.priority === "urgent" ? "🔥 [URGENT] " : task.priority === "high" ? "⚡ [HIGH] " : "";
      const summary = `${priorityPrefix}${task.title}`;

      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${task.id}@zalde.app`);
      lines.push(`DTSTAMP:${nowUtc}`);
      lines.push(`DTSTART:${dtStart}`);
      lines.push(`DTEND:${dtEnd}`);
      lines.push(`SUMMARY:${this.escapeIcsText(summary)}`);
      lines.push(`DESCRIPTION:${this.escapeIcsText(descParts.join("\n"))}`);
      lines.push(`PRIORITY:${this.mapPriorityToIcs(task.priority)}`);
      lines.push("STATUS:CONFIRMED");
      if (task.category) {
        lines.push(`CATEGORIES:${this.escapeIcsText(task.category.name)}`);
      }
      lines.push("TRANSP:OPAQUE");
      lines.push("END:VEVENT");
    }

    lines.push("END:VCALENDAR");

    // RFC 5545 requires CRLF line endings
    return lines.join("\r\n");
  }
}
