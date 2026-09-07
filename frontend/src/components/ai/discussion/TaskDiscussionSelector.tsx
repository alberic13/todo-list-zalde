import React from "react";
import { Task } from "../../../types";
import { Users } from "lucide-react";

export interface TaskDiscussionSelectorProps {
  tasks?: Task[];
  onSelectTask?: (task: Task) => void;
}

export const TaskDiscussionSelector: React.FC<TaskDiscussionSelectorProps> = ({
  tasks = [],
  onSelectTask,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 shadow-sm">
        <Users className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-bold text-slate-800 mb-1">Pilih Tugas untuk Didiskusikan</h4>
      <p className="text-xs text-slate-500 max-w-xs mb-4">
        Pilih salah satu tugas dari daftar di bawah ini untuk membuka ruang obrolan tim.
      </p>
      <div className="w-full space-y-2 max-h-72 overflow-y-auto pr-1">
        {tasks.map((t) => (
          <div
            key={t.id}
            onClick={() => onSelectTask?.(t)}
            className="p-3 rounded-2xl bg-white/80 hover:bg-white border border-slate-200/80 hover:border-indigo-300 text-left cursor-pointer transition-all shadow-xs flex items-center justify-between gap-2"
          >
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{t.title}</p>
              <p className="text-[10px] text-slate-400 capitalize">Status: {t.status}</p>
            </div>
            <button
              type="button"
              className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-xl shrink-0 transition-colors"
            >
              Buka Diskusi
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
