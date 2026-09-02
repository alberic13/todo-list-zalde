import { ApiResponse } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export class ApiError extends Error {
  errors: any;
  status: number;

  constructor(message: string, status: number, errors: any = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("auth_token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: any) {
    throw new ApiError(
      "Tidak dapat terhubung ke server backend (port 3001). Pastikan server backend sedang berjalan (`cd backend && bun run dev`).",
      0,
      err.message
    );
  }

  let data: ApiResponse<T>;
  const rawText = await response.text();

  try {
    data = JSON.parse(rawText);
  } catch {
    data = {
      success: false,
      message:
        rawText && rawText.length < 200
          ? rawText
          : `Terjadi kendala pada server backend (HTTP ${response.status}). Periksa koneksi Database PostgreSQL di backend/.env.`,
      data: null as any,
      errors: null,
    };
  }

  if (!response.ok || !data.success) {
    throw new ApiError(
      data.message || `HTTP Error ${response.status}`,
      response.status,
      data.errors
    );
  }

  return data.data;
}
