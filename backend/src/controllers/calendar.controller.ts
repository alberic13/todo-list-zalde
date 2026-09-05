import { Elysia, t } from "elysia";
import { CalendarService } from "../services/calendar.service";
import { requireAuth } from "../middlewares/auth.middleware";
import { successResponse, errorResponse } from "../utils/response";

export const calendarController = new Elysia({ prefix: "/api/calendar" })
  // 1. Public iCal / Webcal Subscription Feed (RFC 5545)
  .get(
    "/feed/:token",
    async ({ params, set }) => {
      const rawToken = params.token;
      // Strip optional .ics extension if user/calendar client requested .../feed/:token.ics
      const cleanToken = rawToken.replace(/\.ics$/i, "").trim();

      const icsContent = await CalendarService.generateIcsFeedByToken(cleanToken);

      if (!icsContent) {
        set.status = 404;
        set.headers["Content-Type"] = "text/plain; charset=utf-8";
        return "Kalender tidak ditemukan atau tautan langganan telah direset.";
      }

      set.headers["Content-Type"] = "text/calendar; charset=utf-8";
      set.headers["Content-Disposition"] = 'inline; filename="zalde-tasks.ics"';
      set.headers["Cache-Control"] = "no-cache, no-store, max-age=0, must-revalidate";
      set.headers["Pragma"] = "no-cache";

      return icsContent;
    },
    {
      params: t.Object({
        token: t.String(),
      }),
      detail: {
        tags: ["Calendar"],
        summary: "Live iCalendar RFC 5545 feed (.ics / webcal)",
        description: "Public encrypted URL for calendar subscription (Google Calendar, Apple Calendar, Outlook)",
      },
    }
  )

  // 2. Authenticated Endpoints for Managing User's Calendar Link
  .use(requireAuth)
  // GET /api/calendar/token
  .get(
    "/token",
    async ({ user }) => {
      try {
        const token = await CalendarService.getOrCreateCalendarToken(user.id);
        return successResponse(
          {
            token,
            path: `/api/calendar/feed/${token}.ics`,
          },
          "Calendar token retrieved"
        );
      } catch (err: any) {
        return errorResponse(err.message || "Failed to retrieve calendar token");
      }
    },
    {
      detail: {
        tags: ["Calendar"],
        summary: "Get current user's live calendar subscription token",
      },
    }
  )

  // POST /api/calendar/regenerate
  .post(
    "/regenerate",
    async ({ user }) => {
      try {
        const token = await CalendarService.regenerateCalendarToken(user.id);
        return successResponse(
          {
            token,
            path: `/api/calendar/feed/${token}.ics`,
          },
          "New calendar token generated"
        );
      } catch (err: any) {
        return errorResponse(err.message || "Failed to regenerate calendar token");
      }
    },
    {
      detail: {
        tags: ["Calendar"],
        summary: "Regenerate calendar token to revoke previous subscription links",
      },
    }
  );
