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
      borderTop: "border-t-slate-500",
      glowColor: "border-slate-500/80 bg-slate-900/60 shadow-slate-500/10",
    },
    {
      id: "in_progress",
      title: "Sedang Berjalan",
      dotColor: "bg-indigo-400 animate-pulse",
      borderTop: "border-t-indigo-500",
      glowColor: "border-indigo-500/80 bg-indigo-950/30 shadow-indigo-500/20",
    },
    {
      id: "done",
      title: "Selesai",
      dotColor: "bg-emerald-400",
      borderTop: "border-t-emerald-500",
      glowColor: "border-emerald-500/80 bg-emerald-950/30 shadow-emerald-500/20",
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
    // Only clear if leaving the main container
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-start">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        const isTarget = dragOverColumn === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`rounded-2xl glass-panel p-4 border ${col.borderTop} border-t-2 flex flex-col min-h-[520px] transition-all duration-200 ${
              isTarget
                ? `${col.glowColor} scale-[1.01] shadow-2xl border-dashed`
                : "border-slate-800/80 bg-slate-950/40"
            }`}
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
                type="button"
                onClick={() => onOpenCreateTaskWithStatus(col.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                title={`Tambah di ${col.title}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Task Cards Drop Zone */}
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1 min-h-[200px]">
              {colTasks.length === 0 ? (
                <div
                  className={`h-36 rounded-xl border border-dashed flex flex-col items-center justify-center text-center p-4 transition-all ${
                    isTarget
                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                      : "border-slate-800 text-slate-500"
                  }`}
                >
                  {isTarget ? (
                    <div className="flex flex-col items-center gap-1.5 animate-bounce">
                      <ArrowDownToLine className="w-5 h-5 text-indigo-400" />
                      <p className="text-xs font-semibold text-indigo-300">Lepaskan tugas di sini</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-slate-500">Tidak ada tugas</p>
                      <button
                        type="button"
                        onClick={() => onOpenCreateTaskWithStatus(col.id)}
                        className="text-[11px] text-indigo-400 hover:underline mt-1 font-medium"
                      >
                        + Tambah tugas
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onStatusChange={onStatusChange}
                      onToggleSubtask={onToggleSubtask}
                    />
                  ))}
                  {isTarget && (
                    <div className="h-14 rounded-xl border-2 border-dashed border-indigo-500/60 bg-indigo-500/10 flex items-center justify-center gap-2 text-xs text-indigo-300 animate-pulse">
                      <ArrowDownToLine className="w-4 h-4" />
                      <span>Lepaskan untuk pindah ke {col.title}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
