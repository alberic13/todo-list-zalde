import React, { useState } from "react";
import { Task, Subtask } from "../../types";
import { Badge } from "../ui/Badge";
import { formatRelativeDate, isOverdue } from "../../utils/date";
import {
  Calendar,
  CheckCircle2,
  Circle,
  MoreVertical,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  Check,
  Clock,
  ArrowRight,
} from "lucide-react";

export interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onToggleSubtask: (subtaskId: string, taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onToggleSubtask,
}) => {
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.isCompleted).length;
  const overdue = task.status !== "done" && isOverdue(task.dueDate);

  const handleCheckboxClick = () => {
    const nextStatus = task.status === "done" ? "todo" : "done";
    onStatusChange(task.id, nextStatus);
  };

  return (
    <div className="relative group rounded-2xl glass-card border border-slate-800/80 p-4 transition-all duration-200 hover:border-slate-700/80 hover:shadow-xl bg-slate-900/40">
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={handleCheckboxClick}
          className="mt-0.5 text-slate-500 hover:text-indigo-400 transition-colors shrink-0"
          title={task.status === "done" ? "Tandai belum selesai" : "Tandai selesai"}
        >
          {task.status === "done" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>

        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4
              onClick={() => onEdit(task)}
              className={`text-sm font-semibold text-slate-100 cursor-pointer hover:text-indigo-300 transition-colors truncate ${
                task.status === "done" ? "line-through text-slate-500" : ""
              }`}
            >
              {task.title}
            </h4>

            {/* Action Menu */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-40 rounded-xl glass-panel bg-slate-900 shadow-xl border border-slate-700/80 py-1.5 z-20 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEdit(task);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Detail
                    </button>

                    <div className="my-1 border-t border-slate-800" />

                    <div className="px-3 py-1 text-[10px] uppercase font-semibold text-slate-500">
                      Ubah Status
                    </div>
                    {task.status !== "todo" && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onStatusChange(task.id, "todo");
                        }}
                        className="w-full text-left px-3 py-1 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" /> Belum Mulai
                      </button>
                    )}
                    {task.status !== "in_progress" && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onStatusChange(task.id, "in_progress");
                        }}
                        className="w-full text-left px-3 py-1 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Clock className="w-3.5 h-3.5 text-indigo-400" /> Sedang Berjalan
                      </button>
                    )}
                    {task.status !== "done" && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onStatusChange(task.id, "done");
                        }}
                        className="w-full text-left px-3 py-1 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Selesai
                      </button>
                    )}

                    <div className="my-1 border-t border-slate-800" />

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDelete(task.id);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus Tugas
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Badges & Meta */}
          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
            {task.similarityScore !== undefined && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                ✨ {Math.round(task.similarityScore * 100)}% Relevan
              </span>
            )}

            <Badge priority={task.priority} />

            {task.category && (
              <Badge
                variant="category"
                colorHex={task.category.colorHex}
              >
                {task.category.name}
              </Badge>
            )}

            {task.dueDate && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${
                  overdue
                    ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                    : "bg-slate-800/80 text-slate-400 border border-slate-700/40"
                }`}
              >
                <Calendar className="w-3 h-3" />
                {formatRelativeDate(task.dueDate)}
              </span>
            )}

            {/* Subtasks Counter Trigger */}
            {subtasks.length > 0 && (
              <button
                onClick={() => setShowSubtasks(!showSubtasks)}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-750 text-indigo-300 border border-slate-700/60 transition-colors"
              >
                <span>
                  {completedSubtasks}/{subtasks.length} Subtask
                </span>
                {showSubtasks ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            )}
          </div>

          {/* Subtasks Accordion Content */}
          {showSubtasks && subtasks.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5 animate-in fade-in duration-150">
              {subtasks.map((st: Subtask) => (
                <div
                  key={st.id}
                  onClick={() => onToggleSubtask(st.id, task.id)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800/40 cursor-pointer text-xs group/sub"
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                      st.isCompleted
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                        : "border-slate-600 group-hover/sub:border-slate-400"
                    }`}
                  >
                    {st.isCompleted && <Check className="w-3 h-3" />}
                  </div>
                  <span
                    className={`truncate ${
                      st.isCompleted
                        ? "line-through text-slate-500"
                        : "text-slate-300"
                    }`}
                  >
                    {st.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
