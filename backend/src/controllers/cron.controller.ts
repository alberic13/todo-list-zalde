import { Elysia } from "elysia";
import { env } from "../config/env";
import { ReminderService } from "../services/reminder.service";
import { successResponse, errorResponse } from "../utils/response";

export const cronController = new Elysia({ prefix: "/api/cron" })
  /**
   * GET /api/cron/daily-reminder
   * Triggered by Vercel Cron at 17:00 UTC (00:00 WIB midnight)
   */
  .get(
    "/daily-reminder",
    async ({ headers, set }) => {
      // Validate Authorization header if CRON_SECRET is configured
      if (env.CRON_SECRET) {
        const authHeader = headers["authorization"] || "";
        const expectedAuth = `Bearer ${env.CRON_SECRET}`;

        if (authHeader !== expectedAuth) {
          set.status = 401;
          return errorResponse("Unauthorized: Invalid or missing CRON_SECRET bearer token", 401);
        }
      }

      try {
        const summary = await ReminderService.processDailyReminders();
        return successResponse(summary, "Daily task reminders processed successfully");
      } catch (err: any) {
        console.error("[Cron Daily Reminder Error]", err);
        set.status = 500;
        return errorResponse(err.message || "Failed to process daily task reminders", 500);
      }
    },
    {
      detail: {
        tags: ["Cron"],
        summary: "Process daily task reminder emails (00:00 WIB / 17:00 UTC)",
        description:
          "Scans pending tasks due today or overdue in Asia/Jakarta timezone and dispatches summary emails via Nodemailer.",
      },
    }
  );
