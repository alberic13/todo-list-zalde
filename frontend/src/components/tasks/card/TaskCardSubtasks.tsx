import React from "react";
import { Subtask } from "../../../types";
import { Check } from "lucide-react";

export interface TaskCardSubtasksProps {
  subtasks: Subtask[];
  taskId: string;
  onToggleSubtask: (subtaskId: string, taskId: string) => void;
}

export const TaskCardSubtasks: React.FC<TaskCardSubtasksProps> = ({
  subtasks,
  taskId,
  onToggleSubtask,
}) => {
  if (!subtasks || subtasks.length === 0) return null;

  const completedCount = subtasks.filter((s) => s.isCompleted).length;
  const progressPercent = (completedCount / subtasks.length) * 100;

  return (
    <div className="space-y-1.5 pt-1.5">
      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-slate-900 h-full rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Checklist Items */}
      <div className="space-y-1 mt-2 max-h-32 overflow-y-auto pr-1">
        {subtasks.map((st) => (
          <div
            key={st.id}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSubtask(st.id, taskId);
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
  );
};
