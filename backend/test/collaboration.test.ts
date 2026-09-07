import { describe, expect, it } from "bun:test";
import { app } from "../src/index";

describe("Task Collaboration & Discussion Chat Flow", () => {
  const emailA = `collab_owner_${Date.now()}@zalde.dev`;
  const emailB = `collab_member_${Date.now()}@zalde.dev`;
  let tokenA = "";
  let tokenB = "";
  let userIdB = "";
  let taskId = "";
  let inviteCode = "";

  it("should register and verify User A (Owner) and User B (Collaborator)", async () => {
    // 1. Register User A
    const resA = await app.handle(
      new Request("http://localhost:3001/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Alice Owner", email: emailA, password: "password123" }),
      })
    );
    expect(resA.status).toBe(201);
    const dataA: any = await resA.json();

    const verifyA = await app.handle(
      new Request("http://localhost:3001/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailA, code: dataA.data.devCode }),
      })
    );
    const verifyDataA: any = await verifyA.json();
    tokenA = verifyDataA.data.token;
    expect(tokenA).toBeString();

    // 2. Register User B
    const resB = await app.handle(
      new Request("http://localhost:3001/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Bob Collab", email: emailB, password: "password123" }),
      })
    );
    expect(resB.status).toBe(201);
    const dataB: any = await resB.json();
    userIdB = dataB.data.user.id;

    const verifyB = await app.handle(
      new Request("http://localhost:3001/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailB, code: dataB.data.devCode }),
      })
    );
    const verifyDataB: any = await verifyB.json();
    tokenB = verifyDataB.data.token;
    expect(tokenB).toBeString();
  }, 20000);

  it("should create a task as User A and generate invite code", async () => {
    const taskRes = await app.handle(
      new Request("http://localhost:3001/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          title: "Proyek Kolaborasi Bersama",
          description: "Mengerjakan fitur tim",
          priority: "high",
          status: "todo",
          subtasks: ["Rancang arsitektur", "Koding fitur"],
        }),
      })
    );
    expect(taskRes.status).toBe(201);
    const taskData: any = await taskRes.json();
    taskId = taskData.data.id;
    expect(taskId).toBeString();

    // Generate invite code
    const inviteRes = await app.handle(
      new Request(`http://localhost:3001/api/tasks/${taskId}/invite-code`, {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenA}` },
      })
    );
    expect(inviteRes.status).toBe(200);
    const inviteData: any = await inviteRes.json();
    expect(inviteData.success).toBe(true);
    expect(inviteData.data.inviteCode).toBeString();
    inviteCode = inviteData.data.inviteCode;
  }, 15000);

  it("should allow User B to join task via invite code", async () => {
    const joinRes = await app.handle(
      new Request(`http://localhost:3001/api/tasks/join/${inviteCode}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenB}` },
      })
    );
    expect(joinRes.status).toBe(200);
    const joinData: any = await joinRes.json();
    expect(joinData.success).toBe(true);
    expect(joinData.data.task.id).toBe(taskId);
  }, 15000);

  it("should show collaborative task in User B task list with isOwner=false", async () => {
    const listRes = await app.handle(
      new Request("http://localhost:3001/api/tasks", {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenB}` },
      })
    );
    expect(listRes.status).toBe(200);
    const listData: any = await listRes.json();
    expect(listData.success).toBe(true);
    const found = listData.data.find((t: any) => t.id === taskId);
    expect(found).toBeDefined();
    expect(found.isOwner).toBe(false);
    expect(found.collaboratorCount).toBeGreaterThanOrEqual(1);
  }, 15000);

  it("should allow User B (collaborator) to update task status", async () => {
    const statusRes = await app.handle(
      new Request(`http://localhost:3001/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenB}`,
        },
        body: JSON.stringify({ status: "in_progress" }),
      })
    );
    expect(statusRes.status).toBe(200);
    const statusData: any = await statusRes.json();
    expect(statusData.data.status).toBe("in_progress");
  }, 15000);

  it("should sync subtask checklist toggle between User B (collaborator) and User A (owner)", async () => {
    // 1. User B gets task to find subtask ID
    const getTaskRes = await app.handle(
      new Request(`http://localhost:3001/api/tasks/${taskId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenB}` },
      })
    );
    expect(getTaskRes.status).toBe(200);
    const taskDetails: any = await getTaskRes.json();
    expect(taskDetails.data.subtasks.length).toBe(2);
    const subtask = taskDetails.data.subtasks[0];
    expect(subtask.isCompleted).toBe(false);

    // 2. User B toggles subtask to completed
    const toggleRes = await app.handle(
      new Request(`http://localhost:3001/api/subtasks/${subtask.id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${tokenB}` },
      })
    );
    expect(toggleRes.status).toBe(200);
    const toggleData: any = await toggleRes.json();
    expect(toggleData.success).toBe(true);
    expect(toggleData.data.isCompleted).toBe(true);

    // 3. User A (Owner) fetches task and sees updated subtask checklist
    const ownerTaskRes = await app.handle(
      new Request(`http://localhost:3001/api/tasks/${taskId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenA}` },
      })
    );
    expect(ownerTaskRes.status).toBe(200);
    const ownerTaskData: any = await ownerTaskRes.json();
    const updatedSubtask = ownerTaskData.data.subtasks.find((s: any) => s.id === subtask.id);
    expect(updatedSubtask).toBeDefined();
    expect(updatedSubtask.isCompleted).toBe(true);
  }, 15000);

  it("should list all collaborators correctly", async () => {
    const collabRes = await app.handle(
      new Request(`http://localhost:3001/api/tasks/${taskId}/collaborators`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenB}` },
      })
    );
    expect(collabRes.status).toBe(200);
    const collabData: any = await collabRes.json();
    expect(collabData.success).toBe(true);
    expect(collabData.data.length).toBe(2); // Owner + User B
  }, 15000);

  it("should send and retrieve chat messages between User A and User B", async () => {
    // User A sends message
    const msg1Res = await app.handle(
      new Request(`http://localhost:3001/api/tasks/${taskId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ content: "Halo Bob, selamat bergabung di task ini!" }),
      })
    );
    expect(msg1Res.status).toBe(201);

    // User B sends reply
    const msg2Res = await app.handle(
      new Request(`http://localhost:3001/api/tasks/${taskId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenB}`,
        },
        body: JSON.stringify({ content: "Siap Alice, saya mulai kerjakan subtask." }),
      })
    );
    expect(msg2Res.status).toBe(201);

    // User B reads messages
    const getMsgsRes = await app.handle(
      new Request(`http://localhost:3001/api/tasks/${taskId}/messages`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenB}` },
      })
    );
    expect(getMsgsRes.status).toBe(200);
    const msgsData: any = await getMsgsRes.json();
    expect(msgsData.data.length).toBe(2);
    expect(msgsData.data[0].content).toBe("Halo Bob, selamat bergabung di task ini!");
    expect(msgsData.data[1].content).toBe("Siap Alice, saya mulai kerjakan subtask.");
  }, 15000);

  it("should prevent User B from deleting task, but allow User B to leave task", async () => {
    // User B tries to delete task
    const delRes = await app.handle(
      new Request(`http://localhost:3001/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokenB}` },
      })
    );
    expect(delRes.status).toBe(404); // Not found under User B's ownership

    // User B leaves task
    const leaveRes = await app.handle(
      new Request(`http://localhost:3001/api/tasks/${taskId}/collaborators/${userIdB}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokenB}` },
      })
    );
    expect(leaveRes.status).toBe(200);

    // Verify task no longer appears in User B's list
    const listAgainRes = await app.handle(
      new Request("http://localhost:3001/api/tasks", {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenB}` },
      })
    );
    const listAgainData: any = await listAgainRes.json();
    const foundAgain = listAgainData.data.find((t: any) => t.id === taskId);
    expect(foundAgain).toBeUndefined();
  }, 15000);
});
