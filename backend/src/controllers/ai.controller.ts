import { Elysia, t } from "elysia";
import { RagService } from "../services/rag.service";
import { authPlugin } from "../middlewares/auth.middleware";
import { successResponse, errorResponse } from "../utils/response";

export const aiController = new Elysia({ prefix: "/api/ai" })
  .use(authPlugin)
  // POST /api/ai/search (Semantic Vector Search)
  .post(
    "/search",
    async ({ user, body, set }) => {
      if (!user) {
        set.status = 401;
        return errorResponse("Unauthorized", { code: "UNAUTHORIZED" });
      }

      try {
        const results = await RagService.semanticSearch(user.id, body.query, body.topK || 10);
        return successResponse(results, "Semantic search completed");
      } catch (err: any) {
        set.status = 500;
        return errorResponse(err.message || "Semantic search failed");
      }
    },
    {
      body: t.Object({
        query: t.String({ minLength: 1 }),
        topK: t.Optional(t.Number()),
      }),
      detail: {
        tags: ["AI & RAG"],
        summary: "Semantic vector search for user tasks",
      },
    }
  )
  // POST /api/ai/chat (RAG AI Productivity Copilot)
  .post(
    "/chat",
    async ({ user, body, set }) => {
      if (!user) {
        set.status = 401;
        return errorResponse("Unauthorized", { code: "UNAUTHORIZED" });
      }

      try {
        const result = await RagService.chatWithRag(user.id, body.message, user.name);
        return successResponse(result, "AI response generated");
      } catch (err: any) {
        set.status = 500;
        return errorResponse(err.message || "AI chat generation failed");
      }
    },
    {
      body: t.Object({
        message: t.String({ minLength: 1 }),
      }),
      detail: {
        tags: ["AI & RAG"],
        summary: "Interactive RAG Copilot chat with task context",
      },
    }
  )
  // POST /api/ai/breakdown (AI Task Decomposition)
  .post(
    "/breakdown",
    async ({ user, body, set }) => {
      if (!user) {
        set.status = 401;
        return errorResponse("Unauthorized", { code: "UNAUTHORIZED" });
      }

      try {
        const subtasks = await RagService.breakdownTask(body.title, body.description);
        return successResponse(subtasks, "Task decomposed successfully");
      } catch (err: any) {
        set.status = 500;
        return errorResponse(err.message || "Task decomposition failed");
      }
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
      }),
      detail: {
        tags: ["AI & RAG"],
        summary: "Auto-generate actionable subtasks from task details",
      },
    }
  );
