import React, { useState, useRef, useEffect } from "react";
import { Task, TaskStatus } from "../../../types";
import {
  Calendar,
  MoreVertical,
  Trash2,
  Edit2,
  ArrowRightLeft,
  MessageSquare,
  Share2,
} from "lucide-react";
import { calendarService } from "../../../services/calendarService";
import { collaborationService } from "../../../services/collaborationService";

const MOVE_STATUS_OPTIONS: Array<{
  status: TaskStatus;
  label: string;
  dotColor: string;
}> = [
  { status: "todo", label: "Belum Mulai", dotColor: "bg-slate-400" },
  { status: "in_progress", label: "Sedang Berjalan", dotColor: "bg-indigo-500" },
  { status: "done", label: "Selesai", dotColor: "bg-emerald-500" },
];

export interface TaskCardMenuProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
  onOpenChat?: (task: Task) => void;
  onMenuToggle?: (isOpen: boolean) => void;
}

export const TaskCardMenu: React.FC<TaskCardMenuProps> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onOpenChat,
  onMenuToggle,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const updateMenuState = (open: boolean) => {
    setShowMenu(open);
    onMenuToggle?.(open);
  };

  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        updateMenuState(false);
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
      const scrollParent = triggerRef.current.closest(".overflow-y-auto");
      const parentRect = scrollParent ? scrollParent.getBoundingClientRect() : null;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAboveInParent = parentRect ? rect.top - parentRect.top : rect.top;

      setOpenUpwards(spaceBelow < 230 && spaceAboveInParent >= 230);
    }
    updateMenuState(!showMenu);
  };

  const handleCopyInvite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    updateMenuState(false);
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

  const availableMoveOptions = MOVE_STATUS_OPTIONS.filter((opt) => opt.status !== task.status);

  return (
    <div className="relative" ref={triggerRef}>
      <button
        type="button"
        onClick={handleToggleMenu}
        className="text-slate-400 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={(e) => {
              e.stopPropagation();
              updateMenuState(false);
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
              type="button"
              onClick={() => {
                updateMenuState(false);
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
              type="button"
              onClick={() => {
                updateMenuState(false);
                onEdit(task);
              }}
              className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-indigo-600" />{" "}
              {task.isOwner === false ? "Lihat Detail" : "Edit Detail"}
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
                onClick={() => updateMenuState(false)}
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
                  updateMenuState(false);
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
              type="button"
              onClick={() => {
                updateMenuState(false);
                onDelete(task.id);
              }}
              className="w-full text-left px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />{" "}
              {task.isOwner === false ? "Tinggalkan Tugas" : "Hapus Tugas"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
