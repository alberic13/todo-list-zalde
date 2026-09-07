import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { app } from "../src/index";
import { ReminderService } from "../src/services/reminder.service";
import { env } from "../src/config/env";
import { db } from "../src/config/db";
import { users, tasks } from "../src/models/schema";
import { eq } from "drizzle-orm";

describe("Cron Daily Task Reminder (00:00 WIB / 17:00 UTC)", () => {
  const originalCronSecret = env.CRON_SECRET;
  let testUserId = "";
  const testUserEmail = `cron_test_${Date.now()}@example.com`;

  beforeEach(() => {
    env.CRON_SECRET = "test_cron_secret_12345";
  });

  afterEach(async () => {
    env.CRON_SECRET = originalCronSecret;
    if (testUserId) {
      await db.delete(tasks).where(eq(tasks.userId, testUserId)).catch(() => {});
      await db.delete(users).where(eq(users.id, testUserId)).catch(() => {});
    }
  });

  it("should calculate correct UTC bounds for Asia/Jakarta timezone", () => {
    // Reference date: 2026-09-07 17:00:00 UTC (which is 2026-09-08 00:00:00 WIB)
    const refDate = new Date("2026-09-07T17:00:00.000Z");
    const bounds = ReminderService.getJakartaDateBounds(refDate);

    expect(bounds.jakartaDateStr).toBe("2026-09-08");

    // Start of 2026-09-08 WIB in UTC must be 2026-09-07T17:00:00.000Z
    expect(bounds.startOfJakartaDay.toISOString()).toBe("2026-09-07T17:00:00.000Z");

    // End of 2026-09-08 WIB in UTC must be 2026-09-08T16:59:59.999Z
    expect(bounds.endOfJakartaDay.toISOString()).toBe("2026-09-08T16:59:59.999Z");
  });

  it("should reject cron requests without valid CRON_SECRET authorization", async () => {
    const res = await app.handle(
      new Request("http://localhost:3001/api/cron/daily-reminder", {
        method: "GET",
      })
    );

    expect(res.status).toBe(401);
    const data: any = await res.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain("CRON_SECRET");
  });

  it("should reject cron requests with incorrect bearer token", async () => {
    const res = await app.handle(
      new Request("http://localhost:3001/api/cron/daily-reminder", {
        method: "GET",
        headers: {
          Authorization: "Bearer wrong_token",
        },
      })
    );

    expect(res.status).toBe(401);
  });

  it("should accept cron requests with matching CRON_SECRET and execute reminders", async () => {
    // 1. Create a temporary verified user with due tasks
    const [user] = await db
      .insert(users)
      .values({
        email: testUserEmail,
        name: "Tester Cron",
        passwordHash: "dummyhash",
        isVerified: true,
      })
      .returning();

    testUserId = user.id;

    const bounds = ReminderService.getJakartaDateBounds(new Date());

    // Task 1: Due Today (WIB)
    await db.insert(tasks).values({
      userId: testUserId,
      title: "Tugas Deadline Hari Ini",
      status: "todo",
      priority: "urgent",
      dueDate: new Date(bounds.startOfJakartaDay.getTime() + 2 * 3600 * 1000), // +2h from WIB midnight
    });

    // Task 2: Overdue
    await db.insert(tasks).values({
      userId: testUserId,
      title: "Tugas Lewat Deadline",
      status: "in_progress",
      priority: "high",
      dueDate: new Date(bounds.startOfJakartaDay.getTime() - 24 * 3600 * 1000), // yesterday
    });

    // Task 3: Upcoming H-2 (2 days ahead)
    await db.insert(tasks).values({
      userId: testUserId,
      title: "Tugas Deadline H-2",
      status: "todo",
      priority: "medium",
      dueDate: new Date(bounds.startOfJakartaDay.getTime() + 48 * 3600 * 1000), // +48h
    });

    // 2. Call endpoint with valid Authorization
    const res = await app.handle(
      new Request("http://localhost:3001/api/cron/daily-reminder", {
        method: "GET",
        headers: {
          Authorization: "Bearer test_cron_secret_12345",
        },
      })
    );

    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.totalUsersChecked).toBeGreaterThanOrEqual(1);
    expect(data.data.totalEmailsSent).toBeGreaterThanOrEqual(1);
    expect(data.data.totalDueTodayTasks).toBeGreaterThanOrEqual(1);
    expect(data.data.totalOverdueTasks).toBeGreaterThanOrEqual(1);
    expect(data.data.totalUpcomingTasks).toBeGreaterThanOrEqual(1);
  }, 20000);
});
