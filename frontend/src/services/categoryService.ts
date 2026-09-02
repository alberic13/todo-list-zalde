import { request } from "./api";
import { Category } from "../types";

export const categoryService = {
  async list(): Promise<Category[]> {
    return request<Category[]>("/api/categories", {
      method: "GET",
    });
  },

  async create(name: string, colorHex?: string): Promise<Category> {
    return request<Category>("/api/categories", {
      method: "POST",
      body: JSON.stringify({ name, colorHex }),
    });
  },

  async delete(id: string): Promise<Category> {
    return request<Category>(`/api/categories/${id}`, {
      method: "DELETE",
    });
  },
};
