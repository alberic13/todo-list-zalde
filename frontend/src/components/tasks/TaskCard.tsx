import React, { useState, useEffect } from "react";
import { Task } from "../../types";
import { Badge } from "../ui/Badge";
import { formatRelativeDate, isOverdue } from "../../utils/date";
import {
  Calendar,
  GripVertical,
  CheckSquare,
  MessageSquare,
} from "lucide-react";
import { TaskCardMenu } from "./card/TaskCardMenu";
import { TaskCardSubtasks } from "./card/TaskCardSubtasks";
import { TaskCardCollaborators, CollaboratorInfo } from "./card/TaskCardCollaborators";

export interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
  onToggleSubtask: (subtaskId: string, taskId: string) => void;
  onOpenChat?: (task: Task) => void;
  isDragging?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = React.memo(({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onToggleSubtask,
  onOpenChat,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDragged, setIsDragged] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // ponytail: matchMedia check covers mobile/desktop split; add touch-action or dnd-kit when complex touch gestures required
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 768px)").matches : true
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.isCompleted).length;
  const overdue = task.status !== "done" && isOverdue(task.dueDate);

  const collaboratorsList = React.useMemo<CollaboratorInfo[]>(() => {
    const list: CollaboratorInfo[] = [];
    const seen = new Set<string>();

    if (task.collaborators && Array.isArray(task.collaborators)) {
      task.collaborators.forEach((c) => {
        const u = c.user;
        if (u && u.name && !seen.has(u.id)) {
          seen.add(u.id);
          list.push({ id: u.id, name: u.name, role: c.role || "Kolaborator" });
        }
      });
    }

    if (task.isOwner === false && task.user && task.user.name && !seen.has(task.user.id)) {
      seen.add(task.user.id);
      list.unshift({ id: task.user.id, name: task.user.name, role: "Pemilik" });
    }

    return list;
  }, [task.collaborators, task.isOwner, task.user]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isDesktop) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";
    setIsDragged(true);
  };

  const handleDragEnd = () => {
    setIsDragged(false);
  };

  const getPriorityDot = (p: string) => {
    switch (p) {
      case "urgent":
        return "bg-rose-500 shadow-rose-500/50 shadow-sm ring-2 ring-rose-200";
      case "high":
        return "bg-amber-500 ring-2 ring-amber-200";
      case "medium":
        return "bg-sky-500 ring-2 ring-sky-200";
      default:
        return "bg-slate-400 ring-2 ring-slate-200";
    }
  };

  return (
    <div
      draggable={isDesktop}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className={`group relative rounded-2xl bg-white border border-slate-200/80 p-3 transition-all duration-300 ease-out hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] hover:border-slate-300/90 hover:bg-white select-none ${
        isDesktop ? "cursor-grab active:cursor-grabbing" : ""
      } ${
        isDragged
          ? "opacity-40 scale-95 border-indigo-400 shadow-lg"
          : "hover:-translate-y-0.5"
      } ${isMenuOpen ? "z-30 ring-2 ring-slate-900/10 shadow-lg" : "hover:z-10"}`}
    >
      {/* 1. Compact Header Row (Always Visible) */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Drag Grip Handle - Desktop only */}
          <div className="hidden md:block text-slate-300 group-hover:text-slate-500 transition-colors shrink-0">
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          {/* Priority Status Dot Indicator */}
          <span
            className={`w-2 h-2 rounded-full shrink-0 transition-transform group-hover:scale-110 ${getPriorityDot(
              task.priority
            )}`}
            title={`Prioritas: ${task.priority}`}
          />

          {/* Task Title */}
          <h4
            className={`text-xs font-bold text-slate-900 transition-colors truncate flex-1 select-none ${
              task.status === "done" ? "line-through text-slate-400 font-medium" : ""
            }`}
          >
            {task.title}
          </h4>
        </div>

        {/* Compact Right Meta Indicators */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mini subtask counter pill */}
          {subtasks.length > 0 && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-lg border transition-all ${
                completedSubtasks === subtasks.length
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-50 text-slate-600 border-slate-200 group-hover:border-slate-300"
              }`}
            >
              <CheckSquare className="w-2.5 h-2.5" />
              <span>
                {completedSubtasks}/{subtasks.length}
              </span>
            </span>
          )}

          {/* Mini Chat / Diskusi button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenChat?.(task);
            }}
            title="Diskusi Kolaboratif Tugas"
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-lg border border-indigo-200 bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-2.5 h-2.5 text-indigo-600" />
            <span className="hidden sm:inline">Diskusi</span>
          </button>

          {/* Options Menu Trigger & Dropdown */}
          <TaskCardMenu
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            onOpenChat={onOpenChat}
            onMenuToggle={setIsMenuOpen}
          />
        </div>
      </div>

      {/* 2. Expandable Body Details */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isHovered || isMenuOpen
            ? "max-h-96 opacity-100 mt-2.5 pt-2.5 border-t border-slate-100"
            : "max-h-0 opacity-0 group-hover:max-h-96 group-hover:opacity-100 group-hover:mt-2.5 group-hover:pt-2.5 group-hover:border-t group-hover:border-slate-100"
        }`}
      >
        {/* Description */}
        {task.description && (
          <p className="text-xs text-slate-500 mb-2.5 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Badges & Meta Tags */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs mb-2">
          {task.similarityScore !== undefined && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              ✨ {Math.round(task.similarityScore * 100)}% Relevan
            </span>
          )}

          <Badge priority={task.priority} />

          {task.category && (
            <Badge variant="category" colorHex={task.category.colorHex}>
              {task.category.name}
            </Badge>
          )}

          {task.dueDate && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                overdue
                  ? "bg-rose-50 text-rose-700 border-rose-200 font-bold"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              <Calendar className="w-3 h-3" />
              {formatRelativeDate(task.dueDate)}
            </span>
          )}
        </div>

        {/* Subtasks Checklist Interactive List */}
        <TaskCardSubtasks
          subtasks={subtasks}
          taskId={task.id}
          onToggleSubtask={onToggleSubtask}
        />

        {/* Kolaborator Profile Badges */}
        <TaskCardCollaborators
          task={task}
          collaboratorsList={collaboratorsList}
        />
      </div>
    </div>
  );
});
