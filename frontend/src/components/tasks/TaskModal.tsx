import React, { useState, useEffect } from "react";
import { Task, Category, TaskPriority, TaskStatus } from "../../types";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Calendar, ExternalLink, Users } from "lucide-react";
import { calendarService } from "../../services/calendarService";
import { CreateTaskPayload, UpdateTaskPayload } from "../../services/taskService";
import { TaskCategorySection } from "./modal/TaskCategorySection";
import { TaskSubtasksSection, LocalSubtaskItem } from "./modal/TaskSubtasksSection";
import { TaskCollaborationSection } from "./modal/TaskCollaborationSection";

export interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  defaultStatus?: TaskStatus;
  categories: Category[];
  onSubmit: (payload: CreateTaskPayload | UpdateTaskPayload) => Promise<void>;
  onAddCategory: (name: string, colorHex?: string) => Promise<Category>;
  onDeleteCategory?: (id: string) => Promise<void>;
  onToggleSubtask?: (subtaskId: string, taskId: string) => Promise<void> | void;
  onAddSubtask?: (taskId: string, title: string) => Promise<any> | void;
  onDeleteSubtask?: (subtaskId: string, taskId: string) => Promise<void> | void;
  onLeaveTask?: (taskId: string) => Promise<void> | void;
  onOpenChat?: (task: Task) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  defaultStatus = "todo",
  categories = [],
  onSubmit,
  onAddCategory,
  onDeleteCategory,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  onLeaveTask,
  onOpenChat,
}) => {
  const isOwner = taskToEdit?.isOwner !== false;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [categoryId, setCategoryId] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [subtasks, setSubtasks] = useState<LocalSubtaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? "Edit Tugas" : "Buat Tugas Baru"}
      description={
        taskToEdit
          ? "Perbarui detail dan progres tugas Anda."
          : "Tambahkan tugas baru beserta prioritas dan subtask."
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Collaborator Role Notice */}
        {!isOwner && (
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-sky-50 border border-sky-200/80 text-sky-800 text-xs font-medium animate-in fade-in">
            <Users className="w-4 h-4 text-sky-600 shrink-0" />
            <p>
              Anda bergabung sebagai <strong>Kolaborator</strong>. Anda dapat memperbarui status tugas, menyelesaikan subtask, dan berdiskusi dengan tim.
            </p>
          </div>
        )}

        {/* Title */}
        <Input
          label="Judul Tugas *"
          placeholder="Misal: Buat mockup desain Figma halaman checkout"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus={isOwner}
          disabled={!isOwner}
        />

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Deskripsi (Opsional)
          </label>
          <textarea
            rows={3}
            placeholder="Tambahkan catatan detail tugas..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!isOwner}
            className={`w-full rounded-xl border text-sm px-3.5 py-2.5 transition-all resize-none shadow-sm ${
              !isOwner
                ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
            }`}
          />
        </div>

        {/* Grid: Priority, Status, Category, Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Priority */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Prioritas
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 cursor-pointer shadow-sm font-semibold"
            >
              <option value="urgent">🔴 Urgent</option>
              <option value="high">🟠 Tinggi</option>
              <option value="medium">🔵 Sedang</option>
              <option value="low">⚪ Rendah</option>
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 cursor-pointer shadow-sm font-semibold"
            >
              <option value="todo">Belum Mulai</option>
              <option value="in_progress">Sedang Berjalan</option>
              <option value="done">Selesai</option>
            </select>
          </div>

          {/* Category Section */}
          <TaskCategorySection
            categories={categories}
            categoryId={categoryId}
            onChangeCategory={setCategoryId}
            onAddCategory={onAddCategory}
            onDeleteCategory={onDeleteCategory}
            disabled={!isOwner}
          />

          {/* Due Date */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Batas Waktu (Deadline)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={!isOwner}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 cursor-pointer shadow-sm font-semibold disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Subtasks Section */}
        <TaskSubtasksSection
          subtasks={subtasks}
          onAddSubtask={handleAddSubtask}
          onToggleSubtask={handleToggleSubtask}
          onRemoveSubtask={handleRemoveSubtask}
        />

        {/* Collaboration & Discussion Section */}
        {taskToEdit && (
          <TaskCollaborationSection
            task={taskToEdit}
            isOwner={isOwner}
            isOpen={isOpen}
            onCloseModal={onClose}
            onOpenChat={onOpenChat}
            onLeaveTask={onLeaveTask}
          />
        )}

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
          {dueDate ? (
            <a
              href={calendarService.generateGoogleCalendarUrl({
                title: title || "Tugas Tanpa Judul",
                description,
                dueDate,
                priority,
              })}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 hover:text-indigo-600 transition shadow-sm group whitespace-nowrap shrink-0"
              title="Tambahkan langsung tugas ini ke Google Calendar Anda"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Ke Google Calendar</span>
              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
            </a>
          ) : (
            <div />
          )}

          <div className="flex items-center justify-end gap-2 shrink-0 sm:ml-auto">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {taskToEdit ? "Simpan Perubahan" : "Buat Tugas"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
