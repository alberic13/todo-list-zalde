import React from "react";
import { Task, TaskStatus } from "../../../types";
import {
  Calendar,
  Trash2,
  Edit2,
  ArrowRightLeft,
  MessageSquare,
  Share2,
  LogOut,
} from "lucide-react";
import { calendarService } from "../../../services/calendarService";

export interface TaskCardMenuDropdownProps {
  task: Task;
  openUpwards: boolean;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onOpenChat?: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onRequestLeave: () => void;
  onStatusChange?: (id: string, status: string) => void;
  onCopyInvite: (e: React.MouseEvent) => void;
  availableMoveOptions: Array<{
    status: TaskStatus;
    label: string;
    dotColor: string;
  }>;
}

export const TaskCardMenuDropdown: React.FC<TaskCardMenuDropdownProps> = ({
  task,
  openUpwards,
  menuRef,
  onClose,
  onOpenChat,
  onEdit,
  onDelete,
  onRequestLeave,
  onStatusChange,
  onCopyInvite,
  availableMoveOptions,
}) => {
  return (
    <>
      <div
        className="fixed inset-0 z-30"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
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
            onClose();
            onOpenChat?.(task);
          }}
          className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5 text-indigo-600" /> Buka Diskusi
        </button>

        <button
          type="button"
          onClick={onCopyInvite}
          className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-indigo-600" /> Salin Link Undangan
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
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
            onClick={onClose}
            className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" /> Ke Google Cal
          </a>
        )}

        <div className="my-1 border-t border-slate-100" />
        <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Pindah ke:
        </div>
        {availableMoveOptions.map((opt) => (
          <button
            key={opt.status}
            type="button"
            onClick={() => {
              onClose();
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
        {task.isOwner === false ? (
          <button
            type="button"
            onClick={() => {
              onClose();
              onRequestLeave();
            }}
            className="w-full text-left px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Tinggalkan Tugas
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(task.id);
            }}
            className="w-full text-left px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Hapus Tugas
          </button>
        )}
      </div>
    </>
  );
};
