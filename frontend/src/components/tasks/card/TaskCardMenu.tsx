import React, { useState, useRef, useEffect } from "react";
import { Task, TaskStatus } from "../../../types";
import { MoreVertical } from "lucide-react";
import { collaborationService } from "../../../services/collaborationService";
import { ConfirmModal } from "../../ui/ConfirmModal";
import { TaskCardMenuDropdown } from "./TaskCardMenuDropdown";

const MOVE_STATUS_OPTIONS: Array<{
  status: TaskStatus;
  label: string;
  dotColor: string;
}> = [
  { status: "todo", label: "Belum Mulai", dotColor: "bg-slate-400" },
  { status: "in_progress", label: "Sedang Berjalan", dotColor: "bg-indigo-500" },
  { status: "done", label: "Selesai", dotColor: "bg-emerald-500" },
];

export interface TaskCardMenuProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onLeaveTask?: (id: string) => void | Promise<void>;
  onStatusChange?: (id: string, status: string) => void;
  onOpenChat?: (task: Task) => void;
  onMenuToggle?: (isOpen: boolean) => void;
}

export const TaskCardMenu: React.FC<TaskCardMenuProps> = ({
  task,
  onEdit,
  onDelete,
  onLeaveTask,
  onStatusChange,
  onOpenChat,
  onMenuToggle,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const updateMenuState = (open: boolean) => {
    setShowMenu(open);
    onMenuToggle?.(open);
  };

  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        updateMenuState(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showMenu]);

  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showMenu && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollParent = triggerRef.current.closest(".overflow-y-auto");
      const parentRect = scrollParent ? scrollParent.getBoundingClientRect() : null;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = parentRect ? rect.top - parentRect.top : rect.top;
      setOpenUpwards(spaceBelow < 230 && spaceAbove >= 230);
    }
    updateMenuState(!showMenu);
  };

  const handleCopyInvite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    updateMenuState(false);
    try {
      let code = task.inviteCode;
      if (!code) {
        const res = await collaborationService.getInviteCode(task.id);
        code = res.inviteCode;
      }
      const url = collaborationService.buildInviteUrl(code);
      await navigator.clipboard.writeText(url);
      alert("Link undangan kolaborasi berhasil disalin ke clipboard!");
    } catch (err) {
      console.error("Gagal menyalin link:", err);
    }
  };

  const handleConfirmLeave = async () => {
    try {
      setIsLeaving(true);
      if (onLeaveTask) {
        await onLeaveTask(task.id);
      } else {
        onDelete(task.id);
      }
      setShowLeaveConfirm(false);
    } catch (err: any) {
      alert(err.message || "Gagal meninggalkan tugas");
    } finally {
      setIsLeaving(false);
    }
  };

  const availableMoveOptions = MOVE_STATUS_OPTIONS.filter((opt) => opt.status !== task.status);

  return (
    <div className="relative" ref={triggerRef}>
      <button
        type="button"
        onClick={handleToggleMenu}
        className="text-slate-400 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        aria-label="Pilihan tugas"
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>

      {showMenu && (
        <TaskCardMenuDropdown
          task={task}
          openUpwards={openUpwards}
          menuRef={menuRef}
          onClose={() => updateMenuState(false)}
          onOpenChat={onOpenChat}
          onEdit={onEdit}
          onDelete={onDelete}
          onRequestLeave={() => setShowLeaveConfirm(true)}
          onStatusChange={onStatusChange}
          onCopyInvite={handleCopyInvite}
          availableMoveOptions={availableMoveOptions}
        />
      )}

      {showLeaveConfirm && (
        <ConfirmModal
          isOpen={showLeaveConfirm}
          onClose={() => setShowLeaveConfirm(false)}
          onConfirm={handleConfirmLeave}
          title="Tinggalkan Tugas Kolaborasi?"
          description={
            <span>
              Apakah Anda yakin ingin keluar dari kolaborasi tugas{" "}
              <strong className="text-slate-800">"{task.title}"</strong>? Anda tidak akan dapat mengakses tugas ini lagi kecuali diundang kembali.
            </span>
          }
          confirmLabel="Tinggalkan Tugas"
          cancelLabel="Batal"
          variant="danger"
          iconType="logout"
          isLoading={isLeaving}
        />
      )}
    </div>
  );
};
