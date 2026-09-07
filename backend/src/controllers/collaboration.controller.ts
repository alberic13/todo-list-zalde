import { Elysia, t } from "elysia";
import { CollaborationService } from "../services/collaboration.service";
import { requireAuth } from "../middlewares/auth.middleware";
import { successResponse, errorResponse } from "../utils/response";

export const collaborationController = new Elysia({ prefix: "/api/tasks" })
  .use(requireAuth)

  // 1. Generate or get invite code (Owner only)
  .post(
    "/:id/invite-code",
    async ({ user, params, set }) => {
      try {
        const result = await CollaborationService.getOrCreateInviteCode(params.id, user.id);
        return successResponse(result, "Tautan undangan kolaborasi berhasil dibuat");
      } catch (err: any) {
        set.status = 400;
        return errorResponse(err.message || "Gagal membuat tautan undangan");
      }
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Collaboration"],
        summary: "Generate or get invite code for task (Owner only)",
      },
    }
  )

  // 2. Join task by invite code
  .post(
    "/join/:inviteCode",
    async ({ user, params, set }) => {
      try {
        const result = await CollaborationService.joinTaskByInviteCode(params.inviteCode, user.id);
        return successResponse(result, result.message);
      } catch (err: any) {
        set.status = 400;
        return errorResponse(err.message || "Gagal bergabung ke tugas");
      }
    },
    {
      params: t.Object({
        inviteCode: t.String({ minLength: 1 }),
      }),
      detail: {
        tags: ["Collaboration"],
        summary: "Join task using invite code",
      },
    }
  )

  // 3. Get all collaborators of a task
  .get(
    "/:id/collaborators",
    async ({ user, params, set }) => {
      try {
        const members = await CollaborationService.getCollaborators(params.id, user.id);
        return successResponse(members, "Daftar kolaborator berhasil diambil");
      } catch (err: any) {
        set.status = 403;
        return errorResponse(err.message || "Gagal mengambil daftar kolaborator");
      }
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Collaboration"],
        summary: "Get task collaborators",
      },
    }
  )

  // 4. Remove collaborator (Owner kick or member leave)
  .delete(
    "/:id/collaborators/:userId",
    async ({ user, params, set }) => {
      try {
        const result = await CollaborationService.removeCollaborator(params.id, params.userId, user.id);
        return successResponse(result, result.message);
      } catch (err: any) {
        set.status = 400;
        return errorResponse(err.message || "Gagal menghapus kolaborator");
      }
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
        userId: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Collaboration"],
        summary: "Remove collaborator or leave task",
      },
    }
  )

  // 5. Get discussion chat messages
  .get(
    "/:id/messages",
    async ({ user, params, query, set }) => {
      try {
        const limit = query.limit ? Number(query.limit) : 50;
        const messages = await CollaborationService.getMessages(params.id, user.id, limit);
        return successResponse(messages, "Pesan diskusi berhasil diambil");
      } catch (err: any) {
        set.status = 403;
        return errorResponse(err.message || "Gagal mengambil pesan");
      }
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      query: t.Object({
        limit: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Collaboration"],
        summary: "Get task discussion messages",
      },
    }
  )

  // 6. Send discussion message
  .post(
    "/:id/messages",
    async ({ user, params, body, set }) => {
      try {
        const message = await CollaborationService.sendMessage(params.id, user.id, body.content);
        set.status = 201;
        return successResponse(message, "Pesan berhasil dikirim");
      } catch (err: any) {
        set.status = 400;
        return errorResponse(err.message || "Gagal mengirim pesan");
      }
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        content: t.String({ minLength: 1, maxLength: 5000 }),
      }),
      detail: {
        tags: ["Collaboration"],
        summary: "Send discussion message in task room",
      },
    }
  );
