import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/error.middleware";
import { authController } from "./controllers/auth.controller";
import { categoryController } from "./controllers/category.controller";
import { taskController } from "./controllers/task.controller";
import { aiController } from "./controllers/ai.controller";
import { successResponse } from "./utils/response";

export const app = new Elysia()
  .use(
    cors({
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
      allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    })
  )
  .use(
    swagger({
      path: "/swagger",
      documentation: {
        info: {
          title: "Zalde Todo AI API",
          version: "1.0.0",
          description: "Fullstack AI-Powered Todo List API with Elysia.js & Drizzle ORM",
        },
        tags: [
          { name: "Auth", description: "Authentication & User management" },
          { name: "Tasks", description: "Task and Subtask CRUD operations" },
          { name: "Categories", description: "Task Category management" },
          { name: "AI & RAG", description: "Semantic vector search, RAG Copilot, and Task Breakdown" },
        ],
      },
    })
  )
  .use(errorHandler)
  // Health check endpoint
  .get("/", () =>
    successResponse(
      {
        name: "Zalde Todo AI API",
        version: "1.0.0",
        status: "online",
        timestamp: new Date().toISOString(),
      },
      "API is running"
    )
  )
  // Mount routes
  .use(authController)
  .use(categoryController)
  .use(taskController)
  .use(aiController);

// Listen when executed directly
if (process.env.NODE_ENV !== "test") {
  app.listen(env.PORT, () => {
    console.log(`🦊 Elysia server is running at http://localhost:${env.PORT}`);
    console.log(`📚 Swagger documentation at http://localhost:${env.PORT}/swagger`);
  });
}

export default app;
