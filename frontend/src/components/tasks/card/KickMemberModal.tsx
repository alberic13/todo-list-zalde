import React, { useState, useEffect } from "react";
import { Modal } from "../../ui/Modal";
import { collaborationService } from "../../../services/collaborationService";
import { TaskCollaboratorMember } from "../../../types";
import { UserX, AlertTriangle, Loader2 } from "lucide-react";

export interface KickMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  ownerId?: string;
  onSuccess?: (kickedUserId: string) => void;
}

export const KickMemberModal: React.FC<KickMemberModalProps> = ({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  ownerId,
  onSuccess,
}) => {
  const [members, setMembers] = useState<TaskCollaboratorMember[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setMembers([]);
      setSelectedUserId("");
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    collaborationService
      .getCollaborators(taskId)
      .then((data) => {
        const kickable = data.filter((m) => {
          const uId = m.userId || m.id;
          return !m.isOwner && uId !== ownerId;
        });
        setMembers(kickable);
        if (kickable.length > 0) setSelectedUserId(kickable[0].userId || kickable[0].id);
      })
      .catch((err: any) => setError(err.message || "Gagal memuat anggota."))
      .finally(() => setIsLoading(false));
  }, [isOpen, taskId, ownerId]);

  const handleKick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await collaborationService.removeCollaborator(taskId, selectedUserId);
      try {
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
          const channel = new BroadcastChannel("zalde_collaboration_events");
          channel.postMessage({ type: "TASK_UPDATE", taskId });
          channel.close();
        }
      } catch {}
      onSuccess?.(selectedUserId);
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal mengeluarkan anggota dari tugas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMember = members.find((m) => (m.userId || m.id) === selectedUserId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      title={
        <span className="flex items-center gap-2 text-rose-600">
          <UserX className="w-5 h-5 text-rose-500" />
          Kick Member
        </span>
      }
      description={`Keluarkan anggota dari kolaborasi tugas "${taskTitle}"`}
    >
      {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs font-medium">
          <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
          <span>Memuat anggota kolaborator...</span>
        </div>
      ) : members.length === 0 ? (
        <div className="py-6 text-center space-y-3">
          <p className="text-xs text-slate-500 font-medium">
            Tidak ada anggota kolaborator yang bergabung pada tugas ini.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      ) : (
        <form onSubmit={handleKick} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="select-member-to-kick" className="block text-xs font-bold text-slate-700">
              Pilih Anggota Kolaborator
            </label>
            <select
              id="select-member-to-kick"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 font-semibold focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10 transition-all outline-none cursor-pointer"
            >
              {members.map((m) => {
                const uId = m.userId || m.id;
                const name = m.user?.name || m.name || "Member";
                const email = m.user?.email || m.email || "";
                return (
                  <option key={uId} value={uId}>
                    {name} {email ? `(${email})` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {selectedMember && (
            <div className="p-3 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-500 text-white font-bold text-xs flex items-center justify-center uppercase shrink-0 shadow-xs">
                {(selectedMember.user?.name || selectedMember.name || "U").charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {selectedMember.user?.name || selectedMember.name}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {selectedMember.user?.email || selectedMember.email}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-800 text-[11px] font-medium leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>Anggota yang di-kick akan langsung kehilangan akses kolaborasi ke tugas ini.</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedUserId}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <UserX className="w-3.5 h-3.5" />
                  <span>Kick Member</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
