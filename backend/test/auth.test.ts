import { describe, expect, it } from "bun:test";
import { successResponse, errorResponse } from "../src/utils/response";
import { app } from "../src/index";

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
});
