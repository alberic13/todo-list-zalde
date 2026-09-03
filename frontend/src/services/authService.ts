import { request } from "./api";
import { User } from "../types";

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async getMe(): Promise<User> {
    return request<User>("/api/auth/me", {
      method: "GET",
    });
  },

  async updateProfile(data: { name?: string; phoneNumber?: string }): Promise<User> {
    return request<User>("/api/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};
