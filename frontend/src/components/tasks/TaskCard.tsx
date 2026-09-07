import React, { useState, useRef, useEffect } from "react";
import { Task, TaskStatus } from "../../types";
import { Badge } from "../ui/Badge";
import { formatRelativeDate, isOverdue } from "../../utils/date";
import {
  Calendar,
  MoreVertical,
  Trash2,
  Edit2,
  Check,
  GripVertical,
  CheckSquare,
  ArrowRightLeft,
  MessageSquare,
  Share2,
} from "lucide-react";
import { calendarService } from "../../services/calendarService";
import { collaborationService } from "../../services/collaborationService";

const MOVE_STATUS_OPTIONS: Array<{
  status: TaskStatus;
  label: string;
  dotColor: string;
}> = [
  { status: "todo", label: "Belum Mulai", dotColor: "bg-slate-400" },
  { status: "in_progress", label: "Sedang Berjalan", dotColor: "bg-indigo-500" },
  { status: "done", label: "Selesai", dotColor: "bg-emerald-500" },
];

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
  const [showMenu, setShowMenu] = useState(false);
  const [isDragged, setIsDragged] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showMenu]);

  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showMenu && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollParent = triggerRef.current.closest('.overflow-y-auto');
      const parentRect = scrollParent ? scrollParent.getBoundingClientRect() : null;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAboveInParent = parentRect ? rect.top - parentRect.top : rect.top;

      // Only open upwards if cramped below AND there is enough headroom inside scroll container
      setOpenUpwards(spaceBelow < 230 && spaceAboveInParent >= 230);
    }
    setShowMenu((prev) => !prev);
  };

  const handleCopyInvite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    try {
      let code = task.inviteCode;
      if (!code) {
        const res = await collaborationService.getInviteCode(task.id);
        code = res.inviteCode;
      }
      const url = collaborationService.buildInviteUrl(code);
      await navigator.clipboard.writeText(url);
      alert("Link undangan kolaborasi berhasil disalin ke clipboard!");
    } catch (err) {
      console.error("Gagal menyalin link:", err);
    }
  };

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.isCompleted).length;
  const overdue = task.status !== "done" && isOverdue(task.dueDate);

  const collaboratorsList = React.useMemo(() => {
    const list: Array<{ id: string; name: string; role: string }> = [];
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

  // Available move target statuses excluding current status
  const availableMoveOptions = MOVE_STATUS_OPTIONS.filter((opt) => opt.status !== task.status);

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
      } ${showMenu ? "z-30 ring-2 ring-slate-900/10 shadow-lg" : "hover:z-10"}`}
    >
      {/* 1. Compact Header Row (Always Visible as a Clean List Item) */}
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

        {/* Compact Right Meta Indicators (Subtask badge & Due Date) */}
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
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-lg border border-indigo-200 bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 transition-colors"
          >
            <MessageSquare className="w-2.5 h-2.5 text-indigo-600" />
            <span className="hidden sm:inline">Diskusi</span>
          </button>

          {/* Options Menu Trigger */}
          <div className="relative" ref={triggerRef}>
            <button
              type="button"
              onClick={handleToggleMenu}
              className="text-slate-400 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <div
                  ref={menuRef}
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute right-0 ${
                    openUpwards ? "bottom-full mb-1" : "top-full mt-1"
                  } w-44 rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl border border-slate-200/90 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150`}
                >
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenChat?.(task);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-600" /> Buka Diskusi
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyInvite}
                    className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-indigo-600" /> Salin Link Undangan
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(task);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-indigo-600" /> {task.isOwner === false ? "Lihat Detail" : "Edit Detail"}
                  </button>
                  {task.dueDate && (
                    <a
                      href={calendarService.generateGoogleCalendarUrl({
                        title: task.title,
                        description: task.description,
                        dueDate: task.dueDate,
                        priority: task.priority,
                      })}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setShowMenu(false)}
                      className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-blue-600" /> Ke Google Cal
                    </a>
                  )}

                  {/* Section Pindah Status */}
                  <div className="my-1 border-t border-slate-100" />
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Pindah ke:
                  </div>
                  {availableMoveOptions.map((opt) => (
                    <button
                      key={opt.status}
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onStatusChange?.(task.id, opt.status);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className={`w-2 h-2 rounded-full ${opt.dotColor} shrink-0`} />
                      <span className="truncate">{opt.label}</span>
                    </button>
                  ))}

                  <div className="my-1 border-t border-slate-100" />
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(task.id);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {task.isOwner === false ? "Tinggalkan Tugas" : "Hapus Tugas"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Expandable Body Details (Smoothly reveals and expands on Hover or when Menu is open) */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isHovered || showMenu
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
        {subtasks.length > 0 && (
          <div className="space-y-1.5 pt-1.5">
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-slate-900 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(completedSubtasks / subtasks.length) * 100}%`,
                }}
              />
            </div>

            {/* Checklist Items */}
            <div className="space-y-1 mt-2 max-h-32 overflow-y-auto pr-1">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSubtask(st.id, task.id);
                  }}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group/item"
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center transition-all ${
                      st.isCompleted
                        ? "bg-slate-900 border-slate-900 text-white"
                        : "border-slate-300 bg-white group-hover/item:border-slate-400"
                    }`}
                  >
                    {st.isCompleted && <Check className="w-2.5 h-2.5 stroke-[3]" />}
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
          </div>
        )}

        {/* Kolaborator Profile Badges di bawah checklist subtask */}
        {(collaboratorsList.length > 0 || (task.collaboratorCount !== undefined && task.collaboratorCount > 0) || task.isOwner === false) && (
          <div className="pt-2 mt-1.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
            {collaboratorsList.length > 0 ? (
              collaboratorsList.map((collab) => (
                <div
                  key={collab.id}
                  className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200/80 text-slate-700 shadow-2xs hover:bg-slate-100 transition-colors"
                  title={`${collab.name} (${collab.role})`}
                >
                  <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-[10px] ring-1 ring-white shrink-0">
                    {(collab.name || "U")[0].toUpperCase()}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[130px]">
                    {collab.name}
                  </span>
                </div>
              ))
            ) : (
              <div className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200/80 text-slate-700 shadow-2xs">
                <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-[10px] ring-1 ring-white shrink-0">
                  {(task.user?.name || "K")[0].toUpperCase()}
                </div>
                <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[130px]">
                  {task.user?.name || (task.isOwner === false ? "Kolaborator" : `${task.collaboratorCount} Kolaborator`)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
