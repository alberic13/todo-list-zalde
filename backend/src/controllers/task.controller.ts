import { Elysia, t } from "elysia";
import { TaskService } from "../services/task.service";
import { requireAuth } from "../middlewares/auth.middleware";
import { successResponse, errorResponse } from "../utils/response";

export const taskController = new Elysia({ prefix: "/api" })
  .use(requireAuth)
  // GET /api/tasks
  .get(
    "/tasks",
    async ({ user, query, set }) => {
      const tasks = await TaskService.list(user.id, {
        status: query.status,
        priority: query.priority,
        categoryId: query.categoryId,
        search: query.search,
        sortBy: query.sortBy as any,
        sortOrder: query.sortOrder as any,
      });
      return successResponse(tasks, "Tasks retrieved");
    },
    {
      query: t.Object({
        status: t.Optional(t.String()),
        priority: t.Optional(t.String()),
        categoryId: t.Optional(t.String()),
        search: t.Optional(t.String()),
        sortBy: t.Optional(t.String()),
        sortOrder: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Tasks"],
        summary: "List tasks with filters",
      },
    }
  )
  // GET /api/tasks/stats
  .get(
    "/tasks/stats",
    async ({ user, set }) => {
      const stats = await TaskService.getStats(user.id);
      return successResponse(stats, "Task statistics retrieved");
    },
    {
      detail: {
        tags: ["Tasks"],
        summary: "Get productivity statistics",
      },
    }
  )
  // GET /api/tasks/:id
  .get(
    "/tasks/:id",
    async ({ user, params, set }) => {
      const task = await TaskService.getById(params.id, user.id);
      if (!task) {
        set.status = 404;
        return errorResponse("Task not found");
      }
      return successResponse(task, "Task retrieved");
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Tasks"],
        summary: "Get task details",
      },
    }
  )
  // POST /api/tasks
  .post(
    "/tasks",
    async ({ user, body, set }) => {
      try {
        const task = await TaskService.create(user.id, {
          title: body.title,
          description: body.description ?? undefined,
          categoryId: body.categoryId ?? undefined,
          status: body.status ?? undefined,
          priority: body.priority ?? undefined,
          dueDate: body.dueDate ?? undefined,
          orderIndex: body.orderIndex ?? undefined,
          subtaskTitles: body.subtasks ?? undefined,
        });
        set.status = 201;
        return successResponse(task, "Task created successfully");
      } catch (err: any) {
        set.status = 400;
        return errorResponse(err.message || "Failed to create task");
      }
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1, maxLength: 255 }),
        description: t.Optional(t.String()),
        categoryId: t.Optional(t.Nullable(t.String({ format: "uuid" }))),
        status: t.Optional(t.String()),
        priority: t.Optional(t.String()),
        dueDate: t.Optional(t.Nullable(t.String())),
        orderIndex: t.Optional(t.Number()),
        subtasks: t.Optional(t.Array(t.String())),
      }),
      detail: {
        tags: ["Tasks"],
        summary: "Create new task",
      },
    }
  )
  // PUT /api/tasks/:id
  .put(
    "/tasks/:id",
    async ({ user, params, body, set }) => {
      const updated = await TaskService.update(params.id, user.id, {
        title: body.title,
        description: body.description !== undefined ? (body.description ?? undefined) : undefined,
        categoryId: body.categoryId !== undefined ? (body.categoryId ?? null) : undefined,
        status: body.status,
        priority: body.priority,
        dueDate: body.dueDate !== undefined ? (body.dueDate ?? null) : undefined,
        orderIndex: body.orderIndex,
      });

      if (!updated) {
        set.status = 404;
        return errorResponse("Task not found");
      }
      return successResponse(updated, "Task updated successfully");
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        title: t.Optional(t.String({ minLength: 1 })),
        description: t.Optional(t.Nullable(t.String())),
        categoryId: t.Optional(t.Nullable(t.String({ format: "uuid" }))),
        status: t.Optional(t.String()),
        priority: t.Optional(t.String()),
        dueDate: t.Optional(t.Nullable(t.String())),
        orderIndex: t.Optional(t.Number()),
      }),
      detail: {
        tags: ["Tasks"],
        summary: "Update task",
      },
    }
  )
  // PATCH /api/tasks/:id/status
  .patch(
    "/tasks/:id/status",
    async ({ user, params, body, set }) => {
      const updated = await TaskService.updateStatus(params.id, user.id, body.status);
      if (!updated) {
        set.status = 404;
        return errorResponse("Task not found");
      }
      return successResponse(updated, "Task status updated");
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        status: t.String(),
      }),
      detail: {
        tags: ["Tasks"],
        summary: "Update task status",
      },
    }
  )
  // DELETE /api/tasks/:id
  .delete(
    "/tasks/:id",
    async ({ user, params, set }) => {
      const deleted = await TaskService.delete(params.id, user.id);
      if (!deleted) {
        set.status = 404;
        return errorResponse("Task not found");
      }
      return successResponse(deleted, "Task deleted successfully");
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Tasks"],
        summary: "Delete task",
      },
    }
  )
  // POST /api/tasks/:id/subtasks
  .post(
    "/tasks/:id/subtasks",
    async ({ user, params, body, set }) => {
      try {
        const subtask = await TaskService.addSubtask(params.id, user.id, body.title);
        set.status = 201;
        return successResponse(subtask, "Subtask added");
      } catch (err: any) {
        set.status = 400;
        return errorResponse(err.message || "Failed to add subtask");
      }
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        title: t.String({ minLength: 1, maxLength: 255 }),
      }),
      detail: {
        tags: ["Subtasks"],
        summary: "Add subtask to task",
      },
    }
  )
  // PATCH /api/subtasks/:id/toggle
  .patch(
    "/subtasks/:id/toggle",
    async ({ user, params, set }) => {
      try {
        const subtask = await TaskService.toggleSubtask(params.id, user.id);
        return successResponse(subtask, "Subtask status toggled");
      } catch (err: any) {
        set.status = 400;
        return errorResponse(err.message || "Failed to toggle subtask");
      }
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Subtasks"],
        summary: "Toggle subtask completion",
      },
    }
  )
  // DELETE /api/subtasks/:id
  .delete(
    "/subtasks/:id",
    async ({ user, params, set }) => {
      try {
        const deleted = await TaskService.deleteSubtask(params.id, user.id);
        return successResponse(deleted, "Subtask deleted");
      } catch (err: any) {
        set.status = 400;
        return errorResponse(err.message || "Failed to delete subtask");
      }
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Subtasks"],
        summary: "Delete subtask",
      },
    }
  );
