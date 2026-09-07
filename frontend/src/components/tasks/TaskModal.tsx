import React, { useState, useEffect } from "react";
import { Task, Category, TaskPriority, TaskStatus, TaskCollaboratorMember } from "../../types";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import {
  Plus,
  Trash2,
  Tag,
  Check,
  Calendar,
  ExternalLink,
  Users,
  Share2,
  LogOut,
  UserMinus,
  MessageSquare,
} from "lucide-react";
import { calendarService } from "../../services/calendarService";
import { CreateTaskPayload, UpdateTaskPayload } from "../../services/taskService";
import { collaborationService } from "../../services/collaborationService";

export interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  defaultStatus?: TaskStatus;
  categories: Category[];
  onSubmit: (payload: CreateTaskPayload | UpdateTaskPayload) => Promise<void>;
  onAddCategory: (name: string, colorHex?: string) => Promise<Category>;
  onDeleteCategory?: (id: string) => Promise<void>;
  onToggleSubtask?: (subtaskId: string, taskId: string) => Promise<void> | void;
  onAddSubtask?: (taskId: string, title: string) => Promise<any> | void;
  onDeleteSubtask?: (subtaskId: string, taskId: string) => Promise<void> | void;
  onLeaveTask?: (taskId: string) => Promise<void> | void;
  onOpenChat?: (task: Task) => void;
}

