import React from "react";
import { Task, TaskStats } from "../types";
import { taskService } from "../services/taskService";
import { CollaborationTaskEvent } from "./useTaskSync";

interface UseSubtasksOptions {
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setStats: React.Dispatch<React.SetStateAction<TaskStats | null>>;
  loadTasks: () => Promise<void>;
  broadcastEvent: (event: CollaborationTaskEvent) => void;
}

export function useSubtasks({ setTasks, setStats, loadTasks, broadcastEvent }: UseSubtasksOptions) {
  const addSubtask = async (taskId: string, title: string) => {
    const subtask = await taskService.addSubtask(taskId, title);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: [...(t.subtasks || []), subtask] }
          : t
      )
    );
    broadcastEvent({ type: "SUBTASK_ADD", taskId });
    return subtask;
  };

  const toggleSubtask = async (subtaskId: string, taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks?.map((s) =>
                s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
              ),
            }
          : t
      )
    );
    broadcastEvent({ type: "SUBTASK_TOGGLE", taskId, subtaskId });
    try {
      await taskService.toggleSubtask(subtaskId);
      const newStats = await taskService.getStats();
      setStats(newStats);
    } catch (err) {
      await loadTasks();
      throw err;
    }
  };

  const deleteSubtask = async (subtaskId: string, taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: t.subtasks?.filter((s) => s.id !== subtaskId) }
          : t
      )
    );
    broadcastEvent({ type: "SUBTASK_DELETE", taskId, subtaskId });
    try {
      await taskService.deleteSubtask(subtaskId);
      const newStats = await taskService.getStats();
      setStats(newStats);
    } catch (err) {
      await loadTasks();
      throw err;
    }
  };

  return { addSubtask, toggleSubtask, deleteSubtask };
}
