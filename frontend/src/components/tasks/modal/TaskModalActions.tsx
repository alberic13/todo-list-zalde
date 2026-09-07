import React from "react";
import { Button } from "../../ui/Button";
import { Calendar, ExternalLink } from "lucide-react";
import { calendarService } from "../../../services/calendarService";
import { TaskPriority } from "../../../types";

export interface TaskModalActionsProps {
  isEdit: boolean;
  isLoading: boolean;
  dueDate?: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  onClose: () => void;
}

export const TaskModalActions: React.FC<TaskModalActionsProps> = ({
  isEdit,
  isLoading,
  dueDate,
  title,
  description,
  priority,
  onClose,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
      {dueDate ? (
        <a
          href={calendarService.generateGoogleCalendarUrl({
            title: title || "Tugas Tanpa Judul",
            description,
            dueDate,
            priority,
          })}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 hover:text-indigo-600 transition shadow-sm group whitespace-nowrap shrink-0"
          title="Tambahkan langsung tugas ini ke Google Calendar Anda"
        >
          <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>Ke Google Calendar</span>
          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
        </a>
      ) : (
        <div />
      )}

      <div className="flex items-center justify-end gap-2 shrink-0 sm:ml-auto">
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {isEdit ? "Simpan Perubahan" : "Buat Tugas"}
        </Button>
      </div>
    </div>
  );
};
