import React from "react";
import { Task } from "../../../types";

export interface CollaboratorInfo {
  id: string;
  name: string;
  role: string;
}

export interface TaskCardCollaboratorsProps {
  task: Task;
  collaboratorsList: CollaboratorInfo[];
}

export const TaskCardCollaborators: React.FC<TaskCardCollaboratorsProps> = ({
  task,
  collaboratorsList,
}) => {
  const hasCollaborators =
    collaboratorsList.length > 0 ||
    (task.collaboratorCount !== undefined && task.collaboratorCount > 0) ||
    task.isOwner === false;

  if (!hasCollaborators) return null;

  return (
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
            {task.user?.name ||
              (task.isOwner === false ? "Kolaborator" : `${task.collaboratorCount} Kolaborator`)}
          </span>
        </div>
      )}
    </div>
  );
};
