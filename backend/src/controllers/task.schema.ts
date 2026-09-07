import { t } from "elysia";

export const taskParamsSchema = t.Object({
  id: t.String({ format: "uuid" }),
});

export const taskQuerySchema = t.Object({
  status: t.Optional(t.String()),
  priority: t.Optional(t.String()),
  categoryId: t.Optional(t.String()),
  search: t.Optional(t.String()),
  sortBy: t.Optional(t.String()),
  sortOrder: t.Optional(t.String()),
});

export const createTaskBodySchema = t.Object({
  title: t.String({ minLength: 1, maxLength: 255 }),
  description: t.Optional(t.String()),
  categoryId: t.Optional(t.Nullable(t.String({ format: "uuid" }))),
  status: t.Optional(t.String()),
  priority: t.Optional(t.String()),
  dueDate: t.Optional(t.Nullable(t.String())),
  orderIndex: t.Optional(t.Number()),
  subtasks: t.Optional(t.Array(t.String())),
});

export const updateTaskBodySchema = t.Object({
  title: t.Optional(t.String({ minLength: 1 })),
  description: t.Optional(t.Nullable(t.String())),
  categoryId: t.Optional(t.Nullable(t.String({ format: "uuid" }))),
  status: t.Optional(t.String()),
  priority: t.Optional(t.String()),
  dueDate: t.Optional(t.Nullable(t.String())),
  orderIndex: t.Optional(t.Number()),
});

export const updateTaskStatusBodySchema = t.Object({
  status: t.String(),
});
