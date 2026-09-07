import React from "react";
import { TaskPriority, TaskStatus } from "../../../types";

export interface TaskStatusPriorityFieldsProps {
  priority: TaskPriority;
  status: TaskStatus;
  onChangePriority: (priority: TaskPriority) => void;
  onChangeStatus: (status: TaskStatus) => void;
}

export const TaskStatusPriorityFields: React.FC<TaskStatusPriorityFieldsProps> = ({
  priority,
  status,
  onChangePriority,
  onChangeStatus,
}) => {
  return (
    <>
      {/* Priority */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700">
          Prioritas
        </label>
        <select
          value={priority}
          onChange={(e) => onChangePriority(e.target.value as TaskPriority)}
          className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 cursor-pointer shadow-sm font-semibold"
        >
          <option value="urgent">🔴 Urgent</option>
          <option value="high">🟠 Tinggi</option>
          <option value="medium">🔵 Sedang</option>
          <option value="low">⚪ Rendah</option>
        </select>
      </div>

      {/* Status */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => onChangeStatus(e.target.value as TaskStatus)}
          className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 cursor-pointer shadow-sm font-semibold"
        >
          <option value="todo">Belum Mulai</option>
          <option value="in_progress">Sedang Berjalan</option>
          <option value="done">Selesai</option>
        </select>
      </div>
    </>
  );
};
