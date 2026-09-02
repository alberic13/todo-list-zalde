import React, { useState } from "react";
import { Task } from "../../types";
import { TaskCard } from "./TaskCard";
import { Plus, ArrowDownToLine } from "lucide-react";

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
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const columns: Array<{
    id: "todo" | "in_progress" | "done";
    title: string;
    dotColor: string;
    borderTop: string;
    glowColor: string;
  }> = [
    {
      id: "todo",
      title: "Belum Mulai",
      dotColor: "bg-slate-400",
      borderTop: "border-t-slate-400",
      glowColor: "border-slate-400 bg-slate-100/80 shadow-md",
    },
    {
      id: "in_progress",
      title: "Sedang Berjalan",
      dotColor: "bg-indigo-500",
      borderTop: "border-t-indigo-500",
      glowColor: "border-indigo-500 bg-indigo-50/80 shadow-md",
    },
    {
      id: "done",
      title: "Selesai",
      dotColor: "bg-emerald-500",
      borderTop: "border-t-emerald-500",
      glowColor: "border-emerald-500 bg-emerald-50/80 shadow-md",
    },
  ];

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== colId) {
      setDragOverColumn(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      onStatusChange(taskId, targetStatus);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 items-start">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        const isTarget = dragOverColumn === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`rounded-3xl glass-panel p-5 border ${col.borderTop} border-t-4 card-shadow flex flex-col min-h-[540px] transition-all duration-200 ${
              isTarget
                ? `${col.glowColor} scale-[1.01] border-dashed`
                : "border-white/80 bg-white/70"
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {col.title}
                </h4>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                  {colTasks.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onOpenCreateTaskWithStatus(col.id)}
                className="w-7 h-7 rounded-xl bg-white hover:bg-slate-900 hover:text-white border border-slate-200 text-slate-700 flex items-center justify-center shadow-sm transition-all"
                title={`Tambah di ${col.title}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Task Cards Drop Zone */}
            <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1 min-h-[220px]">
              {colTasks.length === 0 ? (
                <div
                  className={`h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center p-4 transition-all ${
                    isTarget
                      ? "border-indigo-500 bg-indigo-50/80 text-indigo-700"
                      : "border-slate-200/90 bg-white/40 text-slate-400"
                  }`}
                >
                  {isTarget ? (
                    <div className="flex flex-col items-center gap-1.5 animate-bounce">
                      <ArrowDownToLine className="w-5 h-5 text-indigo-600" />
                      <p className="text-xs font-bold text-indigo-700">Lepaskan tugas di sini</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-slate-400">Tidak ada tugas</p>
                      <button
                        type="button"
                        onClick={() => onOpenCreateTaskWithStatus(col.id)}
                        className="text-[11px] text-indigo-600 hover:underline mt-1 font-bold"
                      >
                        + Tambah Tugas
                      </button>
                    </>
                  )}
                </div>
              ) : (
                colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={onEdit}
                    onDelete={onDelete}
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
