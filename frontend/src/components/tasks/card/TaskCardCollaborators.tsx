import React, { useMemo, useState } from "react";
import { Task } from "../../../types";
import { UserX } from "lucide-react";
import { KickMemberModal } from "./KickMemberModal";

export interface CollaboratorInfo {
  id: string;
  name: string;
  role: string;
}

export interface TaskCardCollaboratorsProps {
  task: Task;
  collaboratorsList?: CollaboratorInfo[];
}

export const TaskCardCollaborators: React.FC<TaskCardCollaboratorsProps> = ({
  task,
  collaboratorsList: propCollaboratorsList,
}) => {
  const [isKickModalOpen, setIsKickModalOpen] = useState(false);

  const computedList = useMemo<CollaboratorInfo[]>(() => {
    if (propCollaboratorsList) return propCollaboratorsList;

    const list: CollaboratorInfo[] = [];
    const seen = new Set<string>();

    const hasCollaboration =
      (task.collaborators && task.collaborators.length > 0) ||
      (task.collaboratorCount !== undefined && task.collaboratorCount > 0) ||
      task.isOwner === false;

    if (task.collaborators && Array.isArray(task.collaborators)) {
      task.collaborators.forEach((c) => {
        const u = c.user;
        if (u && u.name && !seen.has(u.id)) {
          seen.add(u.id);
          list.push({ id: u.id, name: u.name, role: c.role || "Kolaborator" });
        }
      });
    }

    if (hasCollaboration && task.user && task.user.name && !seen.has(task.user.id)) {
      seen.add(task.user.id);
      list.unshift({ id: task.user.id, name: task.user.name, role: "Pemilik" });
    }

    return list;
  }, [task.collaborators, task.collaboratorCount, task.isOwner, task.user, propCollaboratorsList]);

  const isOwner = task.isOwner !== false;
  const hasCollaborators =
    computedList.length > 0 ||
    (task.collaboratorCount !== undefined && task.collaboratorCount > 0) ||
    task.isOwner === false;

  const hasCollaboratorToKick =
    computedList.some((c) => c.role !== "Pemilik" && c.id !== task.userId) ||
    (task.collaboratorCount !== undefined && task.collaboratorCount > 0 && isOwner);

  if (!hasCollaborators) return null;

  return (
    <>
      <div className="pt-2 mt-1.5 border-t border-slate-100 flex items-center justify-between gap-2">
        {/* Left: overlapping avatars */}
        <div className="flex items-center -space-x-2.5">
          {computedList.length > 0 ? (
            computedList.map((collab) => (
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

        {/* Right: Kick Member button (Owner only) */}
        {isOwner && hasCollaboratorToKick && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsKickModalOpen(true);
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 transition-colors cursor-pointer shrink-0"
            title="Pilih dan keluarkan anggota kolaborator"
          >
            <UserX className="w-3 h-3 text-rose-500" />
            <span>Kick Member</span>
          </button>
        )}
      </div>

      {isKickModalOpen && (
        <KickMemberModal
          isOpen={isKickModalOpen}
          onClose={() => setIsKickModalOpen(false)}
          taskId={task.id}
          taskTitle={task.title}
          ownerId={task.userId}
        />
      )}
    </>
  );
};
