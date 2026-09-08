import React from "react";
import { Task, Category, TaskStatus } from "../../types";
import { Modal } from "../ui/Modal";
import { Users } from "lucide-react";
import { CreateTaskPayload, UpdateTaskPayload } from "../../services/taskService";
import { TaskBasicInfoSection } from "./modal/TaskBasicInfoSection";
import { TaskStatusPriorityFields } from "./modal/TaskStatusPriorityFields";
import { TaskCategorySection } from "./modal/TaskCategorySection";
import { TaskSubtasksSection } from "./modal/TaskSubtasksSection";
import { TaskModalActions } from "./modal/TaskModalActions";
import { useTaskModalForm } from "./modal/useTaskModalForm";

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
  onLeaveTask: _onLeaveTask,
  onOpenChat: _onOpenChat,
}) => {
  const {
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
  } = useTaskModalForm({
    isOpen,
    onClose,
    taskToEdit,
    defaultStatus,
    onSubmit,
    onAddSubtask,
    onToggleSubtask,
    onDeleteSubtask,
  });

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

        {/* Title and Description */}
        <TaskBasicInfoSection
          isOwner={isOwner}
          title={title}
          description={description}
          onChangeTitle={setTitle}
          onChangeDescription={setDescription}
        />

        {/* Grid: Priority, Status, Category, Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <TaskStatusPriorityFields
            priority={priority}
            status={status}
            onChangePriority={setPriority}
            onChangeStatus={setStatus}
          />

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

        {/* Modal Actions */}
        <TaskModalActions
          isEdit={Boolean(taskToEdit)}
          isLoading={isLoading}
          dueDate={dueDate}
          title={title}
          description={description}
          priority={priority}
          onClose={onClose}
        />
      </form>
    </Modal>
  );
};
