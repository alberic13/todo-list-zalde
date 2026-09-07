import React from "react";
import { Task } from "../../../types";
import { Badge } from "../../ui/Badge";
import { formatRelativeDate, isOverdue } from "../../../utils/date";
import { Calendar } from "lucide-react";

export interface TaskCardBadgesProps {
  task: Task;
}

export const TaskCardBadges: React.FC<TaskCardBadgesProps> = ({ task }) => {
  const overdue = task.status !== "done" && isOverdue(task.dueDate);

  return (
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
  );
};
