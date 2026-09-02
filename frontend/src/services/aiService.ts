import { request } from "./api";
import { Task } from "../types";

export interface AiChatResponse {
  response: string;
  referencedTasks: Task[];
}

export const aiService = {
  /**
   * Vector Semantic Search on user tasks
   */
  async search(query: string, topK = 10): Promise<Task[]> {
    return request<Task[]>("/api/ai/search", {
      method: "POST",
      body: JSON.stringify({ query, topK }),
    });
  },

  /**
   * RAG Copilot Chat with personal task context
   */
  async chat(message: string): Promise<AiChatResponse> {
    return request<AiChatResponse>("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  },

  /**
   * AI Task Auto-Breakdown into subtasks
   */
  async breakdown(title: string, description?: string): Promise<string[]> {
    return request<string[]>("/api/ai/breakdown", {
      method: "POST",
      body: JSON.stringify({ title, description }),
    });
  },
};
