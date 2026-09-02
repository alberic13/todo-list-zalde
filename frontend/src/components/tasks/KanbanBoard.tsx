import React from "react";
import { Task } from "../../types";
import { TaskCard } from "./TaskCard";
import { Plus } from "lucide-react";

export interface KanbanBoardProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onToggleSubtask: (subtaskId: string, taskId: string) => void;
  onOpenCreateTaskWithStatus: (status: "todo" | "in_progress" | "done") => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
  onToggleSubtask,
  onOpenCreateTaskWithStatus,
}) => {
  const columns: Array<{
    id: "todo" | "in_progress" | "done";
    title: string;
    dotColor: string;
    borderTop: string;
  }> = [
    {
      id: "todo",
      title: "Belum Mulai",
      dotColor: "bg-slate-400",
      borderTop: "border-t-slate-500",
    },
    {
      id: "in_progress",
      title: "Sedang Berjalan",
      dotColor: "bg-indigo-400 animate-pulse",
      borderTop: "border-t-indigo-500",
    },
    {
      id: "done",
      title: "Selesai",
      dotColor: "bg-emerald-400",
      borderTop: "border-t-emerald-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-start">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);

        return (
          <div
            key={col.id}
            className={`rounded-2xl glass-panel p-4 border border-slate-800/80 ${col.borderTop} border-t-2 flex flex-col min-h-[500px] bg-slate-950/40`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  {col.title}
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">
                  {colTasks.length}
                </span>
              </div>

              <button
                onClick={() => onOpenCreateTaskWithStatus(col.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                title={`Tambah di ${col.title}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Task Cards */}
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
              {colTasks.length === 0 ? (
                <div className="h-32 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-center p-4">
                  <p className="text-xs text-slate-500">Tidak ada tugas</p>
                  <button
                    onClick={() => onOpenCreateTaskWithStatus(col.id)}
                    className="text-[11px] text-indigo-400 hover:underline mt-1 font-medium"
                  >
                    + Tambah tugas
                  </button>
                </div>
              ) : (
                colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onStatusChange={onStatusChange}
                    onToggleSubtask={onToggleSubtask}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
