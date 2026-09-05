process.env.NODE_ENV = "test";
import { describe, expect, it } from "bun:test";
import { successResponse, errorResponse } from "../src/utils/response";
import { app } from "../src/index";

const rawDbUrl = (process.env.DATABASE_URL || "").trim();
const hasDatabase = Boolean(
  rawDbUrl.length > 0 &&
  rawDbUrl.startsWith("postgres") &&
  !rawDbUrl.includes("your_") &&
  rawDbUrl !== "postgresql://postgres:postgres@localhost:5432/zalde_todo"
);

describe("API & Response Formatting Tests", () => {
  it("should format standardized success response", () => {
    const res = successResponse({ id: "123", name: "Zalde" }, "Success");
    expect(res.success).toBe(true);
    expect(res.message).toBe("Success");
    expect(res.data).toEqual({ id: "123", name: "Zalde" });
    expect(res.errors).toBeNull();
  });

  it("should format standardized error response", () => {
    const res = errorResponse("Invalid input", { field: "email" });
    expect(res.success).toBe(false);
    expect(res.message).toBe("Invalid input");
    expect(res.data).toBeNull();
    expect(res.errors).toEqual({ field: "email" });
  });

  it("should return healthy status from root endpoint", async () => {
    const response = await app.handle(new Request("http://localhost:3001/"));
    expect(response.status).toBe(200);

    const data: any = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe("Zalde Todo AI API");
    expect(data.data.status).toBe("online");
  });

  it("should reject unauthorized requests to protected routes", async () => {
    const response = await app.handle(new Request("http://localhost:3001/api/tasks"));
    expect(response.status).toBe(401);

    const data: any = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain("Unauthorized");
  });

  it.skipIf(!hasDatabase)("should process forgot-password request cleanly", async () => {
    const response = await app.handle(
      new Request("http://localhost:3001/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "demo@zalde.com" }),
      })
    );
    expect(response.status).toBe(200);

    const data: any = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.message).toBeDefined();
  }, 15000);

  it.skipIf(!hasDatabase)("should reject reset-password with invalid token", async () => {
    const response = await app.handle(
      new Request("http://localhost:3001/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "invalid999", newPassword: "NewPassword123!" }),
      })
    );
    expect(response.status).toBe(400);

    const data: any = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain("tidak valid atau telah kedaluwarsa");
  }, 15000);

  it.skipIf(!hasDatabase)("should complete full password reset flow with valid token", async () => {
    // 1. Request reset
    const reqRes = await app.handle(
      new Request("http://localhost:3001/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "demo@zalde.com" }),
      })
    );
    expect(reqRes.status).toBe(200);
    const reqData: any = await reqRes.json();
    const token = reqData.data.devCode;
    expect(token).toBeDefined();

    // 2. Perform reset
    const resetRes = await app.handle(
      new Request("http://localhost:3001/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: "Password123!" }),
      })
    );
    expect(resetRes.status).toBe(200);
    const resetData: any = await resetRes.json();
    expect(resetData.success).toBe(true);
    expect(resetData.message).toContain("berhasil diperbarui");
  }, 15000);

  it("should reject registration with disposable email domain", async () => {
    const response = await app.handle(
      new Request("http://localhost:3001/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Spam Bot",
          email: "spammer@yopmail.com",
          password: "password123",
        }),
      })
    );
    expect(response.status).toBe(400);
    const data: any = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain("disposable");
  });

  it("should reject registration with nonexistent email domain", async () => {
    const response = await app.handle(
      new Request("http://localhost:3001/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Fake User",
          email: "fakeuser@nonexistent123domain999.com",
          password: "password123",
        }),
      })
    );
    expect(response.status).toBe(400);
    const data: any = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain("tidak ditemukan atau tidak aktif");
  });

  it.skipIf(!hasDatabase)("should enforce email OTP verification flow on registration", async () => {
    const uniqueEmail = `otp_test_${Date.now()}@zalde.dev`;

    // 1. Register: Harus require verification
    const regRes = await app.handle(
      new Request("http://localhost:3001/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "OTP Tester",
          email: uniqueEmail,
          password: "password123",
        }),
      })
    );
    expect(regRes.status).toBe(201);
    const regData: any = await regRes.json();
    expect(regData.success).toBe(true);
    expect(regData.data.needVerification).toBe(true);
    const otpCode = regData.data.devCode;
    expect(otpCode).toBeDefined();

    // 2. Login sebelum verifikasi: Harus ditolak 403
    const loginFailRes = await app.handle(
      new Request("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: uniqueEmail,
          password: "password123",
        }),
      })
    );
    expect(loginFailRes.status).toBe(403);
    const loginFailData: any = await loginFailRes.json();
    expect(loginFailData.success).toBe(false);
    expect(loginFailData.message).toContain("belum aktif");

    // 3. Verifikasi dengan kode salah: Harus ditolak 400
    const verifyWrongRes = await app.handle(
      new Request("http://localhost:3001/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: uniqueEmail,
          code: "000000",
        }),
      })
    );
    expect(verifyWrongRes.status).toBe(400);

    // 4. Verifikasi dengan kode benar: Harus sukses 200 & return JWT
    const verifyOkRes = await app.handle(
      new Request("http://localhost:3001/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: uniqueEmail,
          code: otpCode,
        }),
      })
    );
    expect(verifyOkRes.status).toBe(200);
    const verifyOkData: any = await verifyOkRes.json();
    expect(verifyOkData.success).toBe(true);
    expect(verifyOkData.data.token).toBeString();

    // 5. Login setelah verifikasi: Sukses 200
    const loginOkRes = await app.handle(
      new Request("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: uniqueEmail,
          password: "password123",
        }),
      })
    );
    expect(loginOkRes.status).toBe(200);
  }, 20000);
});




