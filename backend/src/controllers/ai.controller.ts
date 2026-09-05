import { Elysia, t } from "elysia";
import { RagService } from "../services/rag.service";
import { authPlugin } from "../middlewares/auth.middleware";
import { successResponse, errorResponse } from "../utils/response";
import { env } from "../config/env";
import { Redis } from "@upstash/redis";

// Custom Rate Limiter (Upstash Redis + Memory Fallback)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const MAX_REQUESTS = 30; // 30 request
const WINDOW_MS = 3600000; // per jam
const WINDOW_SEC = 3600; // 1 jam

// Inisialisasi Redis hanya jika kredensial tersedia
const redis = (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) 
  ? new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN }) 
  : null;

function processMemoryRateLimit(ip: string): number {
  const now = Date.now();
  let record = rateLimitMap.get(ip);
  if (!record || now - record.lastReset > WINDOW_MS) {
    record = { count: 1, lastReset: now };
  } else {
    record.count++;
  }
  rateLimitMap.set(ip, record);
  return record.count;
}

const aiRateLimiter = new Elysia({ name: "aiRateLimiter" }).onBeforeHandle(async ({ request, set }) => {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  let currentCount = 0;

  if (redis) {
    const key = `rate_limit:ai:${ip}`;
    try {
      currentCount = await redis.incr(key);
      if (currentCount === 1) {
        await redis.expire(key, WINDOW_SEC);
      }
    } catch (err) {
      console.error("Upstash Redis error:", err);
      currentCount = processMemoryRateLimit(ip);
    }
  } else {
    currentCount = processMemoryRateLimit(ip);
  }

  if (currentCount > MAX_REQUESTS) {
    set.status = 429;
    return new Response(
      JSON.stringify({
        success: false,
        message: "Limit AI tercapai (Maksimal 30 interaksi per jam). Silakan coba lagi nanti untuk mencegah over-billing.",
        data: null,
        errors: { code: "RATE_LIMIT_EXCEEDED" },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
});

export const aiController = new Elysia({ prefix: "/api/ai" })
  .use(aiRateLimiter)
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
