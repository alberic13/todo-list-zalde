import { describe, expect, it } from "bun:test";
import { app } from "../src/index";

describe("E2E Auth & Task Flow", () => {
  const testEmail = `test_${Date.now()}@zalde.dev`;
  let authToken = "";
  let createdTaskId = "";

  it("should register new user", async () => {
    const res = await app.handle(
      new Request("http://localhost:3001/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Zalde Tester",
          email: testEmail,
          password: "password123",
        }),
      })
    );

    expect(res.status).toBe(201);
    const data: any = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.token).toBeString();
    expect(data.data.user.email).toBe(testEmail);
    authToken = data.data.token;
  }, 15000);

  it("should login with registered credentials", async () => {
    const res = await app.handle(
      new Request("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: "password123",
        }),
      })
    );

    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.token).toBeString();
  }, 15000);

  it("should create a task with subtasks", async () => {
    const res = await app.handle(
      new Request("http://localhost:3001/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: "Implementasi Fitur AI",
          description: "Membangun sistem RAG dan semantic search",
          priority: "high",
          status: "todo",
          subtasks: ["Setup Embedding", "Integrasi Gemini", "UI Drawer"],
        }),
      })
    );

    expect(res.status).toBe(201);
    const data: any = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.title).toBe("Implementasi Fitur AI");
    expect(data.data.subtasks.length).toBe(3);
    createdTaskId = data.data.id;
  }, 15000);

  it("should list tasks and calculate stats", async () => {
    const res = await app.handle(
      new Request("http://localhost:3001/api/tasks/stats", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
    );

    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.total).toBeGreaterThanOrEqual(1);
  }, 15000);
});
