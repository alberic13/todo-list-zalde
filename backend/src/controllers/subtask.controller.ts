import { Elysia, t } from "elysia";
import { TaskService } from "../services/task.service";
import { requireAuth } from "../middlewares/auth.middleware";
import { successResponse, errorResponse } from "../utils/response";

export const subtaskController = new Elysia()
  .use(requireAuth)
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
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      body: t.Object({ title: t.String({ minLength: 1, maxLength: 255 }) }),
      detail: { tags: ["Subtasks"], summary: "Add subtask to task" },
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
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      detail: { tags: ["Subtasks"], summary: "Toggle subtask completion" },
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
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      detail: { tags: ["Subtasks"], summary: "Delete subtask" },
    }
  );
