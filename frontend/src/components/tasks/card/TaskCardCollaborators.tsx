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
    <div className="pt-2 mt-1.5 border-t border-slate-100 flex items-center -space-x-2.5">
      {collaboratorsList.length > 0 ? (
        collaboratorsList.map((collab) => (
          <div
            key={collab.id}
            className="relative w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-[10px] ring-2 ring-white shrink-0 shadow-xs hover:z-10 hover:scale-110 transition-all cursor-pointer"
            title={`${collab.name} (${collab.role})`}
          >
            {(collab.name || "U")[0].toUpperCase()}
          </div>
        ))
      ) : (
        <div
          className="relative w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-[10px] ring-2 ring-white shrink-0 shadow-xs hover:z-10 hover:scale-110 transition-all cursor-pointer"
          title={
            task.user?.name ||
            (task.isOwner === false ? "Kolaborator" : `${task.collaboratorCount} Kolaborator`)
          }
        >
          {(task.user?.name || "K")[0].toUpperCase()}
        </div>
      )}
    </div>
  );
};
