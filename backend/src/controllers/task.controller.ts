import { Elysia } from "elysia";
import { TaskService } from "../services/task.service";
import { requireAuth } from "../middlewares/auth.middleware";
import { successResponse, errorResponse } from "../utils/response";
import { subtaskController } from "./subtask.controller";
import {
  taskParamsSchema,
  taskQuerySchema,
  createTaskBodySchema,
  updateTaskBodySchema,
  updateTaskStatusBodySchema,
} from "./task.schema";

// ponytail: single task controller. subtasks handled in subtaskController.
export const taskController = new Elysia({ prefix: "/api" })
  .use(requireAuth)
  .use(subtaskController)
  .get("/tasks", async ({ user, query }) => {
    const tasks = await TaskService.list(user.id, {
      ...query,
      sortBy: query.sortBy as any,
      sortOrder: query.sortOrder as any,
    });
    return successResponse(tasks, "Tasks retrieved");
  }, { query: taskQuerySchema, detail: { tags: ["Tasks"], summary: "List tasks with filters" } })
  .get("/tasks/stats", async ({ user }) => {
    const stats = await TaskService.getStats(user.id);
    return successResponse(stats, "Task statistics retrieved");
  }, { detail: { tags: ["Tasks"], summary: "Get productivity statistics" } })
  .get("/tasks/:id", async ({ user, params, set }) => {
    const task = await TaskService.getById(params.id, user.id);
    if (!task) {
      set.status = 404;
      return errorResponse("Task not found");
    }
    return successResponse(task, "Task retrieved");
  }, { params: taskParamsSchema, detail: { tags: ["Tasks"], summary: "Get task details" } })
  .post("/tasks", async ({ user, body, set }) => {
    try {
      const task = await TaskService.create(user.id, {
        ...body,
        description: body.description ?? undefined,
        categoryId: body.categoryId ?? undefined,
        subtaskTitles: body.subtasks,
      });
      set.status = 201;
      return successResponse(task, "Task created successfully");
    } catch (err: any) {
      set.status = 400;
      return errorResponse(err.message || "Failed to create task");
    }
  }, { body: createTaskBodySchema, detail: { tags: ["Tasks"], summary: "Create new task" } })
  .put("/tasks/:id", async ({ user, params, body, set }) => {
    const updated = await TaskService.update(params.id, user.id, {
      ...body,
      description: body.description ?? undefined,
    });
    if (!updated) {
      set.status = 404;
      return errorResponse("Task not found");
    }
    return successResponse(updated, "Task updated successfully");
  }, { params: taskParamsSchema, body: updateTaskBodySchema, detail: { tags: ["Tasks"], summary: "Update task" } })
  .patch("/tasks/:id/status", async ({ user, params, body, set }) => {
    const updated = await TaskService.updateStatus(params.id, user.id, body.status);
    if (!updated) {
      set.status = 404;
      return errorResponse("Task not found");
    }
    return successResponse(updated, "Task status updated");
  }, { params: taskParamsSchema, body: updateTaskStatusBodySchema, detail: { tags: ["Tasks"], summary: "Update task status" } })
  .delete("/tasks/:id", async ({ user, params, set }) => {
    const deleted = await TaskService.delete(params.id, user.id);
    if (!deleted) {
      set.status = 404;
      return errorResponse("Task not found");
    }
    return successResponse(deleted, "Task deleted successfully");
  }, { params: taskParamsSchema, detail: { tags: ["Tasks"], summary: "Delete task" } });