interface LocalSubtaskItem {
  id?: string;
  title: string;
  isCompleted: boolean;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  defaultStatus = "todo",
  categories = [],
  onSubmit,
  onAddCategory,
  onDeleteCategory,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  onLeaveTask,
  onOpenChat,
}) => {
  const isOwner = taskToEdit?.isOwner !== false;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [categoryId, setCategoryId] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [subtasks, setSubtasks] = useState<LocalSubtaskItem[]>([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#6366f1");

  // Collaboration states
  const [collaborators, setCollaborators] = useState<TaskCollaboratorMember[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (isOpen && taskToEdit) {
      collaborationService.getCollaborators(taskToEdit.id)
        .then((members) => setCollaborators(members))
        .catch((err) => console.error("Gagal memuat kolaborator:", err));
    } else {
      setCollaborators([]);
      setCopiedLink(false);
    }
  }, [isOpen, taskToEdit]);

  const handleCopyInviteLink = async () => {
    if (!taskToEdit) return;
    try {
      let code = taskToEdit.inviteCode;
      if (!code) {
        const res = await collaborationService.getInviteCode(taskToEdit.id);
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
    if (!taskToEdit) return;
    if (!confirm("Hapus kolaborator ini dari tugas?")) return;
    try {
      await collaborationService.removeCollaborator(taskToEdit.id, userId);
      setCollaborators((prev) => prev.filter((m) => m.userId !== userId));
    } catch (err) {
      console.error("Gagal mengeluarkan kolaborator:", err);
    }
  };

  const handleLeave = async () => {
    if (!taskToEdit) return;
    if (!confirm("Tinggalkan tugas kolaborasi ini?")) return;
    try {
      if (onLeaveTask) {
        await onLeaveTask(taskToEdit.id);
      } else {
        await collaborationService.removeCollaborator(taskToEdit.id, "me");
      }
      onClose();
    } catch (err) {
      console.error("Gagal keluar dari tugas:", err);
    }
  };

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || "");
      setDescription(taskToEdit.description || "");
      setStatus(taskToEdit.status || defaultStatus || "todo");
      setPriority(taskToEdit.priority || "medium");
      setCategoryId(taskToEdit.categoryId || "");

      let safeDate = "";
      if (taskToEdit.dueDate) {
        try {
          const d = new Date(taskToEdit.dueDate);
          if (!isNaN(d.getTime())) {
            safeDate = d.toISOString().split("T")[0];
          }
        } catch {
          safeDate = "";
        }
      }
      setDueDate(safeDate);

      const raw = taskToEdit.subtasks || [];
      if (Array.isArray(raw)) {
        setSubtasks(
          raw.map((s: any) => ({
            id: typeof s === "object" ? s?.id : undefined,
            title: typeof s === "object" ? s?.title || "" : String(s),
            isCompleted: typeof s === "object" ? Boolean(s?.isCompleted) : false,
          }))
        );
      } else {
        setSubtasks([]);
      }
    } else {
      setTitle("");
      setDescription("");
      setStatus(defaultStatus || "todo");
      setPriority("medium");
      setCategoryId("");
      setDueDate("");
      setSubtasks([]);
    }
  }, [taskToEdit, defaultStatus, isOpen]);

  const handleAddSubtask = async () => {
    const trimmed = newSubtaskInput.trim();
    if (!trimmed) return;

    if (taskToEdit && onAddSubtask) {
      try {
        const created = await onAddSubtask(taskToEdit.id, trimmed);
        setSubtasks((prev) => [
          ...prev,
          {
            id: created?.id,
            title: trimmed,
            isCompleted: false,
          },
        ]);
      } catch (err) {
        console.error("Failed to add subtask:", err);
      }
    } else {
      setSubtasks((prev) => [
        ...prev,
        {
          title: trimmed,
          isCompleted: false,
        },
      ]);
    }
    setNewSubtaskInput("");
  };

  const handleToggleSubtask = async (item: LocalSubtaskItem, index: number) => {
    if (item.id && taskToEdit && onToggleSubtask) {
      try {
        await onToggleSubtask(item.id, taskToEdit.id);
        setSubtasks((prev) =>
          prev.map((s) =>
            s.id === item.id ? { ...s, isCompleted: !s.isCompleted } : s
          )
        );
      } catch (err) {
        console.error("Failed to toggle subtask:", err);
      }
    } else {
      setSubtasks((prev) =>
        prev.map((s, i) =>
          i === index ? { ...s, isCompleted: !s.isCompleted } : s
        )
      );
    }
  };

  const handleRemoveSubtask = async (item: LocalSubtaskItem, index: number) => {
    if (item.id && taskToEdit && onDeleteSubtask) {
      try {
        await onDeleteSubtask(item.id, taskToEdit.id);
        setSubtasks((prev) => prev.filter((s) => s.id !== item.id));
      } catch (err) {
        console.error("Failed to delete subtask:", err);
      }
    } else {
      setSubtasks((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const created = await onAddCategory(newCatName.trim(), newCatColor);
      setCategoryId(created.id);
      setNewCatName("");
      setShowAddCat(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        categoryId: categoryId || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        subtasks: !taskToEdit ? subtasks.map((s) => s.title) : undefined,
      });
      onClose();
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const completedCount = (subtasks || []).filter((s) => s?.isCompleted).length;
  const totalCount = (subtasks || []).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? "Edit Tugas" : "Buat Tugas Baru"}
      description={
        taskToEdit
          ? "Perbarui detail dan progres tugas Anda."
          : "Tambahkan tugas baru beserta prioritas dan subtask."
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Collaborator Role Notice */}
        {!isOwner && (
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-sky-50 border border-sky-200/80 text-sky-800 text-xs font-medium animate-in fade-in">
            <Users className="w-4 h-4 text-sky-600 shrink-0" />
            <p>
              Anda bergabung sebagai <strong>Kolaborator</strong>. Anda dapat memperbarui status tugas, menyelesaikan subtask, dan berdiskusi dengan tim.
            </p>
          </div>
        )}

        {/* Title */}
        <Input
          label="Judul Tugas *"
          placeholder="Misal: Buat mockup desain Figma halaman checkout"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus={isOwner}
          disabled={!isOwner}
        />

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Deskripsi (Opsional)
          </label>
          <textarea
            rows={3}
            placeholder="Tambahkan catatan detail tugas..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!isOwner}
            className={`w-full rounded-xl border text-sm px-3.5 py-2.5 transition-all resize-none shadow-sm ${
              !isOwner
                ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
            }`}
          />
        </div>

        {/* Grid: Priority, Status, Category, Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Priority */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Prioritas
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
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
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 cursor-pointer shadow-sm font-semibold"
            >
              <option value="todo">Belum Mulai</option>
              <option value="in_progress">Sedang Berjalan</option>
              <option value="done">Selesai</option>
            </select>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Kategori
              </label>
              <button
                type="button"
                onClick={() => setShowAddCat(!showAddCat)}
                className="text-[11px] text-indigo-600 hover:underline font-bold"
              >
                + Kategori Baru
              </button>
            </div>
            <div className="relative flex items-center group">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm pl-3.5 pr-16 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 cursor-pointer shadow-sm font-semibold appearance-none transition-all"
              >
                <option value="">Tanpa Kategori</option>
                {(categories || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              
              {/* Native select arrow */}
              <div className="absolute right-3.5 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>

              {/* Delete button when a category is selected (always visible on desktop and mobile) */}
              {categoryId && onDeleteCategory && (
                <button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    if(confirm('Hapus kategori ini? Semua task dengan kategori ini akan menjadi "Tanpa Kategori".')) {
                      await onDeleteCategory(categoryId);
                      setCategoryId("");
                    }
                  }}
                  className="absolute right-8.5 z-10 flex items-center justify-center text-rose-500 hover:text-rose-600 bg-rose-50/90 hover:bg-rose-100 p-1 rounded-lg transition-all shadow-xs"
                  title="Hapus Kategori"
                  aria-label="Hapus Kategori"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Batas Waktu (Deadline)
            </label>
            <div className="relative flex items-center">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 cursor-pointer shadow-sm font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Quick Add Category inline form */}
        {showAddCat && (
          <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 space-y-2 animate-in fade-in duration-150">
            <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-600" /> Tambah Kategori
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Nama kategori..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 rounded-xl bg-white border border-slate-300 px-3 py-1.5 text-xs text-slate-900 font-medium"
              />
              <input
                type="color"
                value={newCatColor}
                onChange={(e) => setNewCatColor(e.target.value)}
                className="w-8 h-8 rounded-xl bg-transparent border-0 cursor-pointer p-0"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCreateCategory}
                disabled={!newCatName.trim()}
              >
                Simpan
              </Button>
            </div>
          </div>
        )}

        {/* Subtasks Checklist */}
        <div className="space-y-2 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700">
              Subtasks Checklist ({completedCount}/{totalCount})
            </label>
            {totalCount > 0 && (
              <span className="text-[11px] text-slate-400 font-medium">
                {Math.round((completedCount / totalCount) * 100)}% selesai
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Tambah subtask manual (tekan enter)..."
              value={newSubtaskInput}
              onChange={(e) => setNewSubtaskInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSubtask();
                }
              }}
              className="flex-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs px-3.5 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddSubtask}
              disabled={!newSubtaskInput.trim()}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>

          {totalCount > 0 && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 mt-2">
              {subtasks.map((st, i) => (
                <div
                  key={st.id || `subtask-${i}`}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs hover:border-slate-300 transition-all group"
                >
                  <div
                    onClick={() => handleToggleSubtask(st, i)}
                    className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer select-none"
                  >
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                        st.isCompleted
                          ? "bg-slate-900 border-slate-900 text-white"
                          : "border-slate-300 bg-white group-hover:border-slate-400"
                      }`}
                    >
                      {st.isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span
                      className={`truncate font-medium transition-all ${
                        st.isCompleted
                          ? "line-through text-slate-400 font-normal"
                          : "text-slate-800"
                      }`}
                    >
                      {st.title}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(st, i)}
                    title="Hapus subtask"
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-slate-100 transition-colors ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Kolaborasi & Diskusi Section */}
        {taskToEdit && (
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" /> Kolaborasi & Diskusi Tim
              </label>
              {onOpenChat && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenChat(taskToEdit);
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
                          {c.user.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{c.user.name}</p>
                          <p className="text-[10px] text-slate-400">{c.user.email}</p>
                        </div>
                      </div>
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => handleKickCollaborator(c.userId)}
                          title="Keluarkan dari kolaborasi"
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
        )}

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
          {dueDate ? (
            <a
              href={calendarService.generateGoogleCalendarUrl({
                title: title || "Tugas Tanpa Judul",
                description,
                dueDate,
                priority,
              })}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 hover:text-indigo-600 transition shadow-sm group whitespace-nowrap shrink-0"
              title="Tambahkan langsung tugas ini ke Google Calendar Anda"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Ke Google Calendar</span>
              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
            </a>
          ) : (
            <div />
          )}

          <div className="flex items-center justify-end gap-2 shrink-0 sm:ml-auto">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {taskToEdit ? "Simpan Perubahan" : "Buat Tugas"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
