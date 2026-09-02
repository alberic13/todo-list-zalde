import React from "react";
import { Task } from "../../types";
import { TaskCard } from "./TaskCard";
import { Skeleton } from "../ui/Skeleton";
import { Button } from "../ui/Button";
import { ClipboardList, Plus } from "lucide-react";

export interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onToggleSubtask: (subtaskId: string, taskId: string) => void;
  onOpenCreateTask: () => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  isLoading,
  onEdit,
  onDelete,
  onStatusChange,
  onToggleSubtask,
  onOpenCreateTask,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-2xl glass-card border border-slate-800 flex gap-3">
            <Skeleton className="w-5 h-5 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 px-4 rounded-3xl glass-panel border border-slate-800/80 my-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
          <ClipboardList className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-100 mb-1">
          Tidak ada tugas yang ditemukan
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">
          Belum ada tugas yang sesuai dengan filter pencarian ini atau daftar Anda masih kosong.
        </p>
        <Button
          onClick={onOpenCreateTask}
          leftIcon={<Plus className="w-4 h-4" />}
          size="sm"
        >
          Buat Tugas Baru
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          onToggleSubtask={onToggleSubtask}
        />
      ))}
    </div>
  );
};
