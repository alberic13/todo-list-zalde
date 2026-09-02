import React, { useState } from "react";
import { Task } from "../../types";
import { Badge } from "../ui/Badge";
import { formatRelativeDate, isOverdue } from "../../utils/date";
import {
  Calendar,
  MoreVertical,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  Check,
  GripVertical,
} from "lucide-react";

export interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
  onToggleSubtask: (subtaskId: string, taskId: string) => void;
  isDragging?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onToggleSubtask,
}) => {
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDragged, setIsDragged] = useState(false);

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.isCompleted).length;
  const overdue = task.status !== "done" && isOverdue(task.dueDate);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";
    setIsDragged(true);
  };

  const handleDragEnd = () => {
    setIsDragged(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`relative group rounded-2xl bg-white border border-slate-100/90 p-4 transition-all duration-200 hover:border-slate-200/90 hover:shadow-[0_10px_25px_rgba(0,0,0,0.06)] cursor-grab active:cursor-grabbing select-none ${
        isDragged
          ? "opacity-40 scale-95 border-indigo-400 shadow-lg"
          : "hover:-translate-y-0.5"
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Drag Handle Indicator */}
        <div className="mt-0.5 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0">
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className={`text-sm font-bold text-slate-900 cursor-pointer hover:text-indigo-600 transition-colors truncate ${
                task.status === "done" ? "line-through text-slate-400 font-medium" : ""
              }`}
            >
              {task.title}
            </h4>

            {/* Action Menu */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="text-slate-400 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                    }}
                  />
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-full mt-1 w-40 rounded-2xl bg-white/95 backdrop-blur-xl shadow-xl border border-slate-200/90 py-1.5 z-20 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEdit(task);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-2"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Detail
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDelete(task.id);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
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
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Badges & Meta */}
          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
            {task.similarityScore !== undefined && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
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
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                  overdue
                    ? "bg-rose-50 text-rose-700 border-rose-200 font-bold animate-pulse"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                <Calendar className="w-3 h-3" />
                {formatRelativeDate(task.dueDate)}
              </span>
            )}
          </div>

          {/* Subtasks Collapsible */}
          {subtasks.length > 0 && (
            <div className="mt-3.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSubtasks(!showSubtasks)}
                className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-800 transition-colors font-semibold"
              >
                <span>
                  Checklist ({completedSubtasks}/{subtasks.length})
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  {showSubtasks ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </span>
              </button>

              {/* Mini progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                <div
                  className="bg-slate-900 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(completedSubtasks / subtasks.length) * 100}%`,
                  }}
                />
              </div>

              {/* Subtask list */}
              {showSubtasks && (
                <div className="space-y-1.5 mt-2.5">
                  {subtasks.map((st) => (
                    <div
                      key={st.id}
                      onClick={() => onToggleSubtask(st.id, task.id)}
                      className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                          st.isCompleted
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {st.isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span
                        className={`text-xs select-none truncate ${
                          st.isCompleted
                            ? "line-through text-slate-400 font-normal"
                            : "text-slate-700 font-medium"
                        }`}
                      >
                        {st.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
