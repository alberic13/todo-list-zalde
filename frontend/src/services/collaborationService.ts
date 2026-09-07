import { request } from "./api";
import { Task, TaskCollaboratorMember, TaskChatMessage } from "../types";

export interface JoinTaskResponse {
  task: Task;
  message: string;
  alreadyJoined?: boolean;
}

export const collaborationService = {
  /**
   * Generates or gets shareable invite code for a task
   */
  async getInviteCode(taskId: string): Promise<{ inviteCode: string }> {
    return request<{ inviteCode: string }>(`/api/tasks/${taskId}/invite-code`, {
      method: "POST",
    });
  },

  /**
   * Joins a task using invite code
   */
  async joinTask(inviteCode: string): Promise<JoinTaskResponse> {
    return request<JoinTaskResponse>(`/api/tasks/join/${encodeURIComponent(inviteCode.trim())}`, {
      method: "POST",
    });
  },

  /**
   * Gets list of collaborators for a task
   */
  async getCollaborators(taskId: string): Promise<TaskCollaboratorMember[]> {
    return request<TaskCollaboratorMember[]>(`/api/tasks/${taskId}/collaborators`, {
      method: "GET",
    });
  },

  /**
   * Removes collaborator or leaves task
   */
  async removeCollaborator(taskId: string, userId: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/api/tasks/${taskId}/collaborators/${userId}`, {
      method: "DELETE",
    });
  },

  /**
   * Gets discussion messages for a task
   */
  async getMessages(taskId: string): Promise<TaskChatMessage[]> {
    return request<TaskChatMessage[]>(`/api/tasks/${taskId}/messages`, {
      method: "GET",
    });
  },

  /**
   * Sends discussion message in task room
   */
  async sendMessage(taskId: string, content: string): Promise<TaskChatMessage> {
    return request<TaskChatMessage>(`/api/tasks/${taskId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },

  /**
   * Helper to build full shareable invite URL
   */
  buildInviteUrl(inviteCode: string): string {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/?join=${encodeURIComponent(inviteCode)}`;
  },
};
