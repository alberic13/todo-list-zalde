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

  async loginWithGoogle(credential: string): Promise<AuthResponse> {
    return request<AuthResponse>("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential }),
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

  async forgotPassword(email: string): Promise<{ message: string; email?: string; devCode?: string; warning?: string }> {
    return request<{ message: string; email?: string; devCode?: string; warning?: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return request<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
  },
};
