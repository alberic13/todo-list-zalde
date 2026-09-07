import { useState, useEffect, useRef } from "react";
import { Task, TaskPriority, TaskStatus } from "../../../types";
import { CreateTaskPayload, UpdateTaskPayload } from "../../../services/taskService";
import { LocalSubtaskItem } from "./TaskSubtasksSection";

export interface UseTaskModalFormOptions {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  defaultStatus?: TaskStatus;
  onSubmit: (payload: CreateTaskPayload | UpdateTaskPayload) => Promise<void>;
  onAddSubtask?: (taskId: string, title: string) => Promise<any> | void;
  onToggleSubtask?: (subtaskId: string, taskId: string) => Promise<void> | void;
  onDeleteSubtask?: (subtaskId: string, taskId: string) => Promise<void> | void;
}

export function useTaskModalForm({
  isOpen,
  onClose,
  taskToEdit,
  defaultStatus = "todo",
  onSubmit,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}: UseTaskModalFormOptions) {
  const isOwner = taskToEdit?.isOwner !== false;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [categoryId, setCategoryId] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [subtasks, setSubtasks] = useState<LocalSubtaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const prevTaskIdRef = useRef<string | null>(null);
  const prevIsOpenRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      prevIsOpenRef.current = false;
      prevTaskIdRef.current = null;
      return;
    }

    const isNewlyOpened = !prevIsOpenRef.current && isOpen;
    const isDifferentTask = taskToEdit?.id !== prevTaskIdRef.current;
    prevIsOpenRef.current = isOpen;
    prevTaskIdRef.current = taskToEdit?.id || null;

    if (taskToEdit) {
      if (isNewlyOpened || isDifferentTask) {
        setTitle(taskToEdit.title || "");
        setDescription(taskToEdit.description || "");
        setStatus(taskToEdit.status || defaultStatus || "todo");
        setPriority(taskToEdit.priority || "medium");
        setCategoryId(taskToEdit.categoryId || "");

        let safeDate = "";
        if (taskToEdit.dueDate) {
          try {
            const d = new Date(taskToEdit.dueDate);
            if (!isNaN(d.getTime())) {
              safeDate = d.toISOString().split("T")[0];
            }
          } catch {
            safeDate = "";
          }
        }
        setDueDate(safeDate);
      }

      const raw = taskToEdit.subtasks || [];
      if (Array.isArray(raw)) {
        setSubtasks(
          raw.map((s: any) => ({
            id: typeof s === "object" ? s?.id : undefined,
            title: typeof s === "object" ? s?.title || "" : String(s),
            isCompleted: typeof s === "object" ? Boolean(s?.isCompleted) : false,
          }))
        );
      } else {
        setSubtasks([]);
      }
    } else {
      setTitle("");
      setDescription("");
      setStatus(defaultStatus || "todo");
      setPriority("medium");
      setCategoryId("");
      setDueDate("");
      setSubtasks([]);
    }
  }, [taskToEdit, defaultStatus, isOpen]);

  const handleAddSubtask = async (trimmed: string) => {
    if (taskToEdit && onAddSubtask) {
      try {
        const created = await onAddSubtask(taskToEdit.id, trimmed);
        setSubtasks((prev) => [
          ...prev,
          {
            id: created?.id,
            title: trimmed,
            isCompleted: false,
          },
        ]);
      } catch (err) {
        console.error("Failed to add subtask:", err);
      }
    } else {
      setSubtasks((prev) => [
        ...prev,
        {
          title: trimmed,
          isCompleted: false,
        },
      ]);
    }
  };

  const handleToggleSubtask = async (item: LocalSubtaskItem, index: number) => {
    if (item.id && taskToEdit && onToggleSubtask) {
      try {
        await onToggleSubtask(item.id, taskToEdit.id);
        setSubtasks((prev) =>
          prev.map((s) =>
            s.id === item.id ? { ...s, isCompleted: !s.isCompleted } : s
          )
        );
      } catch (err) {
        console.error("Failed to toggle subtask:", err);
      }
    } else {
      setSubtasks((prev) =>
        prev.map((s, i) =>
          i === index ? { ...s, isCompleted: !s.isCompleted } : s
        )
      );
    }
  };

  const handleRemoveSubtask = async (item: LocalSubtaskItem, index: number) => {
    if (item.id && taskToEdit && onDeleteSubtask) {
      try {
        await onDeleteSubtask(item.id, taskToEdit.id);
        setSubtasks((prev) => prev.filter((s) => s.id !== item.id));
      } catch (err) {
        console.error("Failed to delete subtask:", err);
      }
    } else {
      setSubtasks((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        categoryId: categoryId || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        subtasks: !taskToEdit ? subtasks.map((s) => s.title) : undefined,
      });
      onClose();
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isOwner,
    title,
    setTitle,
    description,
    setDescription,
    status,
    setStatus,
    priority,
    setPriority,
    categoryId,
    setCategoryId,
    dueDate,
    setDueDate,
    subtasks,
    isLoading,
    handleAddSubtask,
    handleToggleSubtask,
    handleRemoveSubtask,
    handleSubmit,
  };
}
