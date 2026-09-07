import React, { useState, useEffect } from "react";
import { Task, TaskCollaboratorMember } from "../../../types";
import { collaborationService } from "../../../services/collaborationService";
import { Users, MessageSquare, Share2, Check, UserMinus, LogOut } from "lucide-react";

interface TaskCollaborationSectionProps {
  task: Task;
  isOwner: boolean;
  isOpen: boolean;
  onCloseModal: () => void;
  onOpenChat?: (task: Task) => void;
  onLeaveTask?: (taskId: string) => Promise<void> | void;
}

export const TaskCollaborationSection: React.FC<TaskCollaborationSectionProps> = ({
  task,
  isOwner,
  isOpen,
  onCloseModal,
  onOpenChat,
  onLeaveTask,
}) => {
  const [collaborators, setCollaborators] = useState<TaskCollaboratorMember[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (isOpen && task) {
      collaborationService
        .getCollaborators(task.id)
        .then((members) => setCollaborators(members))
        .catch((err) => console.error("Gagal memuat kolaborator:", err));
    } else {
      setCollaborators([]);
      setCopiedLink(false);
    }
  }, [isOpen, task]);

  const handleCopyInviteLink = async () => {
    try {
      let code = task.inviteCode;
      if (!code) {
        const res = await collaborationService.getInviteCode(task.id);
        code = res.inviteCode;
      }
      const url = collaborationService.buildInviteUrl(code);
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.error("Gagal menyalin link undangan:", err);
    }
  };

  const handleKickCollaborator = async (userId: string) => {
    if (!confirm("Hapus kolaborator ini dari tugas?")) return;
    try {
      await collaborationService.removeCollaborator(task.id, userId);
      setCollaborators((prev) => prev.filter((m) => (m.userId || m.id) !== userId));
    } catch (err) {
      console.error("Gagal mengeluarkan kolaborator:", err);
    }
  };

  const handleLeave = async () => {
    if (!confirm("Tinggalkan tugas kolaborasi ini?")) return;
    try {
      if (onLeaveTask) {
        await onLeaveTask(task.id);
      } else {
        await collaborationService.removeCollaborator(task.id, "me");
      }
      onCloseModal();
    } catch (err) {
      console.error("Gagal keluar dari tugas:", err);
    }
  };

  return (
    <div className="pt-4 border-t border-slate-100 space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-indigo-600" /> Kolaborasi & Diskusi Tim
        </label>
        {onOpenChat && (
          <button
            type="button"
            onClick={() => {
              onCloseModal();
              onOpenChat(task);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Buka Chat Diskusi
          </button>
        )}
      </div>

      {/* Share link card */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-pink-50/40 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="text-xs">
          <p className="font-bold text-slate-800 flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-indigo-600" />
            Bagikan Link Kolaborasi
          </p>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Teman yang memiliki link dapat bergabung, update status, dan mengobrol.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCopyInviteLink}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer shrink-0"
        >
          {copiedLink ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" /> Link Tersalin!
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" /> Salin Link Undangan
            </>
          )}
        </button>
      </div>

      {/* Collaborators list */}
      {collaborators.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Anggota Bergabung ({collaborators.length})
          </p>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {collaborators.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-[10px] uppercase shadow-xs">
                    {(c.user?.name || c.name || "U").charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{c.user?.name || c.name}</p>
                    <p className="text-[10px] text-slate-400">{c.user?.email || c.email}</p>
                  </div>
                </div>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => handleKickCollaborator(c.userId || c.id)}
                    title="Keluarkan dari kolaborasi"
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leave task button for collaborator */}
      {!isOwner && (
        <div className="pt-1">
          <button
            type="button"
            onClick={handleLeave}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Tinggalkan Tugas Kolaborasi
          </button>
        </div>
      )}
    </div>
  );
};
