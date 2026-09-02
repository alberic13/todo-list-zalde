import React, { useState, useEffect } from "react";
import { Task, Category, TaskPriority, TaskStatus } from "../../types";
import { aiService } from "../../services/aiService";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import {
  Sparkles,
  Plus,
  Trash2,
  Tag,
  CheckCircle,
  Loader2,
} from "lucide-react";

export interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  defaultStatus?: TaskStatus;
  categories: Category[];
  onSubmit: (payload: any) => Promise<void>;
  onAddCategory: (name: string, colorHex?: string) => Promise<Category>;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  defaultStatus = "todo",
  categories,
  onSubmit,
  onAddCategory,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [categoryId, setCategoryId] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#6366f1");

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || "");
      setStatus(taskToEdit.status);
      setPriority(taskToEdit.priority);
      setCategoryId(taskToEdit.categoryId || "");
      setDueDate(
        taskToEdit.dueDate
          ? new Date(taskToEdit.dueDate).toISOString().split("T")[0]
          : ""
      );
      setSubtasks(taskToEdit.subtasks?.map((s) => s.title) || []);
    } else {
      setTitle("");
      setDescription("");
      setStatus(defaultStatus);
      setPriority("medium");
      setCategoryId("");
      setDueDate("");
      setSubtasks([]);
    }
  }, [taskToEdit, defaultStatus, isOpen]);

  const handleAddSubtask = () => {
    if (newSubtaskInput.trim()) {
      setSubtasks([...subtasks, newSubtaskInput.trim()]);
      setNewSubtaskInput("");
    }
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleAiBreakdown = async () => {
    if (!title.trim()) {
      alert("Masukkan judul tugas terlebih dahulu sebelum meminta AI Breakdown!");
      return;
    }

    setIsGeneratingAi(true);
    try {
      const generated = await aiService.breakdown(title.trim(), description.trim() || undefined);
      if (generated && generated.length > 0) {
        setSubtasks((prev) => Array.from(new Set([...prev, ...generated])));
      }
    } catch (err: any) {
      console.error("AI Breakdown failed:", err);
      alert(err.message || "Gagal menghasilkan AI breakdown");
    } finally {
      setIsGeneratingAi(false);
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
        subtasks: !taskToEdit ? subtasks : undefined,
      });
      onClose();
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setIsLoading(false);
    }
  };

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
        {/* Title */}
        <Input
          label="Judul Tugas *"
          placeholder="Misal: Buat mockup desain Figma halaman checkout"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
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
            className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all resize-none shadow-sm"
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
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 cursor-pointer shadow-sm font-semibold"
            >
              <option value="">Tanpa Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
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

        {/* Subtasks Checklist with AI Breakdown Button */}
        {!taskToEdit && (
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Subtasks Checklist ({subtasks.length})
              </label>
              <button
                type="button"
                onClick={handleAiBreakdown}
                disabled={isGeneratingAi || !title.trim()}
                className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-xl border border-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-700" />
                    <span>AI Menganalisis...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>AI Breakdown</span>
                  </>
                )}
              </button>
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
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 mt-2">
                {subtasks.map((st, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs hover:border-slate-300 transition-all"
                  >
                    <span className="text-slate-700 font-medium flex items-center gap-2 truncate">
                      <CheckCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      {st}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(i)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {taskToEdit ? "Simpan Perubahan" : "Buat Tugas"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
