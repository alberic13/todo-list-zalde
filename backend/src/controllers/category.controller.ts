import { Elysia, t } from "elysia";
import { CategoryService } from "../services/category.service";
import { requireAuth } from "../middlewares/auth.middleware";
import { successResponse, errorResponse } from "../utils/response";

export const categoryController = new Elysia({ prefix: "/api/categories" })
  .use(requireAuth)
  // GET /api/categories
  .get(
    "/",
    async ({ user, set }) => {
      const categories = await CategoryService.listByUser(user.id);
      return successResponse(categories, "Categories retrieved");
    },
    {
      detail: {
        tags: ["Categories"],
        summary: "List user categories",
      },
    }
  )
  // POST /api/categories
  .post(
    "/",
    async ({ user, body, set }) => {
      try {
        const category = await CategoryService.create(user.id, body.name, body.colorHex);
        set.status = 201;
        return successResponse(category, "Category created successfully");
      } catch (err: any) {
        set.status = 400;
        return errorResponse(err.message || "Failed to create category");
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 100 }),
        colorHex: t.Optional(t.String({ maxLength: 20 })),
      }),
      detail: {
        tags: ["Categories"],
        summary: "Create new category",
      },
    }
  )
  // DELETE /api/categories/:id
  .delete(
    "/:id",
    async ({ user, params, set }) => {
      const deleted = await CategoryService.delete(params.id, user.id);
      if (!deleted) {
        set.status = 404;
        return errorResponse("Category not found");
      }
      return successResponse(deleted, "Category deleted");
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Categories"],
        summary: "Delete category",
      },
    }
  );
